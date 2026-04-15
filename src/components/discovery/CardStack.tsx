'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SwipeCard } from './SwipeCard'
import { SwipeCardSkeleton } from '@/components/ui/Skeleton'
import type { Profile } from '@/types'

interface CardStackProps {
  profiles:   Profile[]
  onSwipe:    (profileId: string, direction: 'left' | 'right') => void
  isLoading?: boolean
}

const cardVariants = {
  exit: (dir: 'left' | 'right') => ({
    x:       dir === 'right' ? 600 : -600,
    rotate:  dir === 'right' ? 18 : -18,
    opacity: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

export function CardStack({ profiles, onSwipe, isLoading }: CardStackProps) {
  const [swipeDir, setSwipeDir] = useState<'left' | 'right'>('right')

  if (isLoading) return <SwipeCardSkeleton />

  if (profiles.length === 0) {
    return (
      <div className="w-full h-full rounded-card glass-card flex flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant" aria-hidden="true">
          sailing
        </span>
        <h3 className="font-headline font-bold text-xl text-on-surface">
          Geen zeilers in de buurt
        </h3>
        <p className="font-body text-sm text-on-surface-variant">
          Probeer je filters aan te passen of kom later terug.
        </p>
      </div>
    )
  }

  const handleSwipe = (profileId: string, dir: 'left' | 'right') => {
    setSwipeDir(dir)
    onSwipe(profileId, dir)
  }

  return (
    <div className="relative w-full h-full" aria-live="polite" aria-atomic="false">
      <AnimatePresence custom={swipeDir}>
        {profiles.slice(0, 3).map((profile, index) => (
          <motion.div
            key={profile.id}
            className="absolute inset-0"
            style={{
              zIndex:     profiles.length - index,
              scale:      1 - index * 0.04,
              translateY: index * 12,
            }}
            custom={swipeDir}
            variants={cardVariants}
            exit="exit"
          >
            <SwipeCard
              profile={profile}
              onSwipe={(dir) => handleSwipe(profile.id, dir)}
              isTop={index === 0}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
