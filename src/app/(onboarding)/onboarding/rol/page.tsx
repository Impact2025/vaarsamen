'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LOOKING_FOR_LABELS, ROLE_LABELS, ROLE_EMOJI, type SailingRole, type LookingFor } from '@/types'

const ROLES: SailingRole[] = ['schipper', 'bemanning', 'beide']
const LOOKING_FOR: LookingFor[] = ['dagje_varen', 'weekend', 'regatta', 'zeilvakantie', 'alles']

export default function OnboardingRol() {
  const router = useRouter()
  const [role, setRole]             = useState<SailingRole | null>(null)
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([])

  const toggleLooking = (lf: LookingFor) => {
    if (lf === 'alles') {
      setLookingFor(['alles'])
      return
    }
    setLookingFor(prev => {
      const without = prev.filter(x => x !== 'alles')
      return without.includes(lf) ? without.filter(x => x !== lf) : [...without, lf]
    })
  }

  const handleNext = () => {
    if (!role) return
    localStorage.setItem('onboarding_stap4', JSON.stringify({
      sailingRole: role,
      lookingFor:  lookingFor.length ? lookingFor : ['alles'],
    }))
    router.push('/onboarding/beschikbaar')
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-8">
      <OnboardingProgress stap={4} totaal={5} />

      <div className="mt-8 mb-8">
        <h1 className="font-headline font-black text-4xl text-on-surface">
          Wat is jouw rol?
        </h1>
        <p className="font-body text-on-surface-variant mt-2">
          Ben je schipper, bemanning, of allebei?
        </p>
      </div>

      {/* Rol */}
      <div className="mb-8" role="radiogroup" aria-label="Rol kiezen">
        <div className="grid grid-cols-3 gap-3">
          {ROLES.map(r => (
            <button
              key={r}
              role="radio"
              aria-checked={role === r}
              onClick={() => setRole(r)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${role === r
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-white/10 bg-surface-container hover:border-white/20'}`}
            >
              <span className="text-3xl" aria-hidden="true">{ROLE_EMOJI[r]}</span>
              <span className={`font-label text-xs font-bold text-center ${role === r ? 'text-primary' : 'text-on-surface'}`}>
                {ROLE_LABELS[r]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Wat zoek je */}
      <div className="mb-8">
        <h2 className="font-label text-sm font-semibold text-on-surface mb-3">
          Wat zoek je?
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Zoekvoorkeur (meerdere mogelijk)"
        >
          {LOOKING_FOR.map(lf => {
            const isSelected = lookingFor.includes(lf)
            return (
              <button
                key={lf}
                aria-pressed={isSelected}
                onClick={() => toggleLooking(lf)}
                className={`px-4 py-2.5 rounded-full border font-label text-sm font-bold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isSelected
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {LOOKING_FOR_LABELS[lf]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-2 pb-8">
        <button
          onClick={handleNext}
          disabled={!role}
          className="w-full py-5 rounded-full gradient-primary text-on-primary
                     font-headline font-extrabold text-lg shadow-glow
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-95 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Volgende →
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
