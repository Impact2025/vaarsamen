import Link from 'next/link'
import Image from 'next/image'
import { SAILING_AREAS, BOAT_LABELS, CWO_LABELS, GEBIED_COLOR_HEX } from '@/types'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { TochtMetPoster } from '@/lib/db/queries/tochten'

export function TochtCard({ tocht, poster, aanmeldingen, compact = false }: TochtMetPoster & { compact?: boolean }) {
  const datum       = parseISO(tocht.datum as string)
  const datumLabel  = isToday(datum) ? 'Vandaag' : isTomorrow(datum) ? 'Morgen' : format(datum, 'EEEE d MMM', { locale: nl })
  const gebiedLabel = SAILING_AREAS.find(a => a.id === tocht.vaargebied)?.label ?? tocht.vaargebied
  const kleur       = GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5'

  return (
    <Link
      href={`/tochten/${tocht.id}`}
      className="block glass-card rounded-2xl p-4 border border-white/5
                 hover:border-primary/20 active:scale-[0.99] transition-all
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Kleur accent balk */}
      <div
        className="w-8 h-1 rounded-full mb-3"
        style={{ backgroundColor: kleur }}
        aria-hidden="true"
      />

      {/* Datum + gebied */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: kleur + '22', border: `1px solid ${kleur}44` }}>
          <span className="material-symbols-outlined text-xs" style={{ color: kleur }} aria-hidden="true">calendar_today</span>
          <span className="font-label text-xs font-black capitalize" style={{ color: kleur }}>{datumLabel}</span>
        </div>
        {tocht.vertrekTijd && (
          <span className="font-label text-xs text-on-surface-variant">{tocht.vertrekTijd}</span>
        )}
        <span className="font-label text-xs text-on-surface-variant ml-auto">{gebiedLabel}</span>
      </div>

      {/* Titel */}
      <h2 className="font-headline font-bold text-lg text-on-surface mb-1 leading-tight">
        {tocht.titel}
      </h2>

      {/* Locatie */}
      {tocht.locatie && (
        <div className="flex items-center gap-1 mb-3">
          <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">location_on</span>
          <span className="font-label text-xs text-on-surface-variant">{tocht.locatie}</span>
        </div>
      )}

      {/* Omschrijving preview */}
      {!compact && tocht.beschrijving && (
        <p className="font-body text-sm text-on-surface-variant mb-3 line-clamp-2">
          {tocht.beschrijving}
        </p>
      )}

      {/* Tags + aanmeldingen */}
      <div className="flex items-center gap-2 flex-wrap">
        {tocht.bootType && (
          <span className="px-2.5 py-1 rounded-full bg-surface-container-high border border-white/10 font-label text-xs text-on-surface-variant">
            {BOAT_LABELS[tocht.bootType as keyof typeof BOAT_LABELS]}
          </span>
        )}
        {tocht.cwoMinimum && tocht.cwoMinimum !== 'geen' && (
          <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-xs text-primary">
            min. {CWO_LABELS[tocht.cwoMinimum as keyof typeof CWO_LABELS]}
          </span>
        )}
        <span className="px-2.5 py-1 rounded-full bg-surface-container-high border border-white/10 font-label text-xs text-on-surface-variant ml-auto">
          {tocht.aantalPlaatsen} {tocht.aantalPlaatsen === 1 ? 'plek' : 'plekken'}
        </span>
        {aanmeldingen > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-surface-container border border-white/5 font-label text-xs text-on-surface-variant">
            {aanmeldingen} {aanmeldingen === 1 ? 'aanmelding' : 'aanmeldingen'}
          </span>
        )}
      </div>

      {/* Poster */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <div className="w-7 h-7 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
          {poster.photoUrl ? (
            <Image src={poster.photoUrl} alt={poster.displayName} width={28} height={28} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">person</span>
            </div>
          )}
        </div>
        <span className="font-label text-xs text-on-surface-variant">
          {poster.displayName}
          {poster.cwoLevel && poster.cwoLevel !== 'geen' && ` · ${CWO_LABELS[poster.cwoLevel as keyof typeof CWO_LABELS]}`}
        </span>
        {poster.cwoVerified && (
          <span className="material-symbols-outlined text-xs text-primary ml-auto" style={{ fontVariationSettings: "'FILL' 1" }} aria-label="CWO geverifieerd">verified</span>
        )}
      </div>
    </Link>
  )
}
