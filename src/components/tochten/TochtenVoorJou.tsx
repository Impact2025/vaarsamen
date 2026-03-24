import Link from 'next/link'
import Image from 'next/image'
import { SAILING_AREAS, GEBIED_COLOR_HEX, CWO_LABELS } from '@/types'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { TochtMetPoster } from '@/lib/db/queries/tochten'

export function TochtenVoorJou({ tochten }: { tochten: TochtMetPoster[] }) {
  if (tochten.length === 0) return null

  return (
    <section aria-label="Tochten voor jou" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-headline font-bold text-base text-on-surface">
          Voor jou
        </h2>
        <span className="font-label text-xs text-on-surface-variant">
          {tochten.length} {tochten.length === 1 ? 'tocht' : 'tochten'} in jouw gebieden
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {tochten.map(({ tocht, poster }) => {
          const datum      = parseISO(tocht.datum as string)
          const datumLabel = isToday(datum) ? 'Vandaag' : isTomorrow(datum) ? 'Morgen' : format(datum, 'EEE d MMM', { locale: nl })
          const kleur      = GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5'
          const gebied     = SAILING_AREAS.find(a => a.id === tocht.vaargebied)?.label ?? tocht.vaargebied

          return (
            <Link
              key={tocht.id}
              href={`/tochten/${tocht.id}`}
              className="flex-shrink-0 w-64 glass-card rounded-2xl p-4 border border-white/5
                         hover:border-primary/20 active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* Kleur balk + datum */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} />
                <span className="font-label text-xs font-black capitalize" style={{ color: kleur }}>
                  {datumLabel}
                </span>
                {tocht.vertrekTijd && (
                  <span className="font-label text-xs text-on-surface-variant">{tocht.vertrekTijd}</span>
                )}
              </div>

              <h3 className="font-headline font-bold text-sm text-on-surface leading-snug mb-2 line-clamp-2">
                {tocht.titel}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="font-label text-xs text-on-surface-variant">{gebied}</span>
                {tocht.cwoMinimum && tocht.cwoMinimum !== 'geen' && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 font-label text-xs text-primary">
                    {CWO_LABELS[tocht.cwoMinimum as keyof typeof CWO_LABELS]}
                  </span>
                )}
              </div>

              {/* Poster */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                  {poster.photoUrl ? (
                    <Image src={poster.photoUrl} alt={poster.displayName} width={24} height={24} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">person</span>
                    </div>
                  )}
                </div>
                <span className="font-label text-xs text-on-surface-variant truncate">{poster.displayName}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
