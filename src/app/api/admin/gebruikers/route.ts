import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles, users } from '@/lib/db/schema'
import { eq, isNull, ilike, or, desc, and } from 'drizzle-orm'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q      = searchParams.get('q') ?? ''
  const filter = searchParams.get('filter') ?? 'all'
  const offset = Math.max(0, (parseInt(searchParams.get('p') ?? '1') - 1)) * 50

  const filterWhere =
    filter === 'geblokkeerd' ? eq(profiles.isVisible, false) :
    filter === 'featured'    ? eq(profiles.isFeatured, true) :
    filter === 'pro'         ? eq(profiles.subscriptionTier, 'schipper_pro') :
    filter === 'cwo'         ? eq(profiles.cwoVerified, true) :
    undefined

  const searchWhere = q
    ? or(ilike(profiles.displayName, `%${q}%`), ilike(users.email, `%${q}%`))
    : undefined

  const rows = await db
    .select({
      id:               profiles.id,
      displayName:      profiles.displayName,
      photoUrl:         profiles.photoUrl,
      cwoLevel:         profiles.cwoLevel,
      cwoVerified:      profiles.cwoVerified,
      subscriptionTier: profiles.subscriptionTier,
      isVisible:        profiles.isVisible,
      isFeatured:       profiles.isFeatured,
      isOnboarded:      profiles.isOnboarded,
      lastActive:       profiles.lastActive,
      createdAt:        profiles.createdAt,
      email:            users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(and(isNull(profiles.deletedAt), filterWhere, searchWhere))
    .orderBy(desc(profiles.createdAt))
    .limit(50)
    .offset(offset)

  return Response.json({ gebruikers: rows })
}
