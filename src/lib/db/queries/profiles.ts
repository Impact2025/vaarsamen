import { and, eq, isNull, ne, notInArray, desc, asc, sql, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles, swipes, matches, boats } from '@/lib/db/schema'

export async function getProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)
  return profile ?? null
}

export async function getProfileById(id: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)))
    .limit(1)
  return profile ?? null
}

interface DiscoveryFilters {
  cwoLevels?:    string[]
  sailingAreas?: string[]
  date?:         string
  role?:         string
  limit?:        number
  myLat?:        number | null
  myLng?:        number | null
  radiusKm?:     number | null
}

/**
 * Haalt discovery feed op:
 * - Sluit eigen profiel uit
 * - Sluit al-geswiped profielen uit
 * - Sluit soft-deleted profielen uit
 * - Vult aan met featured profielen als feed te klein is (cold-start strategie)
 */
export async function getDiscoveryFeed(
  currentProfileId: string,
  filters:          DiscoveryFilters = {}
) {
  const limit = Math.min(filters.limit ?? 20, 20)

  // Haal IDs op die al geswiped zijn
  const swipedIds = await db
    .select({ swipedId: swipes.swipedId })
    .from(swipes)
    .where(eq(swipes.swiperId, currentProfileId))

  const excludeIds = [currentProfileId, ...swipedIds.map(s => s.swipedId)]

  const conditions = [
    isNull(profiles.deletedAt),
    eq(profiles.isVisible, true),
    eq(profiles.isOnboarded, true),
    notInArray(profiles.id, excludeIds),
  ]

  // Vaargebieden filter — alleen als huidige gebruiker gebieden heeft ingesteld
  // Profielen zonder vaargebieden worden altijd getoond (inclusief)
  if (filters.sailingAreas && filters.sailingAreas.length > 0) {
    const areas = filters.sailingAreas
    conditions.push(
      or(
        sql`array_length(${profiles.sailingAreas}, 1) IS NULL`,
        sql`${profiles.sailingAreas} && ARRAY[${sql.join(areas.map(a => sql`${a}`), sql`, `)}]::text[]`
      )!
    )
  }

  // Afstandsfilter (Haversine) — alleen als huidige gebruiker locatie heeft
  // Profielen zonder locatie worden altijd getoond (inclusief)
  if (filters.myLat != null && filters.myLng != null && filters.radiusKm && filters.radiusKm < 500) {
    const { myLat, myLng, radiusKm } = filters
    conditions.push(
      or(
        isNull(profiles.lat),
        isNull(profiles.lng),
        sql`(6371 * acos(LEAST(1.0,
          cos(radians(${myLat})) * cos(radians(${profiles.lat})) * cos(radians(${profiles.lng}) - radians(${myLng}))
          + sin(radians(${myLat})) * sin(radians(${profiles.lat}))
        ))) <= ${radiusKm}`
      )!
    )
  }

  let result = await db
    .select()
    .from(profiles)
    .where(and(...conditions))
    .orderBy(desc(profiles.lastActive))
    .limit(limit)

  // Cold-start strategie: vul aan met featured profielen als feed te klein is
  if (result.length < 5) {
    const featuredIds = result.map(p => p.id)
    const alreadyExcluded = [...excludeIds, ...featuredIds]

    const featured = await db
      .select()
      .from(profiles)
      .where(and(
        isNull(profiles.deletedAt),
        eq(profiles.isFeatured, true),
        notInArray(profiles.id, alreadyExcluded),
      ))
      .limit(limit - result.length)

    result = [...result, ...featured]
  }

  // Haal boten op voor deze profielen
  const profileIds = result.map(p => p.id)
  if (profileIds.length === 0) return []

  const profileBoats = await db
    .select()
    .from(boats)
    .where(notInArray(boats.profileId, profileIds.length > 0 ? [] : ['placeholder']))

  const boatsByProfile = profileBoats.reduce((acc, boat) => {
    if (!acc[boat.profileId]) acc[boat.profileId] = []
    acc[boat.profileId].push(boat)
    return acc
  }, {} as Record<string, typeof profileBoats>)

  return result.map(profile => ({
    ...profile,
    boats: boatsByProfile[profile.id] ?? [],
  }))
}

export async function softDeleteProfile(profileId: string, deletedBy: string) {
  await db
    .update(profiles)
    .set({
      deletedAt: new Date(),
      deletedBy,
      isVisible: false,
    })
    .where(eq(profiles.id, profileId))
}
