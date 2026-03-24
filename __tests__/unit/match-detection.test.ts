import { describe, it, expect } from 'vitest'

/**
 * Test: match-detectie logica
 *
 * Verifieer dat:
 * 1. Wederzijdse likes een match aanmaken
 * 2. Eenzijdige like geen match aanmaakt
 * 3. Like op een 'pass' geen match aanmaakt
 */

// Pure functie extractie voor testbaarheid
function shouldCreateMatch(
  action1: 'like' | 'pass' | 'superlike',
  action2: 'like' | 'pass' | 'superlike' | null
): boolean {
  if (action2 === null) return false
  const likeActions = ['like', 'superlike']
  return likeActions.includes(action1) && likeActions.includes(action2)
}

describe('match detectie', () => {
  it('maakt een match bij wederzijdse like', () => {
    expect(shouldCreateMatch('like', 'like')).toBe(true)
  })

  it('maakt een match bij like + superlike', () => {
    expect(shouldCreateMatch('like', 'superlike')).toBe(true)
    expect(shouldCreateMatch('superlike', 'like')).toBe(true)
  })

  it('maakt geen match bij eenzijdige like', () => {
    expect(shouldCreateMatch('like', null)).toBe(false)
  })

  it('maakt geen match als ander persoon pass heeft gegeven', () => {
    expect(shouldCreateMatch('like', 'pass')).toBe(false)
  })

  it('maakt geen match bij pass van beide kanten', () => {
    expect(shouldCreateMatch('pass', 'pass')).toBe(false)
  })

  it('maakt een match bij wederzijdse superlike', () => {
    expect(shouldCreateMatch('superlike', 'superlike')).toBe(true)
  })
})
