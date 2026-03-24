'use client'

import { useState, useEffect, useRef } from 'react'
import { SAILING_AREAS, BOAT_LABELS, CWO_LABELS, type BoatType, type CWOLevel } from '@/types'
import type { FilterState } from '@/hooks/useTochtenFilters'

const DATUM_OPTIES = [
  { id: 'alles',        label: 'Alle data' },
  { id: 'deze_week',   label: 'Deze week' },
  { id: 'dit_weekend', label: 'Dit weekend' },
  { id: 'volgende_week', label: 'Volgende week' },
]

interface Props {
  filters:       FilterState
  setFilter:     <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  toggleGebied:  (id: string) => void
  resetFilters:  () => void
  activeCount:   number
  userCwoLevel:  CWOLevel
}

export function TochtenFilterBar({ filters, setFilter, toggleGebied, resetFilters, activeCount, userCwoLevel }: Props) {
  const [zoekInput, setZoekInput] = useState(filters.zoekterm)
  const [expanded, setExpanded]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce zoekterm
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setFilter('zoekterm', zoekInput), 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [zoekInput, setFilter])

  return (
    <div className="sticky top-0 z-40 -mx-4 px-4 pt-3 pb-2 bg-surface/80 backdrop-blur-2xl border-b border-white/5 mb-4">

      {/* Zoekbalk */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">
          search
        </span>
        <input
          type="search"
          value={zoekInput}
          onChange={e => setZoekInput(e.target.value)}
          placeholder="Zoek op titel, locatie, beschrijving…"
          aria-label="Zoek tochten"
          className="w-full pl-9 pr-4 py-2.5 bg-surface-container-high rounded-2xl
                     text-on-surface placeholder:text-on-surface-variant/40
                     border border-white/10 focus:border-primary/50 font-body text-sm
                     focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        />
        {zoekInput && (
          <button
            onClick={() => { setZoekInput(''); setFilter('zoekterm', '') }}
            aria-label="Zoekopdracht wissen"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {/* Vaargebied chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2" role="group" aria-label="Filter op vaargebied">
        <button
          onClick={() => setFilter('vaargebieden', [])}
          aria-pressed={filters.vaargebieden.length === 0}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
            ${filters.vaargebieden.length === 0
              ? 'gradient-primary text-on-primary border-transparent shadow-glow'
              : 'bg-surface-container border-white/10 text-on-surface-variant hover:border-white/20'}`}
        >
          Alle gebieden
        </button>
        {SAILING_AREAS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => toggleGebied(id)}
            aria-pressed={filters.vaargebieden.includes(id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
              ${filters.vaargebieden.includes(id)
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'bg-surface-container border-white/10 text-on-surface-variant hover:border-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Datum filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2" role="group" aria-label="Filter op datum">
        {DATUM_OPTIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter('datumFilter', id as FilterState['datumFilter'])}
            aria-pressed={filters.datumFilter === id}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
              ${filters.datumFilter === id
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'bg-surface-container border-white/10 text-on-surface-variant hover:border-white/20'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Uitklapbaar: boottype + CWO + sortering */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
            ${expanded || activeCount > 0
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'bg-surface-container border-white/10 text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">tune</span>
          Filters
          {activeCount > 0 && (
            <span className="ml-1 w-4 h-4 rounded-full bg-primary text-on-primary font-label text-[10px] flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* CWO voor mij toggle */}
        <button
          onClick={() => setFilter('cwoFilter', filters.cwoFilter === 'voor_mij' ? 'alle' : 'voor_mij')}
          aria-pressed={filters.cwoFilter === 'voor_mij'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
            ${filters.cwoFilter === 'voor_mij'
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'bg-surface-container border-white/10 text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">person_check</span>
          Voor mij
        </button>

        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="ml-auto px-3 py-1.5 rounded-full font-label text-xs text-on-surface-variant border border-white/10 hover:border-white/20 transition-all"
          >
            Wissen
          </button>
        )}
      </div>

      {/* Uitklapbaar gedeelte */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
          {/* Boottype */}
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-2">Boottype</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('bootType', '')}
                aria-pressed={filters.bootType === ''}
                className={`px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
                  ${filters.bootType === '' ? 'border-primary/60 bg-primary/10 text-primary' : 'bg-surface-container border-white/10 text-on-surface-variant'}`}
              >
                Alle types
              </button>
              {(Object.entries(BOAT_LABELS) as [BoatType, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter('bootType', id)}
                  aria-pressed={filters.bootType === id}
                  className={`px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
                    ${filters.bootType === id ? 'border-primary/60 bg-primary/10 text-primary' : 'bg-surface-container border-white/10 text-on-surface-variant'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sortering */}
          <div>
            <p className="font-label text-xs text-on-surface-variant mb-2">Sorteren op</p>
            <div className="flex gap-2">
              {[
                { id: 'datum',    label: 'Datum', icon: 'calendar_today' },
                { id: 'populair', label: 'Populair', icon: 'trending_up' },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setFilter('sorteer', id as FilterState['sorteer'])}
                  aria-pressed={filters.sorteer === id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-bold border transition-all
                    ${filters.sorteer === id ? 'border-primary/60 bg-primary/10 text-primary' : 'bg-surface-container border-white/10 text-on-surface-variant'}`}
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
