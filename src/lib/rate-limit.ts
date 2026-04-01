// In-memory rate limiter — vervang door Upstash Redis bij > 500 gebruikers
// Let op: werkt niet over meerdere Vercel serverless instanties

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Schoon verlopen entries op elke 10 minuten
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 10 * 60 * 1000)

export type RateLimitKey = 'swipe' | 'upload' | 'message' | 'auth' | 'report'

const WINDOWS: Record<RateLimitKey, { max: number; windowMs: number }> = {
  swipe:   { max: 60,  windowMs: 60_000  },
  upload:  { max: 10,  windowMs: 60_000  },
  message: { max: 30,  windowMs: 60_000  },
  auth:    { max: 10,  windowMs: 60_000  },
  report:  { max: 5,   windowMs: 300_000 },
}

export function checkRateLimit(
  key:        RateLimitKey,
  identifier: string,
): { allowed: boolean; remaining: number; resetAt: number } {
  const { max, windowMs } = WINDOWS[key]
  const id  = `${key}:${identifier}`
  const now = Date.now()
  const existing = store.get(id)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs
    store.set(id, { count: 1, resetAt })
    return { allowed: true, remaining: max - 1, resetAt }
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt }
}

export const RATE_LIMITS = {
  swipe:   { max: 60,  windowMs: 60_000  },
  upload:  { max: 10,  windowMs: 60_000  },
  message: { max: 30,  windowMs: 60_000  },
  auth:    { max: 10,  windowMs: 60_000  },
  report:  { max: 5,   windowMs: 300_000 },
} as const
