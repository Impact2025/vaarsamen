// In-memory rate limiter — geen externe deps nodig
const hits = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now > entry.resetTime) {
    hits.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: max - 1, resetIn: windowMs }
  }

  if (entry.count >= max) {
    return { success: false, remaining: 0, resetIn: entry.resetTime - now }
  }

  entry.count++
  return { success: true, remaining: max - entry.count, resetIn: entry.resetTime - now }
}

export const SWIPE_LIMIT = 60    // swipes per minuut
export const MESSAGE_LIMIT = 30  // messages per minuut
export const API_LIMIT = 100     // requests per minuut

// Wrapper genoemd zoals door swipe/route.ts verwacht
export function checkRateLimit(
  type: 'swipe' | 'message' | 'api',
  key: string
): { allowed: boolean; remaining?: number } {
  const limits = { swipe: SWIPE_LIMIT, message: MESSAGE_LIMIT, api: API_LIMIT }
  const result = rateLimit(`rate:${type}:${key}`, limits[type], 60_000)
  return { allowed: result.success, remaining: result.remaining }
}
