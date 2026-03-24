'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SAILING_AREAS, SKILL_TAGS } from '@/types'

const QUICK_DATES = [
  { label: 'Dit weekend', days: [0, 1] },
  { label: 'Volgende week', days: [7, 8, 9, 10, 11, 12, 13] },
  { label: 'Doordeweeks', days: [1, 2, 3, 4, 5] },
]

export default function OnboardingBeschikbaar() {
  const router = useRouter()
  const [areas, setAreas]   = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const toggleArea  = (id: string) => setAreas(prev =>  prev.includes(id)  ? prev.filter(a => a !== id)  : [...prev, id])
  const toggleSkill = (s: string)  => setSkills(prev => prev.includes(s)   ? prev.filter(x => x !== s)   : [...prev, s])

  const handleFinish = async () => {
    setSaving(true)
    setError(null)

    try {
      // Samenvoegen van alle onboarding stappen
      const stap1 = JSON.parse(localStorage.getItem('onboarding_stap1') ?? '{}')
      const stap2 = JSON.parse(localStorage.getItem('onboarding_stap2') ?? '{}')
      const stap3 = JSON.parse(localStorage.getItem('onboarding_stap3') ?? '{}')
      const stap4 = JSON.parse(localStorage.getItem('onboarding_stap4') ?? '{}')

      const profileData = {
        ...stap1,
        ...stap2,
        ...stap4,
        sailingAreas: areas,
        skillTags:    skills,
      }

      // Maak profiel aan
      const profileRes = await fetch('/api/profiles', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(profileData),
      })

      if (!profileRes.ok) {
        const data = await profileRes.json()
        throw new Error(data.error ?? 'Kon profiel niet opslaan')
      }

      // Voeg boten toe als gebruiker een boot heeft
      if (stap3.hasBoat && stap3.boatTypes?.length > 0) {
        await Promise.all(stap3.boatTypes.map((type: string) =>
          fetch('/api/boats', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ type }),
          })
        ))
      }

      // Markeer profiel als onboarded
      await fetch('/api/profiles/complete', { method: 'POST' })

      // Verwijder localStorage data
      ;['stap1', 'stap2', 'stap3', 'stap4'].forEach(s =>
        localStorage.removeItem(`onboarding_${s}`)
      )

      router.push('/ontdekken')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-8">
      <OnboardingProgress stap={5} totaal={5} />

      <div className="mt-8 mb-8">
        <h1 className="font-headline font-black text-4xl text-on-surface">
          Waar en wat?
        </h1>
        <p className="font-body text-on-surface-variant mt-2">
          Kies je favoriete vaargebieden en vaardigheden.
        </p>
      </div>

      {/* Vaargebieden */}
      <section className="mb-8">
        <h2 className="font-label text-sm font-semibold text-on-surface mb-3">
          Vaargebieden
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Vaargebieden selecteren (meerdere mogelijk)"
        >
          {SAILING_AREAS.map(({ id, label }) => {
            const isSelected = areas.includes(id)
            return (
              <button
                key={id}
                aria-pressed={isSelected}
                onClick={() => toggleArea(id)}
                className={`px-4 py-2.5 rounded-full border font-label text-sm font-bold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isSelected
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Skill tags */}
      <section className="mb-8">
        <h2 className="font-label text-sm font-semibold text-on-surface mb-3">
          Vaardigheden <span className="text-on-surface-variant font-normal">(optioneel)</span>
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Vaardigheden selecteren"
        >
          {SKILL_TAGS.map(skill => {
            const isSelected = skills.includes(skill)
            return (
              <button
                key={skill}
                aria-pressed={isSelected}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2 rounded-xl border font-label text-xs font-semibold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isSelected
                    ? 'border-secondary/60 bg-secondary/10 text-secondary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {skill}
              </button>
            )
          })}
        </div>
      </section>

      {error && (
        <div role="alert" className="mb-4 p-4 rounded-2xl bg-error/10 border border-error/20">
          <p className="font-label text-sm text-error">{error}</p>
        </div>
      )}

      <div className="pb-8">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full py-5 rounded-full gradient-primary text-on-primary
                     font-headline font-extrabold text-lg shadow-glow
                     disabled:opacity-50 active:scale-95 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {saving ? 'Even geduld...' : '🚢 Start met varen!'}
        </button>
      </div>
    </main>
  )
}

function OnboardingProgress({ stap, totaal }: { stap: number; totaal: number }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-label text-xs text-on-surface-variant">Stap {stap} van {totaal}</span>
        <span className="font-label text-xs text-primary">{Math.round((stap / totaal) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden" role="progressbar" aria-valuenow={stap} aria-valuemin={1} aria-valuemax={totaal}>
        <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${(stap / totaal) * 100}%` }} />
      </div>
    </div>
  )
}
