import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('rate limiting', () => {
  it('swipe limiet werkt (60/min)', () => {
    const key = '192.168.1.1'
    for (let i = 0; i < 60; i++) {
      const result = checkRateLimit('swipe', key)
      expect(result.allowed).toBe(true)
    }
    const result = checkRateLimit('swipe', key)
    expect(result.allowed).toBe(false)
  })

  it('scheiding tussen IPs', () => {
    expect(checkRateLimit('swipe', '1.1.1.1').allowed).toBe(true)
    expect(checkRateLimit('swipe', '2.2.2.2').allowed).toBe(true)
  })

  it('message limiet werkt (30/min)', () => {
    const key = 'user-123'
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit('message', key).allowed).toBe(true)
    }
    expect(checkRateLimit('message', key).allowed).toBe(false)
  })

  it('report limiet werkt (5/5min)', () => {
    const key = 'reporter-1'
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('report', key).allowed).toBe(true)
    }
    expect(checkRateLimit('report', key).allowed).toBe(false)
  })
})