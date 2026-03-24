'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { SwipeCard } from './SwipeCard'
import { SwipeCardSkeleton } from '@/components/ui/Skeleton'
import type { Profile } from '@/types'

interface CardStackProps {
  profiles:   Profile[]
  onSwipe:    (profileId: string, direction: 'left' | 'right') => void
  isLoading?: boolean
}

export function CardStack({ profiles, onSwipe, isLoading }: CardStackProps) {
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

  return (
    <div className="relative w-full h-full" aria-live="polite" aria-atomic="false">
      <AnimatePresence>
        {profiles.slice(0, 3).map((profile, index) => (
          <motion.div
            key={profile.id}
            className="absolute inset-0"
            style={{
              zIndex:    profiles.length - index,
              scale:     1 - index * 0.04,
              translateY: index * 12,
            }}
            exit={{
              x:       500,
              opacity: 0,
              transition: { duration: 0.3 },
            }}
          >
            <SwipeCard
              profile={profile}
              onSwipe={(dir) => onSwipe(profile.id, dir)}
              isTop={index === 0}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
