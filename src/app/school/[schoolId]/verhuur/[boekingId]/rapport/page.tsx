'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Staat = 'goed' | 'matig' | 'slecht'

const PROBLEMEN_OPTIES = [
  'Roer beschadigd of stijf',
  'Schoot / touw kapot of versleten',
  'Grootzeil gescheurd of beschadigd',
  'Fok gescheurd of beschadigd',
  'Mast of tuigage problemen',
  'Cockpit lek of water in romp',
  'Zwaard beschadigd',
  'Verlichting werkt niet',
  'Zwemladder / uitrusting mist',
  'Reddingsvest beschadigd',
  'Anders',
]

export default function RapportPage() {
  const { schoolId, boekingId } = useParams<{ schoolId: string; boekingId: string }>()
  const router = useRouter()

  const [staat, setStaat]           = useState<Staat>('goed')
  const [problemen, setProblemen]   = useState<string[]>([])
  const [toelichting, setToel]      = useState('')
  const [saving, setSaving]         = useState(false)
  const [ingediend, setIngediend]   = useState(false)
  const [error, setError]           = useState('')

  function toggleProbleem(p: string) {
    setProblemen(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch(`/api/school/${schoolId}/verhuur/${boekingId}/rapport`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ staat, problemen, toelichting: toelichting || undefined }),
    })
    if (res.ok) {
      setIngediend(true)
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij indienen')
    }
    setSaving(false)
  }

  if (ingediend) {
    return (
      <main className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-green-400/15 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-green-400 text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Bedankt!</h1>
          <p className="font-body text-sm text-on-surface-variant">
            Uw rapportage is ontvangen. We zorgen dat eventuele meldingen worden opgepakt.
          </p>
          <button
            onClick={() => router.push(`/school/${schoolId}/verhuur`)}
            className="w-full py-3 rounded-xl gradient-primary font-label font-semibold text-on-primary shadow-glow"
          >
            Terug naar verhuur
          </button>
        </div>
      </main>
    )
  }

  const STAAT_OPTIES: { value: Staat; label: string; icon: string; cls: string }[] = [
    { value: 'goed',   label: 'Goed',  icon: 'check_circle', cls: 'border-green-400/40 bg-green-400/10 text-green-300'  },
    { value: 'matig',  label: 'Matig', icon: 'warning',      cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300'  },
    { value: 'slecht', label: 'Slecht',icon: 'cancel',        cls: 'border-red-400/40 bg-red-400/10 text-red-300'        },
  ]

  return (
    <main className="min-h-dvh bg-surface flex flex-col items-center justify-start p-6 pt-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-[1.25rem] bg-primary/15 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-primary text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
          </div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Rapportage boothuur</h1>
          <p className="font-body text-sm text-on-surface-variant">
            Tijdig invullen van een complete rapportage helpt ons onze boten in zo goed mogelijke staat te houden.
            Dank voor uw medewerking.
          </p>
        </div>

        {/* Staat van de boot */}
        <div className="space-y-3">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
            Staat van de boot na gebruik
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STAAT_OPTIES.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setStaat(o.value)}
                className={[
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all font-label text-sm font-semibold',
                  staat === o.value ? o.cls + ' border-current' : 'border-white/10 text-on-surface-variant hover:border-white/20',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                      aria-hidden="true">{o.icon}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Problemen */}
        {(staat === 'matig' || staat === 'slecht') && (
          <div className="space-y-3">
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
              Wat heeft u opgemerkt? (meerdere keuzes mogelijk)
            </p>
            <div className="space-y-1.5">
              {PROBLEMEN_OPTIES.map(p => (
                <label
                  key={p}
                  className={[
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    problemen.includes(p)
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-white/8 hover:border-white/15',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={problemen.includes(p)}
                    onChange={() => toggleProbleem(p)}
                    className="w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <span className="font-body text-sm text-on-surface">{p}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Toelichting */}
        <div className="space-y-2">
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider"
                 htmlFor="toelichting">
            Toelichting {staat === 'goed' ? '(optioneel)' : ''}
          </label>
          <textarea
            id="toelichting"
            value={toelichting}
            onChange={e => setToel(e.target.value)}
            rows={4}
            placeholder="Beschrijf eventuele bijzonderheden…"
            className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60 resize-none"
          />
        </div>

        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl gradient-primary font-label font-semibold text-on-primary disabled:opacity-50 shadow-glow"
        >
          {saving ? 'Indienen…' : 'Rapport indienen'}
        </button>
      </form>
    </main>
  )
}
