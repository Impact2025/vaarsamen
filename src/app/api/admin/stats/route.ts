import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles, tochten, matches, reports } from '@/lib/db/schema'
import { count, eq, and, isNull, sql } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    [totaal],
    [actiefTochten],
    [alleTochten],
    [alleMatches],
    [pendingReports],
    [pendingCWO],
    [proUsers],
    [nieuwDezeWeek],
  ] = await Promise.all([
    db.select({ n: count() }).from(profiles).where(isNull(profiles.deletedAt)),
    db.select({ n: count() }).from(tochten).where(and(eq(tochten.status, 'open'), isNull(tochten.deletedAt))),
    db.select({ n: count() }).from(tochten).where(isNull(tochten.deletedAt)),
    db.select({ n: count() }).from(matches),
    db.select({ n: count() }).from(reports).where(eq(reports.status, 'pending')),
    db.select({ n: count() }).from(profiles).where(and(
      sql`${profiles.cwoDocumentUrl} is not null`,
      eq(profiles.cwoVerified, false),
      isNull(profiles.deletedAt),
    )),
    db.select({ n: count() }).from(profiles).where(and(
      sql`${profiles.subscriptionTier} != 'free'`,
      isNull(profiles.deletedAt),
    )),
    db.select({ n: count() }).from(profiles).where(and(
      sql`${profiles.createdAt} > ${weekAgo}::timestamptz`,
      isNull(profiles.deletedAt),
    )),
  ])

  return Response.json({
    totalUsers:     totaal.n,
    activeTochten:  actiefTochten.n,
    totalTochten:   alleTochten.n,
    totalMatches:   alleMatches.n,
    pendingReports: pendingReports.n,
    pendingCWO:     pendingCWO.n,
    proUsers:       proUsers.n,
    newUsersWeek:   nieuwDezeWeek.n,
  })
}
