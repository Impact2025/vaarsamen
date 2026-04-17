'use client'

import { useState } from 'react'
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
import type { TochtMetPoster, MijnAanmelding } from '@/lib/db/queries/tochten'
import type { CWOLevel } from '@/types'

interface Props {
  alleTochten:      TochtMetPoster[]
  mijnAanmeldingen: MijnAanmelding[]
  userCwoLevel:     CWOLevel
  userSailingAreas: string[]
}

export function TochtenClientPage({ alleTochten, mijnAanmeldingen, userCwoLevel, userSailingAreas }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'ontdekken' | 'aanmeldingen'>('ontdekken')

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
      <header className="flex items-center justify-between mb-4">
        <h1 className="font-headline font-black text-2xl text-on-surface">Tochten</h1>
        <div className="flex items-center gap-2">
          {tab === 'ontdekken' && (
            <>
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
            </>
          )}
        </div>
      </header>

      {/* Tab navigatie */}
      <div className="flex rounded-2xl bg-surface-container p-1 gap-1 mb-5" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'ontdekken'}
          onClick={() => setTab('ontdekken')}
          className={`flex-1 py-2 px-3 rounded-xl font-label font-bold text-sm transition-all
            ${tab === 'ontdekken' ? 'gradient-primary text-on-primary shadow-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Ontdekken
        </button>
        <button
          role="tab"
          aria-selected={tab === 'aanmeldingen'}
          onClick={() => setTab('aanmeldingen')}
          className={`flex-1 py-2 px-3 rounded-xl font-label font-bold text-sm transition-all flex items-center justify-center gap-1.5
            ${tab === 'aanmeldingen' ? 'gradient-primary text-on-primary shadow-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Mijn aanmeldingen
          {mijnAanmeldingen.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${tab === 'aanmeldingen' ? 'bg-white/20' : 'bg-primary/15 text-primary'}`}>
              {mijnAanmeldingen.length}
            </span>
          )}
        </button>
      </div>

      {/* Sticky filter bar — alleen bij ontdekken-tab */}
      {tab === 'ontdekken' && (
        <TochtenFilterBar
          filters={filters}
          setFilter={setFilter}
          toggleGebied={toggleGebied}
          resetFilters={resetFilters}
          activeCount={activeFilterCount}
          userCwoLevel={userCwoLevel}
        />
      )}

      {/* Mijn aanmeldingen tab */}
      {tab === 'aanmeldingen' ? (
        mijnAanmeldingen.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant" aria-hidden="true">
              sailing
            </span>
            <p className="font-headline font-bold text-lg text-on-surface">Nog geen aanmeldingen</p>
            <p className="font-body text-sm text-on-surface-variant">
              Meld je aan voor een tocht via het Ontdekken-tabblad.
            </p>
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Mijn aanmeldingen">
            {mijnAanmeldingen.map(({ aanmelding, tocht, poster }) => {
              const status = aanmelding.status ?? 'wacht'
              const statusConfig = {
                wacht:         { label: 'In behandeling', icon: 'hourglass_empty', cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                geaccepteerd:  { label: 'Geaccepteerd',   icon: 'check_circle',    cls: 'text-primary bg-primary/10 border-primary/20' },
                afgewezen:     { label: 'Afgewezen',      icon: 'cancel',          cls: 'text-red-400 bg-red-400/10 border-red-400/20' },
              }[status] ?? { label: status, icon: 'info', cls: 'text-on-surface-variant bg-surface-container border-white/10' }

              const datumStr = new Date(tocht.datum as string).toLocaleDateString('nl-NL', {
                weekday: 'short', day: 'numeric', month: 'short',
              })

              return (
                <li key={aanmelding.id}>
                  <Link
                    href={`/tochten/${tocht.id}`}
                    className="block glass-card rounded-2xl p-4 border border-white/8 active:scale-[0.99] transition-all
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-headline font-bold text-base text-on-surface truncate">{tocht.titel}</p>
                        <p className="font-body text-sm text-on-surface-variant mt-0.5">
                          {datumStr} · {poster.displayName}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-label font-bold shrink-0 ${statusConfig.cls}`}>
                        <span className="material-symbols-outlined text-xs" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {statusConfig.icon}
                        </span>
                        {statusConfig.label}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )
      ) : (
        /* Ontdekken tab — kalender of lijst */
        filters.weergave === 'kalender' ? (
          <TochtenCalendar tochtenPerDag={tochtenPerDag} alleTochten={alleTochten} />
        ) : (
          <>
            {!hasActiveFilters && voorJou.length > 0 && (
              <TochtenVoorJou tochten={voorJou} />
            )}
            {!hasActiveFilters && dezeWeek.length > 0 && (
              <TochtenDezeWeek tochten={dezeWeek} />
            )}
            {hasActiveFilters && (
              <p className="font-label text-xs text-on-surface-variant mb-3">
                {gefilterd.length} {gefilterd.length === 1 ? 'tocht' : 'tochten'} gevonden
              </p>
            )}
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
        )
      )}
    </div>
  )
}
