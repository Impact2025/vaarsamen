'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CWO_LABELS, type CWOLevel } from '@/types'

const CWO_OPTIONS: { level: CWOLevel; label: string; desc: string }[] = [
  { level: 'geen',          label: 'Geen diploma',  desc: 'Ik ben beginner of leerbereid' },
  { level: 'cwo1',          label: 'CWO I',         desc: 'Basiszeilen op binnenwater' },
  { level: 'cwo2',          label: 'CWO II',        desc: 'Zelfstandig zeilen op ruim water' },
  { level: 'cwo3',          label: 'CWO III',       desc: 'Gevorderd zeilen, buitenwater' },
  { level: 'cwo4',          label: 'CWO IV',        desc: 'Expert niveau, alle omstandigheden' },
  { level: 'cwo_kielboot1', label: 'Kielboot I',    desc: 'Basiszeilen kielboot' },
  { level: 'cwo_kielboot2', label: 'Kielboot II',   desc: 'Gevorderd kielboot' },
  { level: 'cwo_kielboot3', label: 'Kielboot III',  desc: 'Expert kielboot, kustvaart' },
]

export default function OnboardingNiveau() {
  const router  = useRouter()
  const [selected, setSelected] = useState<CWOLevel | null>(null)

  const handleNext = () => {
    if (!selected) return
    const prev = JSON.parse(localStorage.getItem('onboarding_stap1') ?? '{}')
    localStorage.setItem('onboarding_stap2', JSON.stringify({ cwoLevel: selected }))
    router.push('/onboarding/boot')
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-8">
      <OnboardingProgress stap={2} totaal={5} />

      <div className="mt-8 mb-8">
        <h1 className="font-headline font-black text-4xl text-on-surface">
          Wat is je CWO niveau?
        </h1>
        <p className="font-body text-on-surface-variant mt-2">
          Dit helpt ons je te koppelen aan zeilers op jouw niveau.
        </p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="CWO niveau selecteren">
        {CWO_OPTIONS.map(({ level, label, desc }) => (
          <button
            key={level}
            role="radio"
            aria-checked={selected === level}
            onClick={() => setSelected(level)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${selected === level
                ? 'border-primary/60 bg-primary/10 shadow-glow'
                : 'border-white/10 bg-surface-container hover:border-white/20'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${selected === level ? 'gradient-primary shadow-glow' : 'bg-surface-container-high'}`}>
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: "'FILL' 1", color: selected === level ? '#00382b' : '#bacac2' }}
                aria-hidden="true"
              >
                {level === 'geen' ? 'school' : 'anchor'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-label font-bold text-sm ${selected === level ? 'text-primary' : 'text-on-surface'}`}>
                {label}
              </p>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">{desc}</p>
            </div>
            {selected === level && (
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                check_circle
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pt-6 pb-8">
        <button
          onClick={handleNext}
          disabled={!selected}
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
        <div
          className="h-full gradient-primary rounded-full transition-all duration-500"
          style={{ width: `${(stap / totaal) * 100}%` }}
        />
      </div>
    </div>
  )
}
