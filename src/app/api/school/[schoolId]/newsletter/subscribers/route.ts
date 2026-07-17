import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletterSubscribers, schoolMemberships, users , isStaff } from '@/lib/db/schema'
import { getSchoolMembership, getSchoolById, getSubscribers } from '@/lib/db/queries/school'
import { subscriberSchema } from '@/lib/validations'
import { sendEmailAsync } from '@/lib/email'
import { newsletterConfirmEmail, newsletterConfirmText } from '@/emails/templates'
import { eq, and, isNull } from 'drizzle-orm'
import { randomBytes } from 'crypto'

// GET /api/school/[schoolId]/newsletter/subscribers — lijst abonnees (eigenaar/instructeur)
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

  const subs = await getSubscribers(schoolId)
  return Response.json({ subscribers: subs })
}

// POST /api/school/[schoolId]/newsletter/subscribers — abonnee toevoegen (double-opt-in)
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

  const body = await req.json()
  const parsed = subscriberSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const school = await getSchoolById(schoolId)
  if (!school) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

  const email = parsed.data.email.toLowerCase().trim()

  // Bestaande abonnee?
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(and(eq(newsletterSubscribers.schoolId, schoolId), eq(newsletterSubscribers.email, email)))
    .limit(1)

  if (existing) {
    if (existing.status === 'actief') {
      return Response.json({ error: 'Dit e-mailadres is al ingeschreven' }, { status: 409 })
    }
    // Her-verstuur bevestiging
    const token = existing.token ?? randomBytes(24).toString('hex')
    await db.update(newsletterSubscribers).set({ token, status: 'pending' }).where(eq(newsletterSubscribers.id, existing.id))
    await sendConfirm(email, parsed.data.naam ?? existing.naam ?? null, school.name, token, schoolId)
    return Response.json({ ok: true, status: 'herzonden' })
  }

  // Koppel aan lid wanneer dit e-mailadres een VaarSamen-account/lid is
  const [lidUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  let membershipId: string | null = null
  if (lidUser) {
    const [m] = await db
      .select({ id: schoolMemberships.id })
      .from(schoolMemberships)
      .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, lidUser.id), isNull(schoolMemberships.deletedAt)))
      .limit(1)
    membershipId = m?.id ?? null
  }

  const token = randomBytes(24).toString('hex')
  const [created] = await db.insert(newsletterSubscribers).values({
    schoolId,
    membershipId,
    email,
    naam: parsed.data.naam ?? lidUser?.name ?? null,
    status: 'pending',
    token,
    aangemeldVia: 'school',
  }).returning()

  await sendConfirm(email, created.naam ?? null, school.name, token, schoolId)

  return Response.json({ ok: true, subscriber: created }, { status: 201 })
}

async function sendConfirm(email: string, naam: string | null, schoolName: string, token: string, schoolId: string) {
  const confirmUrl = `${process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'}/school/${schoolId}/newsletter/confirm?token=${token}`
  sendEmailAsync({
    to: email,
    subject: `Bevestig je inschrijving voor de nieuwsbrief van ${schoolName}`,
    html: newsletterConfirmEmail({ schoolName, confirmUrl }),
    text: newsletterConfirmText({ schoolName, confirmUrl }),
  })
}

// DELETE /api/school/[schoolId]/newsletter/subscribers?id=... — abonnee verwijderen (eigenaar/instructeur)
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

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id vereist' }, { status: 400 })

  await db.delete(newsletterSubscribers)
    .where(and(eq(newsletterSubscribers.id, id), eq(newsletterSubscribers.schoolId, schoolId)))

  return Response.json({ ok: true })
}
