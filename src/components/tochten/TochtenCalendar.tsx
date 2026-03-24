'use client'

import { useState, useRef, useEffect } from 'react'
import {
  format, addDays, isSameDay, isToday, parseISO,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { GEBIED_COLOR_HEX } from '@/types'
import { TochtenCalendarDaySheet } from './TochtenCalendarDaySheet'
import type { TochtMetPoster } from '@/lib/db/queries/tochten'

const DAG_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

type KalenderMode = 'strip' | 'maand'

interface Props {
  tochtenPerDag: Map<string, TochtMetPoster[]>
  alleTochten:   TochtMetPoster[]
}

export function TochtenCalendar({ tochtenPerDag, alleTochten }: Props) {
  const [mode, setMode]               = useState<KalenderMode>('strip')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [maand, setMaand]             = useState(new Date())
  const stripRef                      = useRef<HTMLDivElement>(null)

  // Scroll naar vandaag in de strip
  useEffect(() => {
    if (mode === 'strip' && stripRef.current) {
      const todayEl = stripRef.current.querySelector('[data-today="true"]') as HTMLElement
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [mode])

  const selectedTochten = selectedDay ? (tochtenPerDag.get(selectedDay) ?? []) : []

  // ── Week-strip (21 dagen) ────────────────────────────────────────────────
  const stripDagen = Array.from({ length: 28 }, (_, i) => addDays(new Date(), i))

  // ── Maandgrid ────────────────────────────────────────────────────────────
  const maandStart  = startOfMonth(maand)
  const maandEind   = endOfMonth(maand)
  const gridStart   = startOfWeek(maandStart, { weekStartsOn: 1 })
  const gridEind    = endOfWeek(maandEind, { weekStartsOn: 1 })
  const maandDagen  = eachDayOfInterval({ start: gridStart, end: gridEind })

  const DagStipjes = ({ dag }: { dag: Date }) => {
    const key    = format(dag, 'yyyy-MM-dd')
    const items  = tochtenPerDag.get(key) ?? []
    if (items.length === 0) return null
    const max3   = items.slice(0, 3)
    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {max3.map(({ tocht }, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5' }}
            aria-hidden="true"
          />
        ))}
        {items.length > 3 && (
          <span className="font-label text-[9px] text-on-surface-variant leading-none mt-0.5">+</span>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex rounded-2xl bg-surface-container p-1 gap-1">
          {(['strip', 'maand'] as KalenderMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`px-4 py-2 rounded-xl font-label text-xs font-bold transition-all
                ${mode === m ? 'gradient-primary text-on-primary shadow-glow' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {m === 'strip' ? 'Week-strip' : 'Maand'}
            </button>
          ))}
        </div>
        <span className="font-label text-xs text-on-surface-variant ml-auto">
          {alleTochten.length} tochten gepland
        </span>
      </div>

      {mode === 'strip' ? (
        /* ── Week-strip ───────────────────────────────────────────────────── */
        <div ref={stripRef} className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none mb-4">
          {stripDagen.map(dag => {
            const key     = format(dag, 'yyyy-MM-dd')
            const items   = tochtenPerDag.get(key) ?? []
            const isActief = selectedDay === key
            const vandaag  = isToday(dag)

            return (
              <button
                key={key}
                data-today={vandaag}
                onClick={() => setSelectedDay(isActief ? null : key)}
                aria-label={`${format(dag, 'EEEE d MMMM', { locale: nl })}, ${items.length} tochten`}
                aria-pressed={isActief}
                className={`flex-shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border transition-all
                  ${isActief
                    ? 'gradient-primary border-transparent shadow-glow'
                    : vandaag
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-white/10 bg-surface-container hover:border-white/20'}`}
              >
                <span className={`font-label text-[10px] font-semibold uppercase tracking-widest mb-1
                  ${isActief ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  {format(dag, 'EEE', { locale: nl })}
                </span>
                <span className={`font-headline font-black text-lg leading-none
                  ${isActief ? 'text-on-primary' : vandaag ? 'text-primary' : 'text-on-surface'}`}>
                  {format(dag, 'd')}
                </span>
                {items.length > 0 ? (
                  <div className={`flex gap-0.5 mt-1.5 ${isActief ? 'opacity-80' : ''}`}>
                    {items.slice(0, 3).map(({ tocht }, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isActief ? 'white' : GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5' }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-3.5 mt-1.5" />
                )}
              </button>
            )
          })}
        </div>
      ) : (
        /* ── Maandgrid ────────────────────────────────────────────────────── */
        <div className="mb-4">
          {/* Maand navigatie */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMaand(m => subMonths(m, 1))}
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
              aria-label="Vorige maand"
            >
              <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">chevron_left</span>
            </button>
            <h3 className="font-headline font-bold text-base text-on-surface capitalize">
              {format(maand, 'MMMM yyyy', { locale: nl })}
            </h3>
            <button
              onClick={() => setMaand(m => addMonths(m, 1))}
              className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
              aria-label="Volgende maand"
            >
              <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">chevron_right</span>
            </button>
          </div>

          {/* Dag headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAG_LABELS.map(d => (
              <div key={d} className="text-center font-label text-xs text-on-surface-variant font-semibold uppercase tracking-widest py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Dagen */}
          <div className="grid grid-cols-7 gap-1">
            {maandDagen.map(dag => {
              const key        = format(dag, 'yyyy-MM-dd')
              const items      = tochtenPerDag.get(key) ?? []
              const isHuigeMaand = dag.getMonth() === maand.getMonth()
              const isActief   = selectedDay === key
              const vandaag    = isToday(dag)

              return (
                <button
                  key={key}
                  onClick={() => items.length > 0 && setSelectedDay(isActief ? null : key)}
                  aria-label={`${format(dag, 'd MMMM', { locale: nl })}, ${items.length} tochten`}
                  aria-pressed={isActief}
                  disabled={items.length === 0}
                  className={`relative flex flex-col items-center py-2 rounded-xl transition-all
                    ${!isHuigeMaand ? 'opacity-25' : ''}
                    ${isActief ? 'gradient-primary shadow-glow' : vandaag ? 'border border-primary/40 bg-primary/5' : items.length > 0 ? 'hover:bg-surface-container-high' : ''}
                    ${items.length === 0 ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`font-label text-sm font-bold
                    ${isActief ? 'text-on-primary' : vandaag ? 'text-primary' : 'text-on-surface'}`}>
                    {format(dag, 'd')}
                  </span>
                  <DagStipjes dag={dag} />
                  {items.length > 0 && !isActief && (
                    <span className={`font-label text-[9px] mt-0.5 ${vandaag ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {items.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
        {Object.entries(GEBIED_COLOR_HEX).map(([id, kleur]) => (
          <div key={id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: kleur }} aria-hidden="true" />
            <span className="font-label text-[11px] text-on-surface-variant capitalize">
              {id.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Day sheet */}
      <TochtenCalendarDaySheet
        datum={selectedDay}
        tochten={selectedTochten}
        onClose={() => setSelectedDay(null)}
      />
    </div>
  )
}
