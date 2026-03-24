'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTochtenFilters } from '@/hooks/useTochtenFilters'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { TochtenFilterBar } from './TochtenFilterBar'
import { TochtenVoorJou } from './TochtenVoorJou'
import { TochtenDezeWeek } from './TochtenDezeWeek'
import { TochtCard } from './TochtCard'
import { TochtenEmptyState } from './TochtenEmptyState'
import { TochtenCalendar } from './TochtenCalendar'
import { PushPermissionBanner } from '@/components/ui/PushPermissionBanner'
import type { TochtMetPoster } from '@/lib/db/queries/tochten'
import type { CWOLevel } from '@/types'

interface Props {
  alleTochten:      TochtMetPoster[]
  userCwoLevel:     CWOLevel
  userSailingAreas: string[]
}

export function TochtenClientPage({ alleTochten, userCwoLevel, userSailingAreas }: Props) {
  const router = useRouter()

  const {
    filters,
    setFilter,
    toggleGebied,
    resetFilters,
    activeFilterCount,
    hasActiveFilters,
    gefilterd,
    voorJou,
    dezeWeek,
    tochtenPerDag,
  } = useTochtenFilters(alleTochten, userCwoLevel, userSailingAreas)

  const { pullY, refreshing } = usePullToRefresh(() => router.refresh())

  return (
    <div className="px-4 pt-6 pb-24 relative">

      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30 transition-all"
          style={{ top: Math.max(pullY - 20, 4) }}
        >
          <div className={`w-9 h-9 rounded-full bg-surface-container border border-white/10 flex items-center justify-center shadow-lg ${refreshing ? 'animate-spin' : ''}`}>
            <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">refresh</span>
          </div>
        </div>
      )}

      {/* Push notificaties banner */}
      <PushPermissionBanner />

      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Tochten</h1>
          <p className="font-body text-sm text-on-surface-variant mt-0.5">
            {alleTochten.length} oproepen van zeilers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Lijst / Kalender toggle */}
          <div className="flex rounded-2xl bg-surface-container p-1 gap-0.5">
            <button
              onClick={() => setFilter('weergave', 'lijst')}
              aria-pressed={filters.weergave === 'lijst'}
              aria-label="Lijstweergave"
              className={`p-2 rounded-xl transition-all
                ${filters.weergave === 'lijst' ? 'gradient-primary text-on-primary shadow-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">view_list</span>
            </button>
            <button
              onClick={() => setFilter('weergave', 'kalender')}
              aria-pressed={filters.weergave === 'kalender'}
              aria-label="Kalenderweergave"
              className={`p-2 rounded-xl transition-all
                ${filters.weergave === 'kalender' ? 'gradient-primary text-on-primary shadow-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">calendar_month</span>
            </button>
          </div>

          <Link
            href="/tochten/nieuw"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full gradient-primary
                       text-on-primary font-label text-sm font-bold shadow-glow
                       active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Nieuwe oproep plaatsen"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
            Oproep
          </Link>
        </div>
      </header>

      {/* Sticky filter bar */}
      <TochtenFilterBar
        filters={filters}
        setFilter={setFilter}
        toggleGebied={toggleGebied}
        resetFilters={resetFilters}
        activeCount={activeFilterCount}
        userCwoLevel={userCwoLevel}
      />

      {/* Kalenderweergave */}
      {filters.weergave === 'kalender' ? (
        <TochtenCalendar tochtenPerDag={tochtenPerDag} alleTochten={alleTochten} />
      ) : (
        <>
          {/* "Voor jou" sectie — alleen zonder actieve filters */}
          {!hasActiveFilters && voorJou.length > 0 && (
            <TochtenVoorJou tochten={voorJou} />
          )}

          {/* "Deze week" sectie — alleen zonder actieve filters en als er tochten zijn */}
          {!hasActiveFilters && dezeWeek.length > 0 && (
            <TochtenDezeWeek tochten={dezeWeek} />
          )}

          {/* Resultaat teller bij actieve filters */}
          {hasActiveFilters && (
            <p className="font-label text-xs text-on-surface-variant mb-3">
              {gefilterd.length} {gefilterd.length === 1 ? 'tocht' : 'tochten'} gevonden
            </p>
          )}

          {/* Hoofd lijst */}
          {gefilterd.length === 0 ? (
            <TochtenEmptyState
              hasFilters={hasActiveFilters}
              totalCount={alleTochten.length}
              onReset={resetFilters}
            />
          ) : (
            <motion.ul layout className="space-y-3" aria-label="Tochten lijst">
              <AnimatePresence mode="popLayout">
                {gefilterd.map(item => (
                  <motion.li
                    key={item.tocht.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                  >
                    <TochtCard {...item} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </>
      )}
    </div>
  )
}
