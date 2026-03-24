'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BOAT_LABELS, type BoatType } from '@/types'

const BOAT_OPTIONS: { type: BoatType; emoji: string }[] = [
  { type: 'valk',        emoji: '⛵' },
  { type: 'polyvalk',    emoji: '⛵' },
  { type: 'laser',       emoji: '🏄' },
  { type: 'laser_pico',  emoji: '🏄' },
  { type: 'rs_feva',     emoji: '🏄' },
  { type: 'kajuitjacht', emoji: '🛥️' },
  { type: 'catamaran',   emoji: '⛵' },
  { type: 'anders',      emoji: '🚢' },
]

export default function OnboardingBoot() {
  const router   = useRouter()
  const [selected, setSelected] = useState<BoatType[]>([])
  const [hasBoat, setHasBoat]   = useState<boolean | null>(null)

  const toggle = (type: BoatType) => {
    setSelected(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleNext = () => {
    localStorage.setItem('onboarding_stap3', JSON.stringify({ boatTypes: selected, hasBoat }))
    router.push('/onboarding/rol')
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-8">
      <OnboardingProgress stap={3} totaal={5} />

      <div className="mt-8 mb-8">
        <h1 className="font-headline font-black text-4xl text-on-surface">
          Welk type boot?
        </h1>
        <p className="font-body text-on-surface-variant mt-2">
          Selecteer het type waar jij op vaart of wil varen.
        </p>
      </div>

      {/* Eigen boot ja/nee */}
      <div className="mb-6">
        <p className="font-label text-sm font-semibold text-on-surface mb-3">Heb je een eigen boot?</p>
        <div className="flex gap-3">
          {[
            { value: true,  label: 'Ja, ik heb een boot' },
            { value: false, label: 'Nee, ik zoek een schipper' },
          ].map(({ value, label }) => (
            <button
              key={String(value)}
              onClick={() => setHasBoat(value)}
              aria-pressed={hasBoat === value}
              className={`flex-1 py-3 px-4 rounded-2xl border font-label text-sm font-bold transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${hasBoat === value
                  ? 'border-primary/60 bg-primary/10 text-primary'
                  : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Boot types grid */}
      <div
        className="grid grid-cols-2 gap-3"
        role="group"
        aria-label="Boottype selecteren (meerdere mogelijk)"
      >
        {BOAT_OPTIONS.map(({ type, emoji }) => {
          const isSelected = selected.includes(type)
          return (
            <button
              key={type}
              onClick={() => toggle(type)}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isSelected
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-white/10 bg-surface-container hover:border-white/20'}`}
            >
              <span className="text-2xl" aria-hidden="true">{emoji}</span>
              <span className={`font-label text-sm font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                {BOAT_LABELS[type]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="pt-6 pb-8">
        <button
          onClick={handleNext}
          className="w-full py-5 rounded-full gradient-primary text-on-primary
                     font-headline font-extrabold text-lg shadow-glow
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
