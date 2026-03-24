import Link from 'next/link'

interface Props {
  hasFilters: boolean
  totalCount: number
  onReset: () => void
}

export function TochtenEmptyState({ hasFilters, totalCount, onReset }: Props) {
  if (hasFilters && totalCount > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4" aria-hidden="true">
          search_off
        </span>
        <h3 className="font-headline font-bold text-lg text-on-surface mb-2">
          Geen resultaten
        </h3>
        <p className="font-body text-sm text-on-surface-variant mb-6 max-w-xs">
          Probeer andere filters of wis de zoekopdracht om alle tochten te zien.
        </p>
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-full gradient-primary text-on-primary font-label text-sm font-bold shadow-glow active:scale-95 transition-all"
        >
          Filters wissen
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4" aria-hidden="true">
        sailing
      </span>
      <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
        Nog geen oproepen
      </h3>
      <p className="font-body text-sm text-on-surface-variant mb-6 max-w-xs">
        Wees de eerste! Plaats een oproep voor jouw tocht en vind een maatje.
      </p>
      <Link
        href="/tochten/nieuw"
        className="gradient-primary text-on-primary font-label font-bold px-8 py-4 rounded-full shadow-glow active:scale-95 transition-all"
      >
        Oproep plaatsen
      </Link>
    </div>
  )
}
