'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
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
  const router = useRouter()
  const { profiles, swipe, matchedProfile, matchId, swipesRemaining, closeMatch } = useSwipe(
    initialProfiles,
    initialSwipesRemaining
  )
  const { show: showTour, dismiss: dismissTour } = useWelcomeTour()
  const [likedFeedback, setLikedFeedback] = useState(false)

  const topProfile = profiles[0]

  const handleLike = async () => {
    if (!topProfile) return
    await swipe(topProfile.id, 'right')
    // MatchModal verschijnt vanzelf bij een match via state; geef anders korte feedback
    setLikedFeedback(true)
    setTimeout(() => setLikedFeedback(false), 1500)
  }

  const handleMessage = async () => {
    if (!topProfile) return
    const result = await swipe(topProfile.id, 'right')
    if (result?.isMatch && result.matchId) {
      router.push(`/matches/${result.matchId}`)
    } else {
      router.push('/berichten')
    }
  }

  return (
    <div className="flex flex-col h-dvh max-h-dvh px-4 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface leading-tight">
            Beschikbare zeilers
          </h1>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">
            {profiles.length > 0
              ? `${profiles.length} zeiler${profiles.length !== 1 ? 's' : ''} in de buurt`
              : 'Op basis van jouw voorkeuren'
            }
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

      {/* Feedback toast bij like zonder match */}
      <AnimatePresence>
        {likedFeedback && !matchedProfile && (
          <motion.div
            key="liked-toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-40 left-1/2 -translate-x-1/2 z-50
                       flex items-center gap-2 px-4 py-2.5 rounded-full
                       bg-primary/90 backdrop-blur-sm shadow-glow"
            role="status"
            aria-live="polite"
          >
            <span
              className="material-symbols-outlined text-on-primary text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              sailing
            </span>
            <span className="font-label text-sm font-semibold text-on-primary">
              Interesse getoond!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe knoppen */}
      {swipesRemaining > 0 ? (
        <SwipeActions
          onPass={()   => topProfile && swipe(topProfile.id, 'left')}
          onLike={handleLike}
          onMessage={handleMessage}
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

      {/* Ruimte boven de BottomNav */}
      <div className="h-20" />

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
