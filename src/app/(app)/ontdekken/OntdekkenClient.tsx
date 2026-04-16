'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { CardStack } from '@/components/discovery/CardStack'
import { SwipeActions } from '@/components/discovery/SwipeActions'
import { MatchModal } from '@/components/matches/MatchModal'
import { WelcomeTour } from '@/components/onboarding/WelcomeTour'
import { useSwipe } from '@/hooks/useSwipe'
import { useWelcomeTour } from '@/hooks/useWelcomeTour'
import type { Profile } from '@/types'

// ─── DATUM CHIP HELPERS ───────────────────────────────────────────────────────

interface DateChip {
  date:      string | null  // null = "alle data"
  label:     string
  sub:       string
  isWeekend: boolean
}

function buildDateChips(count = 8): DateChip[] {
  const chips: DateChip[] = [{ date: null, label: 'Alle', sub: 'data', isWeekend: false }]
  const today   = new Date()
  const DAY_NL  = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const day = DAY_NL[d.getDay()]
    chips.push({
      date:      d.toISOString().slice(0, 10),
      label:     i === 0 ? 'Vandaag' : day.charAt(0).toUpperCase() + day.slice(1),
      sub:       `${d.getDate()}/${d.getMonth() + 1}`,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    })
  }
  return chips
}

const DATE_CHIPS = buildDateChips(8)

// ─── DATUM FILTER STRIP ───────────────────────────────────────────────────────

function DateFilterStrip({
  selected,
  isLoading,
  onSelect,
}: {
  selected:  string | null
  isLoading: boolean
  onSelect:  (date: string | null) => void
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
      role="radiogroup"
      aria-label="Filter op beschikbaarheidsdatum"
    >
      {DATE_CHIPS.map(chip => {
        const active = selected === chip.date
        return (
          <button
            key={chip.date ?? 'all'}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => !isLoading && onSelect(chip.date)}
            disabled={isLoading}
            className={[
              'flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl border transition-all duration-150',
              'min-w-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              active
                ? 'border-primary bg-primary/15 shadow-glow'
                : chip.isWeekend
                  ? 'border-primary/25 bg-surface-container-high hover:border-primary/40'
                  : 'border-outline/15 bg-surface-container hover:border-outline/30',
            ].join(' ')}
          >
            <span className={`font-label text-[11px] font-semibold leading-tight ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
              {chip.label}
            </span>
            <span className={`font-label text-[10px] leading-tight ${active ? 'text-primary/70' : 'text-on-surface-variant/60'}`}>
              {isLoading && active ? '···' : chip.sub}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── HOOFD-COMPONENT ──────────────────────────────────────────────────────────

interface OntdekkenClientProps {
  initialProfiles:        Profile[]
  myProfile:              Profile
  initialSwipesRemaining: number
}

export function OntdekkenClient({ initialProfiles, myProfile, initialSwipesRemaining }: OntdekkenClientProps) {
  const router = useRouter()
  const { profiles, swipe, matchedProfile, matchId, swipesRemaining, closeMatch, resetProfiles } = useSwipe(
    initialProfiles,
    initialSwipesRemaining,
  )
  const { show: showTour, dismiss: dismissTour } = useWelcomeTour()
  const [likedFeedback, setLikedFeedback] = useState(false)
  const [selectedDate,  setSelectedDate]  = useState<string | null>(null)
  const [isRefetching,  setIsRefetching]  = useState(false)

  const topProfile = profiles[0]

  // ── Datumfilter ───────────────────────────────────────────────────────────

  const handleDateFilter = useCallback(async (date: string | null) => {
    setSelectedDate(date)
    setIsRefetching(true)
    try {
      const url  = date ? `/api/profiles?date=${date}` : '/api/profiles'
      const res  = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      resetProfiles((data.profiles as Profile[]) ?? [])
    } catch {
      // Stil falen — bestaande kaarten blijven zichtbaar
    } finally {
      setIsRefetching(false)
    }
  }, [resetProfiles])

  // ── Swipe handlers ────────────────────────────────────────────────────────

  const handleLike = async () => {
    if (!topProfile) return
    await swipe(topProfile.id, 'right')
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
    <div className="flex flex-col h-dvh max-h-dvh px-4 pt-4">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="mb-3">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h1 className="font-headline font-black text-xl text-on-surface leading-tight">
              Beste matches
            </h1>
            <p className="font-label text-[11px] text-on-surface-variant mt-0.5">
              {profiles.length > 0
                ? `${profiles.length} zeiler${profiles.length !== 1 ? 's' : ''} gesorteerd op compatibiliteit`
                : selectedDate
                  ? 'Geen zeilers beschikbaar op deze datum'
                  : 'Op basis van jouw voorkeuren'
              }
            </p>
          </div>
          {swipesRemaining < 20 && (
            <div className="flex items-center gap-1 glass-card rounded-full px-2.5 py-1 border border-white/10 flex-shrink-0">
              <span className="material-symbols-outlined text-[11px] text-on-surface-variant" aria-hidden="true">
                swap_horiz
              </span>
              <span className="font-label text-[11px] text-on-surface-variant">
                {swipesRemaining} over
              </span>
            </div>
          )}
        </div>

        {/* Beschikbaarheids-filter */}
        <DateFilterStrip
          selected={selectedDate}
          isLoading={isRefetching}
          onSelect={handleDateFilter}
        />
      </header>

      {/* ── Kaartenstapel ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <CardStack profiles={profiles} onSwipe={swipe} />
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
