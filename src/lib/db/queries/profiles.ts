import {
  and, eq, isNull, ne, notInArray, notExists, exists,
  inArray, desc, sql, or, gte, lte,
} from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { profiles, swipes, boats, availability } from '@/lib/db/schema'
import { computeMatchScore, type ScoringProfile } from '@/lib/matching'
import type { CWOLevel, LookingFor, MatchReason, SailingRole } from '@/types'

/**
 * Gecached profiel ophalen via userId.
 * TTL: 60 seconden. Invalideer met revalidateTag('profiles') na profiel-wijziging.
 */
export function getProfileByUserId(userId: string) {
  return unstable_cache(
    async () => {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
        .limit(1)
      return profile ?? null
    },
    [`profile-by-user-${userId}`],
    { revalidate: 60, tags: ['profiles'] },
  )()
}

/**
 * Gecached profiel ophalen via profiel-ID.
 * TTL: 60 seconden. Invalideer met revalidateTag('profiles') na profiel-wijziging.
 */
export function getProfileById(id: string) {
  return unstable_cache(
    async () => {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)))
        .limit(1)
      return profile ?? null
    },
    [`profile-by-id-${id}`],
    { revalidate: 60, tags: ['profiles'] },
  )()
}

// ─── DISCOVERY FILTERS ───────────────────────────────────────────────────────

interface DiscoveryFilters {
  cwoLevels?:    string[]
  sailingAreas?: string[]
  role?:         string
  limit?:        number
  myLat?:        number | null
  myLng?:        number | null
  radiusKm?:     number | null
  // Strikte filter: toon alleen profielen beschikbaar op deze datum
  availableDate?: string          // YYYY-MM-DD
  // Scoringscontext (huidige gebruiker) — optioneel; feed wordt gesorteerd op score als aanwezig
  myCwoLevel?:   string
  myRole?:       string
  myLookingFor?: string
  myExperience?: number | null
}

// Venster voor beschikbaarheids-overlap scoring: 60 dagen vooruit
const AVAIL_DAYS_AHEAD = 60

/**
 * Haalt discovery feed op, gesorteerd op compatibiliteitsscore.
 *
 * Pipeline:
 *   1. Sluit eigen profiel, al-geswiped, soft-deleted en onzichtbare profielen uit
 *   2. Filter op vaargebied-overlap en afstand (Haversine)
 *   3. Optioneel: filter op beschikbare datum (strict)
 *   4. Cold-start aanvulling met featured profielen indien feed te klein
 *   5. Haal boten op (batch)
 *   6. Haal beschikbaarheidsdata op voor scoring (parallel)
 *   7. Bereken compatibiliteitsscore per profiel
 *   8. Sorteer op score DESC, lastActive als tiebreaker
 */
export async function getDiscoveryFeed(
  currentProfileId: string,
  filters:          DiscoveryFilters = {},
) {
  const limit = Math.min(filters.limit ?? 20, 20)

  // NOT EXISTS subquery — efficiënt bij elk volume swipes
  const notAlreadySwiped = notExists(
    db.select({ one: sql<number>`1` })
      .from(swipes)
      .where(and(
        eq(swipes.swiperId, currentProfileId),
        eq(swipes.swipedId, profiles.id),
      ))
  )

  const conditions = [
    isNull(profiles.deletedAt),
    eq(profiles.isVisible, true),
    eq(profiles.isOnboarded, true),
    ne(profiles.id, currentProfileId),
    notAlreadySwiped,
  ]

  // Vaargebieden filter
  if (filters.sailingAreas && filters.sailingAreas.length > 0) {
    const areas = filters.sailingAreas
    conditions.push(
      or(
        sql`array_length(${profiles.sailingAreas}, 1) IS NULL`,
        sql`${profiles.sailingAreas} && ARRAY[${sql.join(areas.map(a => sql`${a}`), sql`, `)}]::text[]`
      )!
    )
  }

  // Afstandsfilter (Haversine)
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

  // Strikte beschikbaarheidsdatum-filter: alleen profielen die op deze dag vrij zijn
  if (filters.availableDate) {
    const d = filters.availableDate
    conditions.push(
      exists(
        db.select({ one: sql<number>`1` })
          .from(availability)
          .where(and(
            eq(availability.profileId, profiles.id),
            eq(availability.date, d),
            eq(availability.isAvailable, true),
          ))
      )
    )
  }

  let result = await db
    .select()
    .from(profiles)
    .where(and(...conditions))
    .orderBy(desc(profiles.lastActive))
    .limit(limit)

  // Cold-start: vul aan met featured profielen als feed te klein is
  if (result.length < 5) {
    const alreadyShown = [currentProfileId, ...result.map(p => p.id)]
    const featured = await db
      .select()
      .from(profiles)
      .where(and(
        isNull(profiles.deletedAt),
        eq(profiles.isFeatured, true),
        notInArray(profiles.id, alreadyShown),
        notAlreadySwiped,
      ))
      .limit(limit - result.length)
    result = [...result, ...featured]
  }

  const profileIds = result.map(p => p.id)
  if (profileIds.length === 0) return []

  // ── Boten en beschikbaarheid parallel ophalen ─────────────────────────────

  const today    = new Date().toISOString().slice(0, 10)
  const cutoffDt = new Date()
  cutoffDt.setDate(cutoffDt.getDate() + AVAIL_DAYS_AHEAD)
  const cutoff   = cutoffDt.toISOString().slice(0, 10)

  const [profileBoats, myAvailRows, theirAvailRows] = await Promise.all([

    db.select().from(boats).where(inArray(boats.profileId, profileIds)),

    // Mijn beschikbare data — voor overlap-scoring
    db.select({ date: availability.date })
      .from(availability)
      .where(and(
        eq(availability.profileId, currentProfileId),
        eq(availability.isAvailable, true),
        gte(availability.date, today),
        lte(availability.date, cutoff),
      )),

    // Kandidaten hun beschikbare data — batch
    db.select({ profileId: availability.profileId, date: availability.date })
      .from(availability)
      .where(and(
        inArray(availability.profileId, profileIds),
        eq(availability.isAvailable, true),
        gte(availability.date, today),
        lte(availability.date, cutoff),
      )),
  ])

  // Boten per profiel
  const boatsByProfile = profileBoats.reduce((acc, boat) => {
    if (!acc[boat.profileId]) acc[boat.profileId] = []
    acc[boat.profileId].push(boat)
    return acc
  }, {} as Record<string, typeof profileBoats>)

  // Beschikbare data per kandidaat-profiel
  const theirDatesByProfile = new Map<string, Set<string>>()
  for (const row of theirAvailRows) {
    if (!theirDatesByProfile.has(row.profileId)) {
      theirDatesByProfile.set(row.profileId, new Set())
    }
    theirDatesByProfile.get(row.profileId)!.add(row.date)
  }
  const myDates = new Set(myAvailRows.map(r => r.date))

  // ── Scoringscontext van de huidige gebruiker ──────────────────────────────

  const meForScoring: ScoringProfile | null =
    filters.myCwoLevel && filters.myRole && filters.myLookingFor
      ? {
          sailingRole:   filters.myRole       as SailingRole,
          cwoLevel:      filters.myCwoLevel   as CWOLevel,
          lookingFor:    filters.myLookingFor as LookingFor,
          sailingAreas:  filters.sailingAreas ?? [],
          experience:    filters.myExperience ?? null,
          averageRating: null,
          reviewCount:   0,
        }
      : null

  // ── Score berekenen per kandidaat-profiel ─────────────────────────────────

  const scored = result.map(profile => {
    const profileBoatList = boatsByProfile[profile.id] ?? []

    if (!meForScoring) {
      return { ...profile, boats: profileBoatList, matchScore: 0, matchReasons: [] as MatchReason[] }
    }

    const them: ScoringProfile = {
      sailingRole:   (profile.sailingRole ?? 'beide') as SailingRole,
      cwoLevel:      (profile.cwoLevel    ?? 'geen')  as CWOLevel,
      lookingFor:    (profile.lookingFor  ?? 'alles') as LookingFor,
      sailingAreas:  profile.sailingAreas  ?? [],
      experience:    profile.experience    ?? null,
      averageRating: profile.averageRating ?? null,
      reviewCount:   profile.reviewCount   ?? 0,
    }

    const theirDates = theirDatesByProfile.get(profile.id) ?? new Set<string>()
    const { score, reasons } = computeMatchScore(meForScoring, them, myDates, theirDates)

    return { ...profile, boats: profileBoatList, matchScore: score, matchReasons: reasons }
  })

  // ── Sorteer op score DESC, lastActive als tiebreaker ─────────────────────

  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
    const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0
    const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0
    return bTime - aTime
  })

  return scored
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
