import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('bootverhuur flow', () => {
  it('telt swipes en limiet', () => {
    const key = '192.168.1.1'

    // Eerste 60 swipes moeten slagen
    for (let i = 0; i < 60; i++) {
      const result = checkRateLimit('swipe', key)
      expect(result.allowed).toBe(true)
    }

    // 61e swipe moet falen
    const result = checkRateLimit('swipe', key)
    expect(result.allowed).toBe(false)
  })

  it('scheiding tussen IPs', () => {
    const r1 = checkRateLimit('swipe', '1.1.1.1')
    const r2 = checkRateLimit('swipe', '2.2.2.2')
    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
  })

  it('message rate limiting werkt', () => {
    const key = 'user-123'

    // 30 messages per minuut
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit('message', key)
      expect(result.allowed).toBe(true)
    }

    const result = checkRateLimit('message', key)
    expect(result.allowed).toBe(false)
  })
})
