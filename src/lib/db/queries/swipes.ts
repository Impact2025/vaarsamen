import { and, eq, isNull, sql } from 'drizzle-orm'
import { dbPool } from '@/lib/db'
import { swipes, swipeDailyCounts, matches } from '@/lib/db/schema'

const FREE_DAILY_LIMIT    = 20
const PREMIUM_DAILY_LIMIT = 100

/**
 * Atomaire swipe registratie met race-condition-vrije limiet check.
 * Gebruikt een DB-transactie + upsert zodat gelijktijdige requests
 * nooit meer swipes toestaan dan het dagelijks maximum.
 */
export async function recordSwipeAtomic(
  swiperId:   string,
  swipedId:   string,
  action:     'like' | 'pass' | 'superlike',
  isPremium:  boolean = false
) {
  const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT

  return dbPool.transaction(async (tx) => {
    const today = new Date().toISOString().slice(0, 10)

    // Atomaire upsert: verhoog counter, geef nieuwe waarde terug
    const [countRow] = await tx
      .insert(swipeDailyCounts)
      .values({ profileId: swiperId, date: today, count: 1 })
      .onConflictDoUpdate({
        target:  [swipeDailyCounts.profileId, swipeDailyCounts.date],
        set:     { count: sql`${swipeDailyCounts.count} + 1` },
      })
      .returning()

    if (countRow.count > dailyLimit) {
      throw new Error('SWIPE_LIMIT_REACHED')
    }

    // Sla swipe op
    await tx.insert(swipes).values({ swiperId, swipedId, action })

    // Check wederzijdse like
    let matchId: string | null = null

    if (action === 'like' || action === 'superlike') {
      const [reciprocal] = await tx
        .select({ id: swipes.id })
        .from(swipes)
        .where(and(
          eq(swipes.swiperId, swipedId),
          eq(swipes.swipedId, swiperId),
          eq(swipes.action, 'like'),
        ))
        .limit(1)

      if (!reciprocal) {
        // Controleer ook superlike als wederzijdse match
        const [reciprocalSuper] = await tx
          .select({ id: swipes.id })
          .from(swipes)
          .where(and(
            eq(swipes.swiperId, swipedId),
            eq(swipes.swipedId, swiperId),
            eq(swipes.action, 'superlike'),
          ))
          .limit(1)

        if (reciprocalSuper) {
          const [match] = await tx
            .insert(matches)
            .values({ profileAId: swiperId, profileBId: swipedId })
            .returning()
          matchId = match.id
        }
      } else {
        const [match] = await tx
          .insert(matches)
          .values({ profileAId: swiperId, profileBId: swipedId })
          .returning()
        matchId = match.id
      }
    }

    return {
      matchId,
      swipesUsedToday: countRow.count,
      swipesRemaining: Math.max(0, dailyLimit - countRow.count),
    }
  })
}

export async function getSwipesRemainingToday(profileId: string, isPremium: boolean = false) {
  const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT
  const today = new Date().toISOString().slice(0, 10)

  const [row] = await dbPool
    .select({ count: swipeDailyCounts.count })
    .from(swipeDailyCounts)
    .where(and(
      eq(swipeDailyCounts.profileId, profileId),
      eq(swipeDailyCounts.date, today),
    ))
    .limit(1)

  return Math.max(0, dailyLimit - (row?.count ?? 0))
}
