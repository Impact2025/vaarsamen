'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { CWO_LABELS } from '@/types'
import type { CWOLevel } from '@/types'

interface Gebruiker {
  id:               string
  displayName:      string
  photoUrl:         string | null
  cwoLevel:         CWOLevel
  cwoVerified:      boolean
  subscriptionTier: string
  isVisible:        boolean
  isFeatured:       boolean
  isOnboarded:      boolean
  lastActive:       string | null
  createdAt:        string
  email:            string
}

const FILTERS = [
  { id: 'all',         label: 'Alle' },
  { id: 'geblokkeerd', label: 'Geblokkeerd' },
  { id: 'featured',    label: 'Featured' },
  { id: 'pro',         label: 'Pro' },
  { id: 'cwo',         label: 'CWO' },
]

function GebruikersContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const filter = searchParams.get('filter') ?? 'all'
  const q      = searchParams.get('q') ?? ''

  const [gebruikers, setGebruikers] = useState<Gebruiker[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState(q)
  const [saving, setSaving]         = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ filter, q: search })
    const data = await fetch(`/api/admin/gebruikers?${params}`).then(r => r.json())
    setGebruikers(data.gebruikers ?? [])
    setLoading(false)
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const setFilter = (f: string) => {
    const sp = new URLSearchParams(searchParams)
    sp.set('filter', f)
    router.replace(`?${sp}`, { scroll: false })
  }

  const patch = async (id: string, updates: Record<string, unknown>) => {
    setSaving(id)
    await fetch(`/api/admin/gebruikers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await load()
    setSaving(null)
  }

  const verwijder = async (id: string) => {
    if (!confirm('Gebruiker permanent verwijderen (AVG)? Dit is onomkeerbaar.')) return
    setSaving(id)
    await fetch(`/api/admin/gebruikers/${id}`, { method: 'DELETE' })
    await load()
    setSaving(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Gebruikers</h1>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">{gebruikers.length} resultaten</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Zoek naam of e-mail…"
          className="px-4 py-2 rounded-xl bg-surface-container border border-white/10 text-on-surface
                     placeholder:text-on-surface-variant/40 font-body text-sm focus:outline-none focus:border-primary/50 w-56"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full font-label text-xs font-bold whitespace-nowrap transition-all
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
          {gebruikers.map(g => (
            <div key={g.id} className="glass-card rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                {g.photoUrl ? (
                  <Image src={g.photoUrl} alt={g.displayName} width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">person</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-label text-sm font-bold text-on-surface">{g.displayName}</span>
                  {!g.isVisible && (
                    <span className="px-1.5 py-0.5 rounded bg-error/20 text-error font-label text-[10px]">geblokkeerd</span>
                  )}
                  {g.isFeatured && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 font-label text-[10px]">featured</span>
                  )}
                  {g.subscriptionTier !== 'free' && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-label text-[10px]">{g.subscriptionTier}</span>
                  )}
                  {g.cwoVerified && (
                    <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-label="CWO geverifieerd">verified</span>
                  )}
                </div>
                <p className="font-label text-xs text-on-surface-variant truncate">
                  {g.email} · {CWO_LABELS[g.cwoLevel]}
                </p>
              </div>

              {/* Acties */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => patch(g.id, { isVisible: !g.isVisible })}
                  disabled={saving === g.id}
                  title={g.isVisible ? 'Blokkeren' : 'Deblokkeren'}
                  className={`p-2 rounded-xl transition-all disabled:opacity-50
                    ${g.isVisible ? 'hover:bg-error/10 text-on-surface-variant hover:text-error' : 'bg-error/10 text-error'}`}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    {g.isVisible ? 'block' : 'check_circle'}
                  </span>
                </button>
                <button
                  onClick={() => patch(g.id, { isFeatured: !g.isFeatured })}
                  disabled={saving === g.id}
                  title={g.isFeatured ? 'Unfeature' : 'Featuren'}
                  className={`p-2 rounded-xl transition-all disabled:opacity-50
                    ${g.isFeatured ? 'bg-amber-400/10 text-amber-400' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">star</span>
                </button>
                <button
                  onClick={() => verwijder(g.id)}
                  disabled={saving === g.id}
                  title="Verwijderen (AVG)"
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                </button>
              </div>
            </div>
          ))}

          {gebruikers.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body text-sm">
              Geen gebruikers gevonden
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminGebruikersPage() {
  return (
    <Suspense>
      <GebruikersContent />
    </Suspense>
  )
}
