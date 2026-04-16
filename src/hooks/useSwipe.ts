'use client'

import { useState, useCallback } from 'react'
import type { Profile } from '@/types'

interface SwipeState {
  profiles:        Profile[]
  matchedProfile:  Profile | null
  matchId:         string | null
  swipesRemaining: number
  isLoading:       boolean
}

export function useSwipe(initialProfiles: Profile[], initialSwipesRemaining = 20) {
  const [state, setState] = useState<SwipeState>({
    profiles:        initialProfiles,
    matchedProfile:  null,
    matchId:         null,
    swipesRemaining: initialSwipesRemaining,
    isLoading:       false,
  })

  const swipe = useCallback(async (profileId: string, direction: 'left' | 'right') => {
    const action = direction === 'right' ? 'like' : 'pass'

    // Optimistisch: verwijder kaart direct
    setState(prev => ({
      ...prev,
      profiles: prev.profiles.filter(p => p.id !== profileId),
    }))

    try {
      const res  = await fetch('/api/swipes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ swipedId: profileId, action }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.limitReached) {
          setState(prev => ({ ...prev, swipesRemaining: 0 }))
        }
        return null
      }

      setState(prev => ({
        ...prev,
        swipesRemaining: data.swipesRemaining ?? prev.swipesRemaining,
        matchedProfile: data.isMatch
          ? (initialProfiles.find(p => p.id === profileId) ?? null)
          : prev.matchedProfile,
        matchId: data.isMatch ? data.matchId : prev.matchId,
      }))

      return { isMatch: !!data.isMatch, matchId: data.matchId as string | null }
    } catch (err) {
      console.error('Swipe fout:', err)
      return null
    }
  }, [initialProfiles])

  /**
   * Vervangt de huidige kaartenstapel — gebruikt door het datumfilter.
   * Wist ook de match-modal zodat geen verwarrende state overblijft.
   */
  const resetProfiles = useCallback((newProfiles: Profile[]) => {
    setState(prev => ({
      ...prev,
      profiles:       newProfiles,
      matchedProfile: null,
      matchId:        null,
    }))
  }, [])

  const closeMatch = useCallback(() => {
    setState(prev => ({ ...prev, matchedProfile: null, matchId: null }))
  }, [])

  return { ...state, swipe, closeMatch, resetProfiles }
}
