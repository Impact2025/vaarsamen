'use client'

import { AnimatePresence } from 'framer-motion'
import { CardStack } from '@/components/discovery/CardStack'
import { SwipeActions } from '@/components/discovery/SwipeActions'
import { MatchModal } from '@/components/matches/MatchModal'
import { WelcomeTour } from '@/components/onboarding/WelcomeTour'
import { useSwipe } from '@/hooks/useSwipe'
import { useWelcomeTour } from '@/hooks/useWelcomeTour'
import type { Profile } from '@/types'

interface OntdekkenClientProps {
  initialProfiles:        Profile[]
  myProfile:              Profile
  initialSwipesRemaining: number
}

export function OntdekkenClient({ initialProfiles, myProfile, initialSwipesRemaining }: OntdekkenClientProps) {
  const { profiles, swipe, matchedProfile, matchId, swipesRemaining, closeMatch } = useSwipe(
    initialProfiles,
    initialSwipesRemaining
  )
  const { show: showTour, dismiss: dismissTour } = useWelcomeTour()

  const topProfile = profiles[0]

  return (
    <div className="flex flex-col h-dvh max-h-dvh px-4 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface leading-tight">
            Beschikbare zeilers
          </h1>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">
            Op basis van jouw voorkeuren
          </p>
        </div>
        {swipesRemaining < 20 && (
          <div className="flex items-center gap-1.5 glass-card rounded-full px-3 py-1.5 border border-white/10">
            <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">
              swap_horiz
            </span>
            <span className="font-label text-xs text-on-surface-variant">
              {swipesRemaining} over
            </span>
          </div>
        )}
      </header>

      {/* Kaartenstapel */}
      <div className="flex-1 relative">
        <CardStack
          profiles={profiles}
          onSwipe={swipe}
        />
      </div>

      {/* Swipe knoppen */}
      {swipesRemaining > 0 ? (
        <SwipeActions
          onPass={()    => topProfile && swipe(topProfile.id, 'left')}
          onLike={()    => topProfile && swipe(topProfile.id, 'right')}
          onMessage={()  => topProfile && swipe(topProfile.id, 'right')}
          disabled={!topProfile}
        />
      ) : (
        <div className="py-6 text-center">
          <p className="font-body text-on-surface-variant text-sm mb-3">
            Je hebt je dagelijkse limiet bereikt
          </p>
          <a
            href="/premium"
            className="inline-block gradient-primary text-on-primary font-label font-bold
                       px-6 py-3 rounded-full shadow-glow text-sm"
          >
            Upgrade naar premium
          </a>
        </div>
      )}

      <div className="h-6" />

      {/* Match modal */}
      {matchedProfile && matchId && (
        <MatchModal
          isOpen={!!matchedProfile}
          matchedProfile={matchedProfile}
          myProfile={myProfile}
          matchId={matchId}
          onClose={closeMatch}
        />
      )}

      {/* Welkomsrondleiding voor nieuwe gebruikers */}
      <AnimatePresence>
        {showTour && <WelcomeTour onDismiss={dismissTour} />}
      </AnimatePresence>
    </div>
  )
}
