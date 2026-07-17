import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolMemberships, users, sailingSchools, isStaff } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { ledenBeoordelingSchema } from '@/lib/validations'
import { sendEmailAsync } from '@/lib/email'
import {
  membershipApprovedEmail, membershipApprovedText,
  membershipRejectedEmail, membershipRejectedText,
} from '@/emails/templates'
import { and, eq, isNull } from 'drizzle-orm'

const BASE = process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'

// POST /api/school/[schoolId]/leden/[userId]/beoordeling
// Body: { actie: 'goedkeuren' } | { actie: 'afwijzen', reden: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; userId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, userId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const parsed = ledenBeoordelingSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [lid] = await db
    .select({
      id:     schoolMemberships.id,
      status: schoolMemberships.status,
      email:  users.email,
      naam:   users.name,
    })
    .from(schoolMemberships)
    .innerJoin(users, eq(users.id, schoolMemberships.userId))
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.userId, userId),
      isNull(schoolMemberships.deletedAt),
    ))
    .limit(1)

  if (!lid) return Response.json({ error: 'Lid niet gevonden' }, { status: 404 })

  // Alleen aanmeldingen die daadwerkelijk wachten mogen beoordeeld worden. Zo kan
  // een tweede klik op 'goedkeuren' geen tweede mail sturen.
  if (lid.status !== 'wacht_op_goedkeuring') {
    return Response.json({
      error: `Dit lid wacht niet op beoordeling (status: ${lid.status})`,
    }, { status: 409 })
  }

  const [school] = await db
    .select({ name: sailingSchools.name })
    .from(sailingSchools).where(eq(sailingSchools.id, schoolId)).limit(1)
  const schoolNaam = school?.name ?? 'de zeilschool'

  if (parsed.data.actie === 'goedkeuren') {
    await db.update(schoolMemberships)
      .set({
        status:         'goedgekeurd',
        approvedAt:     new Date(),
        approvedBy:     session.user.id,
        afwijzingReden: null,
      })
      .where(eq(schoolMemberships.id, lid.id))

    const url = `${BASE}/school/${schoolId}/verhuur`
    sendEmailAsync({
      to:      lid.email,
      subject: `Je aanmelding bij ${schoolNaam} is goedgekeurd`,
      html:    membershipApprovedEmail({ schoolName: schoolNaam, url, naam: lid.naam }),
      text:    membershipApprovedText({ schoolName: schoolNaam, url }),
    })

    return Response.json({ status: 'goedgekeurd' })
  }

  await db.update(schoolMemberships)
    .set({
      status:         'afgewezen',
      approvedAt:     null,
      approvedBy:     session.user.id,
      afwijzingReden: parsed.data.reden,
    })
    .where(eq(schoolMemberships.id, lid.id))

  sendEmailAsync({
    to:      lid.email,
    subject: `Over je aanmelding bij ${schoolNaam}`,
    html:    membershipRejectedEmail({ schoolName: schoolNaam, reden: parsed.data.reden, naam: lid.naam }),
    text:    membershipRejectedText({ schoolName: schoolNaam, reden: parsed.data.reden }),
  })

  return Response.json({ status: 'afgewezen' })
}
