import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolInvites, schoolMemberships, users, sailingSchools, isStaff } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { ledenInviteSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email'
import { schoolInviteEmail, schoolInviteText } from '@/emails/templates'
import { and, eq, isNull, desc } from 'drizzle-orm'

const BASE = process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'
const GELDIG_DAGEN = 30

// Persoonlijke uitnodiging: het token geeft toegang tot een schoollidmaatschap,
// dus ruimer dan het korte token van de gedeelde uitnodigingslink.
function genereerToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// GET /api/school/[schoolId]/leden/invite — openstaande persoonlijke uitnodigingen
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const rows = await db
    .select({
      id:         schoolInvites.id,
      email:      schoolInvites.email,
      naam:       schoolInvites.naam,
      role:       schoolInvites.role,
      createdAt:  schoolInvites.createdAt,
      expiresAt:  schoolInvites.expiresAt,
      acceptedAt: schoolInvites.acceptedAt,
    })
    .from(schoolInvites)
    .where(and(
      eq(schoolInvites.schoolId, schoolId),
      isNull(schoolInvites.deletedAt),
      isNull(schoolInvites.acceptedAt),
    ))
    .orderBy(desc(schoolInvites.createdAt))

  // Alleen persoonlijke uitnodigingen (email gevuld); gedeelde links leven op /invite
  return Response.json({ uitnodigingen: rows.filter(r => r.email) })
}

// POST /api/school/[schoolId]/leden/invite — nodig iemand per mail uit
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const parsed = ledenInviteSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const email = parsed.data.email.toLowerCase().trim()

  const [school] = await db
    .select({ id: sailingSchools.id, name: sailingSchools.name })
    .from(sailingSchools)
    .where(eq(sailingSchools.id, schoolId))
    .limit(1)
  if (!school) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

  // Al lid? Dan heeft uitnodigen geen zin.
  const [bestaand] = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .innerJoin(users, eq(users.id, schoolMemberships.userId))
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(users.email, email),
      isNull(schoolMemberships.deletedAt),
    ))
    .limit(1)
  if (bestaand) {
    return Response.json({ error: 'Deze persoon is al lid van deze school' }, { status: 409 })
  }

  const expiresAt = new Date(Date.now() + GELDIG_DAGEN * 86_400_000)
  const token     = genereerToken()

  // Openstaande uitnodiging voor dit adres hergebruiken: opnieuw uitnodigen moet
  // een nieuwe mail sturen, geen tweede rij die naast de eerste blijft staan.
  const [openstaand] = await db
    .select({ id: schoolInvites.id })
    .from(schoolInvites)
    .where(and(
      eq(schoolInvites.schoolId, schoolId),
      eq(schoolInvites.email, email),
      isNull(schoolInvites.deletedAt),
      isNull(schoolInvites.acceptedAt),
    ))
    .limit(1)

  let invite
  if (openstaand) {
    ;[invite] = await db
      .update(schoolInvites)
      .set({
        token, expiresAt,
        naam: parsed.data.naam ?? null,
        role: parsed.data.role,
        createdBy: session.user.id,
        createdAt: new Date(),
      })
      .where(eq(schoolInvites.id, openstaand.id))
      .returning()
  } else {
    ;[invite] = await db
      .insert(schoolInvites)
      .values({
        schoolId,
        token,
        email,
        naam:      parsed.data.naam ?? null,
        role:      parsed.data.role,
        maxUses:   1,
        expiresAt,
        createdBy: session.user.id,
      })
      .returning()
  }

  const url = `${BASE}/uitnodiging/${token}`
  const mail = await sendEmail({
    to:      email,
    subject: `Uitnodiging van ${school.name}`,
    html:    schoolInviteEmail({
      schoolName: school.name,
      url,
      naam: parsed.data.naam,
      role: parsed.data.role,
      uitnodigerNaam: session.user.name,
    }),
    text:    schoolInviteText({ schoolName: school.name, url, role: parsed.data.role }),
  })

  // De uitnodiging staat al in de database. Als de mail faalt melden we dat
  // eerlijk terug, zodat staff de link handmatig kan delen in plaats van te
  // denken dat er iets verstuurd is.
  return Response.json({
    uitnodiging: {
      id: invite.id, email, naam: invite.naam, role: invite.role,
      createdAt: invite.createdAt, expiresAt: invite.expiresAt, acceptedAt: null,
    },
    mailVerstuurd: mail.ok,
    mailFout:      mail.ok ? undefined : mail.error,
    url,
  }, { status: 201 })
}

// DELETE /api/school/[schoolId]/leden/invite?id=... — uitnodiging intrekken
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id vereist' }, { status: 400 })

  await db
    .update(schoolInvites)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(schoolInvites.id, id),
      eq(schoolInvites.schoolId, schoolId),
      isNull(schoolInvites.deletedAt),
    ))

  return Response.json({ ok: true })
}
