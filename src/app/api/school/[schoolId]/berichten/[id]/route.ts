import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolMessages, schoolMessageReplies, schoolMemberships, isStaff } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'

// ─── GET /api/school/[schoolId]/berichten/[id] ───────────────────────────────
// Staff ziet één verzonden bericht mét de reacties van de zeiler.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string; id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId, id } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const [bericht] = await db
    .select({
      id: schoolMessages.id, titel: schoolMessages.titel, bericht: schoolMessages.bericht,
      fromRole: schoolMessages.fromRole, createdAt: schoolMessages.createdAt,
      lidNaam: schoolMemberships.userId,
    })
    .from(schoolMessages)
    .innerJoin(schoolMemberships, eq(schoolMessages.membershipId, schoolMemberships.id))
    .where(and(eq(schoolMessages.id, id), eq(schoolMessages.schoolId, schoolId)))
    .limit(1)
  if (!bericht) return Response.json({ error: 'Niet gevonden' }, { status: 404 })

  const reacties = await db
    .select({
      id: schoolMessageReplies.id, bericht: schoolMessageReplies.bericht,
      gelezenDoorSchoolOp: schoolMessageReplies.gelezenDoorSchoolOp,
      createdAt: schoolMessageReplies.createdAt,
    })
    .from(schoolMessageReplies)
    .where(eq(schoolMessageReplies.messageId, id))
    .orderBy(schoolMessageReplies.createdAt)

  return Response.json({ ...bericht, reacties })
}
