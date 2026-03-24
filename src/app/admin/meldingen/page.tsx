'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'

interface Melding {
  id:            string
  reason:        string
  description:   string | null
  status:        string
  createdAt:     string
  reviewedAt:    string | null
  reporterId:    string
  reportedId:    string
  reporterName:  string
  reporterPhoto: string | null
  reportedName:  string
  reportedPhoto: string | null
}

const REDEN_LABELS: Record<string, string> = {
  ongepast_gedrag: 'Ongepast gedrag',
  nep_profiel:     'Nep profiel',
  spam:            'Spam',
  minderjarig:     'Minderjarig',
  anders:          'Anders',
}

const FILTERS = [
  { id: 'pending',  label: 'Open' },
  { id: 'reviewed', label: 'Bekeken' },
  { id: 'resolved', label: 'Opgelost' },
  { id: 'all',      label: 'Alle' },
]

function MeldingenContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const filter = searchParams.get('filter') ?? 'pending'

  const [meldingen, setMeldingen] = useState<Melding[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch(`/api/admin/meldingen?filter=${filter}`).then(r => r.json())
    setMeldingen(data.meldingen ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const setFilter = (f: string) => router.replace(`?filter=${f}`, { scroll: false })

  const updateStatus = async (id: string, status: string) => {
    setSaving(id)
    await fetch(`/api/admin/meldingen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    setSaving(null)
  }

  const banUser = async (profileId: string) => {
    if (!confirm('Gebruiker blokkeren (onzichtbaar maken)?')) return
    await fetch(`/api/admin/gebruikers/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: false }),
    })
  }

  const STATUS_COLOR: Record<string, string> = {
    pending:   '#fbbf24',
    reviewed:  '#60a5fa',
    resolved:  '#34d399',
    dismissed: '#6b7280',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Meldingen</h1>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">{meldingen.length} resultaten</p>
        </div>
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
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {meldingen.map(m => {
            const kleur = STATUS_COLOR[m.status] ?? '#6b7280'
            return (
              <div key={m.id} className="glass-card rounded-2xl p-4 border border-white/5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="px-2 py-0.5 rounded-full font-label text-[10px] font-bold"
                        style={{ backgroundColor: kleur + '22', color: kleur }}
                      >{m.status}</span>
                      <span className="font-label text-xs font-bold text-on-surface">
                        {REDEN_LABELS[m.reason] ?? m.reason}
                      </span>
                    </div>
                    <p className="font-label text-xs text-on-surface-variant">
                      {format(parseISO(m.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                    </p>
                  </div>
                </div>

                {/* Reporter → Reported */}
                <div className="flex items-center gap-3 mb-3">
                  <ProfileChip photo={m.reporterPhoto} name={m.reporterName} label="Melder" />
                  <span className="material-symbols-outlined text-on-surface-variant text-base" aria-hidden="true">arrow_forward</span>
                  <ProfileChip photo={m.reportedPhoto} name={m.reportedName} label="Gemeld" />
                </div>

                {/* Beschrijving */}
                {m.description && (
                  <p className="font-body text-xs text-on-surface-variant italic mb-3 px-1">
                    "{m.description}"
                  </p>
                )}

                {/* Acties */}
                {m.status === 'pending' && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateStatus(m.id, 'reviewed')}
                      disabled={saving === m.id}
                      className="px-4 py-2 rounded-xl bg-surface-container-high border border-white/10 font-label text-xs text-on-surface hover:border-primary/30 transition-all disabled:opacity-50"
                    >
                      ✓ Bekeken
                    </button>
                    <button
                      onClick={() => updateStatus(m.id, 'resolved')}
                      disabled={saving === m.id}
                      className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 font-label text-xs text-primary font-bold transition-all disabled:opacity-50"
                    >
                      ✓✓ Opgelost
                    </button>
                    <button
                      onClick={() => updateStatus(m.id, 'dismissed')}
                      disabled={saving === m.id}
                      className="px-4 py-2 rounded-xl border border-white/10 font-label text-xs text-on-surface-variant hover:text-on-surface transition-all disabled:opacity-50"
                    >
                      Afwijzen
                    </button>
                    <button
                      onClick={() => banUser(m.reportedId)}
                      className="px-4 py-2 rounded-xl bg-error/10 border border-error/20 font-label text-xs text-error font-bold transition-all"
                    >
                      🚫 Blokkeer {m.reportedName}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {meldingen.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant font-body text-sm">
              {filter === 'pending' ? '🎉 Geen openstaande meldingen!' : 'Geen meldingen gevonden'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ProfileChip({ photo, name, label }: { photo: string | null; name: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
        {photo ? (
          <Image src={photo} alt={name} width={32} height={32} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">person</span>
          </div>
        )}
      </div>
      <div>
        <p className="font-label text-[10px] text-on-surface-variant">{label}</p>
        <p className="font-label text-xs font-bold text-on-surface">{name}</p>
      </div>
    </div>
  )
}

export default function AdminMeldingenPage() {
  return (
    <Suspense>
      <MeldingenContent />
    </Suspense>
  )
}
