import { db } from '@/lib/db'
import { newsletterSubscribers, schoolMemberships, users } from '@/lib/db/schema'
import { getSchoolById } from '@/lib/db/queries/school'
import { subscriberSchema } from '@/lib/validations'
import { sendEmailAsync } from '@/lib/email'
import { newsletterConfirmEmail, newsletterConfirmText } from '@/emails/templates'
import { eq, and, isNull } from 'drizzle-orm'
import { randomBytes } from 'crypto'

// POST /api/school/[schoolId]/newsletter/subscribe — publieke inschrijving via website
// (geen auth). Start double-opt-in: bevestigingsmail wordt verstuurd.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

  const body = await req.json()
  const parsed = subscriberSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })

  const email = parsed.data.email.toLowerCase().trim()

  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(and(eq(newsletterSubscribers.schoolId, schoolId), eq(newsletterSubscribers.email, email)))
    .limit(1)

  if (existing && existing.status === 'actief') {
    return Response.json({ ok: true, status: 'al_actief', message: 'Dit e-mailadres is al ingeschreven.' })
  }

  // Koppel aan bestaand lid wanneer mogelijk
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

  if (existing) {
    await db.update(newsletterSubscribers).set({ status: 'pending', token, naam: parsed.data.naam ?? existing.naam }).where(eq(newsletterSubscribers.id, existing.id))
  } else {
    await db.insert(newsletterSubscribers).values({
      schoolId,
      membershipId,
      email,
      naam: parsed.data.naam ?? lidUser?.name ?? null,
      status: 'pending',
      token,
      aangemeldVia: 'website',
    })
  }

  const confirmUrl = `${process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'}/api/school/${schoolId}/newsletter/confirm?token=${token}`
  sendEmailAsync({
    to: email,
    subject: `Bevestig je inschrijving voor de nieuwsbrief van ${school.name}`,
    html: newsletterConfirmEmail({ schoolName: school.name, confirmUrl }),
    text: newsletterConfirmText({ schoolName: school.name, confirmUrl }),
  })

  return Response.json({ ok: true, status: 'pending', message: 'Controleer je inbox om je inschrijving te bevestigen.' }, { status: 201 })
}
