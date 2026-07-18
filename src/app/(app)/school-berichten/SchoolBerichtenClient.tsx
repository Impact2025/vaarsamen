'use client'

import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

type Bericht = {
  id: string; schoolId: string; schoolNaam: string; fromRole: string
  titel: string; bericht: string; gelezenOp: Date | null; createdAt: Date | null
}

const ROL_LABEL: Record<string, string> = {
  eigenaar: 'Eigenaar', instructeur: 'Instructeur', cursist: 'Cursist', lid: 'Lid', klusser: 'Klusser',
}

export function SchoolBerichtenClient({ initialBerichten }: { initialBerichten: Bericht[] }) {
  // Markeer als gelezen bij openen.
  useEffect(() => {
    if (initialBerichten.some(b => !b.gelezenOp)) {
      fetch('/api/school-berichten?markRead=1').catch(() => {})
    }
  }, [initialBerichten])

  if (initialBerichten.length === 0) {
    return (
      <div className="px-4 pt-6 pb-28">
        <h1 className="font-headline font-black text-2xl text-on-surface">Berichten van je school</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4" aria-hidden="true">campaign</span>
          <h2 className="font-headline font-bold text-xl text-on-surface mb-2">Nog geen berichten</h2>
          <p className="font-body text-sm text-on-surface-variant">
            Je zeilschool kan je hier rechtstreeks berichten sturen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-28">
      <header className="mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Berichten van je school</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">{initialBerichten.length} berichten</p>
      </header>

      <ul className="space-y-3">
        {initialBerichten.map(b => (
          <li key={b.id} className="rounded-2xl glass-card border border-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-label font-bold text-on-surface">{b.titel}</span>
              {!b.gelezenOp && (
                <span className="w-2.5 h-2.5 rounded-full gradient-primary flex-shrink-0" aria-label="Ongelezen" />
              )}
            </div>
            <p className="font-body text-sm text-on-surface mt-2">{b.bericht}</p>
            <p className="font-label text-[10px] text-on-surface-variant mt-3 uppercase tracking-wider">
              {b.schoolNaam} · {ROL_LABEL[b.fromRole] ?? b.fromRole}
              {b.createdAt ? ` · ${formatDistanceToNow(new Date(b.createdAt), { addSuffix: true, locale: nl })}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
