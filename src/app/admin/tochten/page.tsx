'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { SAILING_AREAS, GEBIED_COLOR_HEX } from '@/types'

interface AdminTocht {
  id:             string
  titel:          string
  datum:          string
  vaargebied:     string
  status:         string
  aantalPlaatsen: number
  createdAt:      string
  poster:         string
  posterId:       string
  aanmeldingen:   number
}

const FILTERS = [
  { id: 'all',         label: 'Alle' },
  { id: 'open',        label: 'Open' },
  { id: 'vol',         label: 'Vol' },
  { id: 'geannuleerd', label: 'Geannuleerd' },
]

function TochtenContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const filter = searchParams.get('filter') ?? 'all'

  const [tochten, setTochten] = useState<AdminTocht[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch(`/api/admin/tochten?filter=${filter}`).then(r => r.json())
    setTochten(data.tochten ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const setFilter = (f: string) => {
    router.replace(`?filter=${f}`, { scroll: false })
  }

  const verwijder = async (id: string, titel: string) => {
    if (!confirm(`Tocht "${titel}" verwijderen?`)) return
    setDeleting(id)
    await fetch(`/api/admin/tochten/${id}`, { method: 'DELETE' })
    await load()
    setDeleting(null)
  }

  const STATUS_COLOR: Record<string, string> = {
    open:        '#34d399',
    vol:         '#fbbf24',
    gevaren:     '#60a5fa',
    geannuleerd: '#fb7185',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Tochten</h1>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">{tochten.length} resultaten</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full font-label text-xs font-bold transition-all
              ${filter === f.id ? 'gradient-primary text-on-primary shadow-glow' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tochten.map(t => {
            const kleur = GEBIED_COLOR_HEX[t.vaargebied] ?? '#46f1c5'
            const gebiedLabel = SAILING_AREAS.find(a => a.id === t.vaargebied)?.label ?? t.vaargebied
            const statusKleur = STATUS_COLOR[t.status] ?? '#46f1c5'
            return (
              <div key={t.id} className="glass-card rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-3">
                {/* Vaargebied kleur blok */}
                <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-label text-sm font-bold text-on-surface truncate">{t.titel}</span>
                    <span
                      className="px-2 py-0.5 rounded-full font-label text-[10px] font-bold"
                      style={{ backgroundColor: statusKleur + '22', color: statusKleur }}
                    >{t.status}</span>
                  </div>
                  <p className="font-label text-xs text-on-surface-variant mt-0.5">
                    {format(parseISO(t.datum as string), 'd MMM yyyy', { locale: nl })}
                    {' · '}{gebiedLabel}
                    {' · '}{t.poster}
                    {' · '}{t.aanmeldingen} aanmeldingen
                  </p>
                </div>

                {/* Verwijder */}
                <button
                  onClick={() => verwijder(t.id, t.titel)}
                  disabled={deleting === t.id}
                  title="Verwijderen"
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all disabled:opacity-50 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                </button>
              </div>
            )
          })}

          {tochten.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body text-sm">
              Geen tochten gevonden
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminTochtenPage() {
  return (
    <Suspense>
      <TochtenContent />
    </Suspense>
  )
}
