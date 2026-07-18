import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolMessages, schoolMemberships, isStaff } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { sendPushToProfile } from '@/lib/push'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

// ─── GET /api/school/[schoolId]/berichten ────────────────────────────────────
// Staff (eigenaar/instructeur) ziet alle verstuurde berichten van deze school.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const rows = await db
    .select({
      id: schoolMessages.id,
      schoolId: schoolMessages.schoolId,
      membershipId: schoolMessages.membershipId,
      fromRole: schoolMessages.fromRole,
      titel: schoolMessages.titel,
      bericht: schoolMessages.bericht,
      gelezenOp: schoolMessages.gelezenOp,
      createdAt: schoolMessages.createdAt,
      reacties: sql<number>`(select count(*) from school_message_replies r where r.message_id = ${schoolMessages.id})::int`,
    })
    .from(schoolMessages)
    .where(eq(schoolMessages.schoolId, schoolId))
    .orderBy(schoolMessages.createdAt)

  return Response.json({ berichten: rows })
}

// ─── POST /api/school/[schoolId]/berichten ───────────────────────────────────
// Staff stuurt een bericht naar één of meerdere leden van de school.

const CreateSchema = z.object({
  lidIds:   z.array(z.string().min(1)).min(1),
  titel:    z.string().min(1).max(120),
  bericht:  z.string().min(1).max(2000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Ongeldige invoer' }, { status: 400 })

  const { lidIds, titel, bericht } = parsed.data

  // Controleer dat de doel-leden écht bij deze school horen (geen cross-school leak).
  const leden = await db
    .select({ id: schoolMemberships.id, userId: schoolMemberships.userId })
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      isNull(schoolMemberships.deletedAt),
    ))

  const geldig = new Map(leden.map(l => [l.id, l.userId]))
  const doelen = lidIds.filter(id => geldig.has(id))
  if (doelen.length === 0) {
    return Response.json({ error: 'Geen geldige leden geselecteerd' }, { status: 400 })
  }

  const nieuw = await db
    .insert(schoolMessages)
    .values(doelen.map(membershipId => ({
      schoolId,
      membershipId,
      fromRole: membership.role,
      titel,
      bericht,
    })))
    .returning()

  // Push-notificatie naar elk lid (best-effort; faalt stil bij geen subscription).
  const doelUserIds = doelen.map(id => geldig.get(id)!).filter(Boolean)
  await Promise.allSettled(doelUserIds.map(async (uid) => {
    const profile = await getProfileByUserId(uid)
    if (profile) {
      await sendPushToProfile(profile.id, {
        title: `Bericht van je zeilschool: ${titel}`,
        body:  bericht.length > 120 ? bericht.slice(0, 117) + '…' : bericht,
        url:   '/school-berichten',
      })
    }
  }))

  return Response.json({ verstuurd: nieuw.length, berichten: nieuw }, { status: 201 })
}
