'use client'

import { useState } from 'react'

export function AdminSeedSection() {
  const [status, setStatus] = useState<Record<string, string>>({})

  async function runSeed(endpoint: string, key: string) {
    setStatus(s => ({ ...s, [key]: 'bezig...' }))
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setStatus(s => ({ ...s, [key]: `${data.aangemaakt} aangemaakt, ${data.bestaand} bestonden al` }))
      } else {
        setStatus(s => ({ ...s, [key]: `Fout: ${data.error}` }))
      }
    } catch {
      setStatus(s => ({ ...s, [key]: 'Verbindingsfout' }))
    }
  }

  const seeds = [
    {
      key:      'profiles',
      label:    'Demo zeilerprofielen',
      desc:     '8 nep-profielen voor de discovery feed (isFeatured)',
      endpoint: '/api/admin/demo/profiles',
      icon:     'group',
    },
    {
      key:      'school',
      label:    'Demo zeilschool',
      desc:     'School, cursisten, lessen en beoordelingen',
      endpoint: '/api/admin/demo/seed',
      icon:     'school',
    },
    {
      key:      'skills',
      label:    'CWO vaardigheden',
      desc:     'KB2 skill definitions (18 vaardigheden)',
      endpoint: '/api/admin/skills/seed',
      icon:     'verified',
    },
  ]

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5 mt-6">
      <h2 className="font-headline font-bold text-base text-on-surface mb-1">Seed data</h2>
      <p className="font-body text-xs text-on-surface-variant mb-4">Idempotent — veilig meerdere keren uitvoeren</p>
      <div className="flex flex-col gap-3">
        {seeds.map(seed => (
          <div key={seed.key} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="material-symbols-outlined text-primary flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >{seed.icon}</span>
              <div className="min-w-0">
                <p className="font-label text-sm font-semibold text-on-surface">{seed.label}</p>
                <p className="font-body text-xs text-on-surface-variant truncate">{seed.desc}</p>
                {status[seed.key] && (
                  <p className="font-body text-xs text-primary mt-0.5">{status[seed.key]}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => runSeed(seed.endpoint, seed.key)}
              disabled={status[seed.key] === 'bezig...'}
              className="flex-shrink-0 px-4 py-2 rounded-full border border-primary/30 text-primary
                         font-label text-xs font-semibold hover:bg-primary/10 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status[seed.key] === 'bezig...' ? 'Bezig...' : 'Uitvoeren'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
