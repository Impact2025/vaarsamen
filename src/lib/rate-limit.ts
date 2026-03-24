// In-memory rate limiter — vervang door Upstash Redis bij > 500 gebruikers

type RateLimitEntry = { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()

// Schoon verlopen entries op elke 10 minuten
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 10 * 60 * 1000)

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = store.get(identifier)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt }
}

// Standaard limieten per route
export const RATE_LIMITS = {
  swipe:    { max: 60,  windowMs: 60_000 },    // 60/min per IP
  upload:   { max: 10,  windowMs: 60_000 },    // 10/min per userId
  message:  { max: 30,  windowMs: 60_000 },    // 30/min per userId
  auth:     { max: 10,  windowMs: 60_000 },    // 10/min per IP
  report:   { max: 5,   windowMs: 300_000 },   // 5/5min per userId
} as const
