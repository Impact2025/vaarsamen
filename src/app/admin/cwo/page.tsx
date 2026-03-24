'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { CWO_LABELS } from '@/types'
import type { CWOLevel } from '@/types'

interface CWOAanvraag {
  id:             string
  displayName:    string
  photoUrl:       string | null
  cwoLevel:       CWOLevel
  cwoVerified:    boolean
  cwoDocumentUrl: string | null
  cwoVerifiedAt:  string | null
  createdAt:      string
  email:          string
}

const FILTERS = [
  { id: 'wachtend',    label: 'Wachtrij' },
  { id: 'goedgekeurd', label: 'Goedgekeurd' },
]

function CWOContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const filter = searchParams.get('filter') ?? 'wachtend'

  const [aanvragen, setAanvragen] = useState<CWOAanvraag[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch(`/api/admin/cwo?filter=${filter}`).then(r => r.json())
    setAanvragen(data.aanvragen ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const setFilter = (f: string) => router.replace(`?filter=${f}`, { scroll: false })

  const beoordeel = async (id: string, actie: 'goedkeuren' | 'afwijzen') => {
    if (actie === 'afwijzen' && !confirm('CWO aanvraag afwijzen? Het geüploade document wordt verwijderd.')) return
    setSaving(id)
    await fetch(`/api/admin/cwo/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actie }),
    })
    await load()
    setSaving(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">CWO Verificatie</h1>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">
            {aanvragen.length} {filter === 'wachtend' ? 'wachtend op beoordeling' : 'resultaten'}
          </p>
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
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {aanvragen.map(a => (
              <div key={a.id} className="glass-card rounded-2xl p-4 border border-white/5">
                {/* Profiel */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-surface-container-high flex-shrink-0">
                    {a.photoUrl ? (
                      <Image src={a.photoUrl} alt={a.displayName} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">person</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label text-sm font-bold text-on-surface">{a.displayName}</span>
                      {a.cwoVerified && (
                        <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-label="Geverifieerd">verified</span>
                      )}
                    </div>
                    <p className="font-label text-xs text-on-surface-variant">{a.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 font-label text-[10px] text-primary">
                        {CWO_LABELS[a.cwoLevel]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document preview */}
                {a.cwoDocumentUrl && (
                  <a
                    href={a.cwoDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl bg-surface-container border border-white/10
                               hover:border-primary/30 transition-all mb-4 group"
                  >
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">description</span>
                    <span className="font-label text-xs text-on-surface-variant group-hover:text-on-surface transition-colors flex-1 truncate">
                      CWO certificaat bekijken
                    </span>
                    <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">open_in_new</span>
                  </a>
                )}

                {/* Datum */}
                <p className="font-label text-[10px] text-on-surface-variant mb-4">
                  Aangevraagd op {format(parseISO(a.createdAt), 'd MMMM yyyy', { locale: nl })}
                  {a.cwoVerifiedAt && ` · Goedgekeurd op ${format(parseISO(a.cwoVerifiedAt), 'd MMMM yyyy', { locale: nl })}`}
                </p>

                {/* Acties */}
                {!a.cwoVerified && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => beoordeel(a.id, 'goedkeuren')}
                      disabled={saving === a.id}
                      className="flex-1 py-2.5 rounded-xl gradient-primary text-on-primary font-label text-sm font-bold shadow-glow disabled:opacity-50 active:scale-95 transition-all"
                    >
                      ✓ Goedkeuren
                    </button>
                    <button
                      onClick={() => beoordeel(a.id, 'afwijzen')}
                      disabled={saving === a.id}
                      className="flex-1 py-2.5 rounded-xl border border-error/30 text-error font-label text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
                    >
                      ✗ Afwijzen
                    </button>
                  </div>
                )}
                {a.cwoVerified && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                    <p className="font-label text-xs text-primary font-bold">Geverifieerd</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {aanvragen.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body text-sm">
              {filter === 'wachtend' ? '✅ Geen aanvragen in de wachtrij!' : 'Geen goedgekeurde aanvragen'}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AdminCWOPage() {
  return (
    <Suspense>
      <CWOContent />
    </Suspense>
  )
}
