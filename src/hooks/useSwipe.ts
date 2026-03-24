'use client'

import { useState, useCallback } from 'react'
import type { Profile } from '@/types'

interface SwipeState {
  profiles:       Profile[]
  matchedProfile: Profile | null
  matchId:        string | null
  swipesRemaining: number
  isLoading:      boolean
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
        return
      }

      setState(prev => ({
        ...prev,
        swipesRemaining: data.swipesRemaining ?? prev.swipesRemaining,
        matchedProfile: data.isMatch
          ? (initialProfiles.find(p => p.id === profileId) ?? null)
          : prev.matchedProfile,
        matchId: data.isMatch ? data.matchId : prev.matchId,
      }))
    } catch (err) {
      console.error('Swipe fout:', err)
    }
  }, [initialProfiles])

  const closeMatch = useCallback(() => {
    setState(prev => ({ ...prev, matchedProfile: null, matchId: null }))
  }, [])

  return { ...state, swipe, closeMatch }
}
