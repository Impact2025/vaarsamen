'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token:      string
  schoolName: string
  schoolCity: string | null
  role:       string
  label:      string | null
  isLoggedIn: boolean
}

const ROLE_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  cursist:     { label: 'Cursist',     icon: 'school',   desc: 'Je kunt je eigen vorderingen inzien' },
  instructeur: { label: 'Instructeur', icon: 'anchor',   desc: 'Je kunt lessen registreren en cursisten beoordelen' },
  eigenaar:    { label: 'Eigenaar',    icon: 'business', desc: 'Volledige toegang tot het schoolbeheer' },
}

export function JoinClient({ token, schoolName, schoolCity, role, label, isLoggedIn }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const roleInfo = ROLE_LABELS[role] ?? ROLE_LABELS.cursist

  async function handleJoin() {
    setLoading(true); setError(null)

    const res = await fetch('/api/school/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Er ging iets mis')
      setLoading(false)
      return
    }

    setSchoolId(data.schoolId)
    setDone(true)
    setLoading(false)

    // Stuur meteen door
    if (role === 'cursist') {
      router.push('/mijn-vorderingen')
    } else {
      router.push(`/school/${data.schoolId}/dashboard`)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-primary" aria-hidden="true">check_circle</span>
        <div>
          <h1 className="font-headline font-bold text-xl text-on-surface">Welkom bij {schoolName}!</h1>
          <p className="font-body text-sm text-on-surface-variant mt-2">Je wordt doorgestuurd…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* School kaart */}
      <div className="bg-surface-container rounded-2xl border border-white/10 p-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true">sailing</span>
        </div>
        <h1 className="font-headline font-bold text-xl text-on-surface">{schoolName}</h1>
        {schoolCity && (
          <p className="font-body text-sm text-on-surface-variant mt-1">{schoolCity}</p>
        )}
        {label && (
          <span className="mt-2 inline-block px-3 py-1 rounded-full bg-primary/10 font-label text-xs text-primary">
            {label}
          </span>
        )}
      </div>

      {/* Rol info */}
      <div className="bg-surface-container rounded-xl border border-white/5 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">{roleInfo.icon}</span>
        </div>
        <div>
          <p className="font-label font-semibold text-on-surface text-sm">
            Je wordt uitgenodigd als <span className="text-primary">{roleInfo.label}</span>
          </p>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">{roleInfo.desc}</p>
        </div>
      </div>

      {/* Actie */}
      {error && (
        <p className="font-body text-sm text-error text-center" role="alert">{error}</p>
      )}

      {isLoggedIn ? (
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full py-4 rounded-2xl gradient-primary font-label font-bold text-on-primary shadow-glow disabled:opacity-50 disabled:shadow-none transition-opacity text-base"
        >
          {loading ? 'Bezig…' : `Deelnemen aan ${schoolName} →`}
        </button>
      ) : (
        <a
          href={`/login?callbackUrl=/school/join/${token}`}
          className="block w-full py-4 rounded-2xl gradient-primary font-label font-bold text-on-primary shadow-glow text-base text-center"
        >
          Inloggen en deelnemen →
        </a>
      )}

      <p className="text-center font-label text-xs text-on-surface-variant/60">
        Door deel te nemen ga je akkoord met de gebruiksvoorwaarden van VaarSamen
      </p>
    </div>
  )
}
