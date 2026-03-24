import Link from 'next/link'
import { SAILING_AREAS, GEBIED_COLOR_HEX } from '@/types'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { TochtMetPoster } from '@/lib/db/queries/tochten'

export function TochtenDezeWeek({ tochten }: { tochten: TochtMetPoster[] }) {
  if (tochten.length === 0) return null

  return (
    <section aria-label="Tochten deze week" className="mb-6">
      <h2 className="font-headline font-bold text-base text-on-surface mb-3 px-0">
        Deze week
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {tochten.map(({ tocht, poster, aanmeldingen }) => {
          const datum      = parseISO(tocht.datum as string)
          const datumLabel = isToday(datum) ? 'Vandaag' : isTomorrow(datum) ? 'Morgen' : format(datum, 'EEE d MMM', { locale: nl })
          const kleur      = GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5'
          const gebied     = SAILING_AREAS.find(a => a.id === tocht.vaargebied)?.label ?? tocht.vaargebied

          return (
            <Link
              key={tocht.id}
              href={`/tochten/${tocht.id}`}
              className="flex-shrink-0 w-52 glass-card rounded-2xl p-3 border border-white/5
                         hover:border-primary/20 active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="w-6 h-1 rounded-full mb-2" style={{ backgroundColor: kleur }} />
              <p className="font-label text-xs font-black mb-1 capitalize" style={{ color: kleur }}>
                {datumLabel} {tocht.vertrekTijd && `· ${tocht.vertrekTijd}`}
              </p>
              <h3 className="font-headline font-bold text-sm text-on-surface leading-snug mb-1 line-clamp-2">
                {tocht.titel}
              </h3>
              <p className="font-label text-xs text-on-surface-variant">{gebied}</p>
              {tocht.locatie && (
                <p className="font-label text-xs text-on-surface-variant/60 line-clamp-1 mt-0.5">{tocht.locatie}</p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
