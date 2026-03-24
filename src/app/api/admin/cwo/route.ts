import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles, users } from '@/lib/db/schema'
import { eq, isNull, and, sql, desc } from 'drizzle-orm'

// GET /api/admin/cwo — profielen met CWO document wachtend op verificatie
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'wachtend'

  const baseWhere = and(
    isNull(profiles.deletedAt),
    sql`${profiles.cwoDocumentUrl} is not null`,
  )

  const filterWhere =
    filter === 'wachtend'    ? eq(profiles.cwoVerified, false) :
    filter === 'goedgekeurd' ? eq(profiles.cwoVerified, true)  :
    undefined

  const rows = await db
    .select({
      id:             profiles.id,
      displayName:    profiles.displayName,
      photoUrl:       profiles.photoUrl,
      cwoLevel:       profiles.cwoLevel,
      cwoVerified:    profiles.cwoVerified,
      cwoDocumentUrl: profiles.cwoDocumentUrl,
      cwoVerifiedAt:  profiles.cwoVerifiedAt,
      createdAt:      profiles.createdAt,
      email:          users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(and(baseWhere, filterWhere))
    .orderBy(desc(profiles.createdAt))
    .limit(50)

  return Response.json({ aanvragen: rows })
}
