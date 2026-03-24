import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reports, profiles } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'pending'

  const reporter = alias(profiles, 'reporter')
  const reported = alias(profiles, 'reported')

  const rows = await db
    .select({
      id:            reports.id,
      reason:        reports.reason,
      description:   reports.description,
      status:        reports.status,
      createdAt:     reports.createdAt,
      reviewedAt:    reports.reviewedAt,
      reporterId:    reports.reporterId,
      reportedId:    reports.reportedId,
      reporterName:  reporter.displayName,
      reporterPhoto: reporter.photoUrl,
      reportedName:  reported.displayName,
      reportedPhoto: reported.photoUrl,
    })
    .from(reports)
    .innerJoin(reporter, eq(reports.reporterId, reporter.id))
    .innerJoin(reported, eq(reports.reportedId, reported.id))
    .where(filter !== 'all' ? eq(reports.status, filter) : undefined)
    .orderBy(desc(reports.createdAt))
    .limit(100)

  return Response.json({ meldingen: rows })
}
