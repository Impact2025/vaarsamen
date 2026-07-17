import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatIssueHistory, users } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { eq, and } from 'drizzle-orm'

// GET /api/school/[schoolId]/meldingen/[id]/historie
// Audit-trail van een melding. Toegankelijk voor staff + klusser.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, id } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  const mag = !!membership && ['eigenaar', 'instructeur', 'klusser'].includes(membership.role)
  if (!mag) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const rows = await db
    .select({
      hist:   boatIssueHistory,
      actor:  { id: users.id, name: users.name, email: users.email },
    })
    .from(boatIssueHistory)
    .leftJoin(users, eq(users.id, boatIssueHistory.actorId))
    .where(eq(boatIssueHistory.issueId, id))
    .orderBy(boatIssueHistory.createdAt)

  return Response.json({ historie: rows })
}
