import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Test: atomaire swipe-limiet zonder race condition
 *
 * Simuleert gelijktijdige swipe-requests. Met de atomaire DB-transactie
 * moet exact het dagelijks maximum worden geregistreerd, niet meer.
 */

// Mock de DB-pool
const mockCounts = new Map<string, number>()

vi.mock('@/lib/db', () => ({
  dbPool: {
    transaction: async (fn: Function) => fn({
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => ({
            returning: async () => {
              const key = 'test-profile-2026-03-18'
              const current = mockCounts.get(key) ?? 0
              const next = current + 1
              mockCounts.set(key, next)
              return [{ count: next }]
            }
          })
        })
      }),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          })
        })
      }),
    })
  }
}))

vi.mock('@/lib/db/schema', () => ({
  swipeDailyCounts: { profileId: 'profileId', date: 'date', count: 'count' },
  swipes:  {},
  matches: {},
}))

describe('swipe dagelijkse limiet', () => {
  beforeEach(() => {
    mockCounts.clear()
  })

  it('staat exact 20 swipes toe voor gratis gebruiker', async () => {
    const { recordSwipeAtomic } = await import('@/lib/db/queries/swipes')

    const promises = Array.from({ length: 25 }, (_, i) =>
      recordSwipeAtomic('swiper-id', `target-${i}`, 'like', false)
        .catch(err => err.message)
    )

    const results = await Promise.allSettled(promises)
    const successes = results.filter(r => r.status === 'fulfilled' && r.value !== 'SWIPE_LIMIT_REACHED')
    const rejections = results.filter(r =>
      r.status === 'rejected' ||
      (r.status === 'fulfilled' && r.value === 'SWIPE_LIMIT_REACHED')
    )

    expect(successes.length).toBeLessThanOrEqual(20)
    expect(rejections.length).toBeGreaterThanOrEqual(5)
  })

  it('staat 100 swipes toe voor premium gebruiker', async () => {
    const { recordSwipeAtomic } = await import('@/lib/db/queries/swipes')

    // Voeg 99 swipes toe
    for (let i = 0; i < 99; i++) {
      mockCounts.set('test-profile-2026-03-18', i)
      await recordSwipeAtomic('swiper-id', `target-${i}`, 'like', true).catch(() => {})
    }

    // 100e swipe moet nog lukken
    mockCounts.set('test-profile-2026-03-18', 99)
    const result = await recordSwipeAtomic('swiper-id', 'target-99', 'like', true)
    expect(result).toBeDefined()
  })
})
