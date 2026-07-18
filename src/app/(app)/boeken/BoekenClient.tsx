'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Boot = { id: string; bootNummer: string; naam: string | null; bootType: string | null; capacity: number | null }
type Reservering = {
  id: string; bootNummer: string | null; naam: string | null
  datum: string; startTijd: string; eindTijd: string
  status: string; opmerking: string | null; reactie: string | null
}

const STATUS_LABEL: Record<string, string> = {
  aangevraagd: 'Aangevraagd',
  goedgekeurd: 'Goedgekeurd',
  afgewezen:  'Afgewezen',
}

export function BoekenClient({
  schoolId, schoolNaam, magReserveren, status, vloot, mijnReserveringen,
}: {
  schoolId: string
  schoolNaam: string
  magReserveren: boolean
  status: string
  vloot: Boot[]
  mijnReserveringen: Reservering[]
}) {
  const router = useRouter()
  const [bootId, setBootId]         = useState('')
  const [datum, setDatum]           = useState('')
  const [startTijd, setStartTijd]   = useState('09:00')
  const [eindTijd, setEindTijd]     = useState('13:00')
  const [opmerking, setOpmerking]   = useState('')
  const [busy, setBusy]             = useState(false)
  const [fout, setFout]             = useState<string | null>(null)
  const [succes, setSucces]         = useState<string | null>(null)

  async function boeken(e: React.FormEvent) {
    e.preventDefault()
    setFout(null); setSucces(null)
    if (!bootId || !datum) { setFout('Kies een boot en een datum.'); return }
    setBusy(true)
    try {
      const res = await fetch(`/api/school/${schoolId}/verhuur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bootId, datum, startTijd, eindTijd, opmerking }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFout(data.error ?? 'Kon reservering niet opslaan.')
      } else {
        setSucces('Aanvraag verstuurd! De school beoordeelt deze.')
        setBootId(''); setOpmerking('')
        router.refresh()
      }
    } catch {
      setFout('Netwerkfout. Probeer het opnieuw.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-28">
      <header className="mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Boot reserveren</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          {schoolNaam}
        </p>
      </header>

      {!magReserveren && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="font-label text-sm text-amber-700 dark:text-amber-300">
            {status === 'wacht_op_goedkeuring'
              ? 'Je aanmelding wacht nog op goedkeuring door de school. Zodra die er is, kun je reserveren.'
              : 'Je mag nog geen boot reserveren bij deze school.'}
          </p>
        </div>
      )}

      {vloot.length === 0 ? (
        <p className="text-on-surface-variant">Deze school heeft nog geen boten in de vloot.</p>
      ) : (
        <form onSubmit={boeken} className="space-y-4 rounded-2xl glass-card border border-white/5 p-4">
          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Boot</label>
            <select
              value={bootId} onChange={e => setBootId(e.target.value)}
              required
              className="mt-1 w-full rounded-xl bg-surface-container-high px-3 py-2.5 text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Kies een boot…</option>
              {vloot.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bootNummer}{b.naam ? ` — ${b.naam}` : ''}{b.bootType ? ` (${b.bootType})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Datum</label>
              <input type="date" value={datum} onChange={e => setDatum(e.target.value)} required
                className="mt-1 w-full rounded-xl bg-surface-container-high px-3 py-2.5 text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Van</label>
              <input type="time" value={startTijd} onChange={e => setStartTijd(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container-high px-3 py-2.5 text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Tot</label>
              <input type="time" value={eindTijd} onChange={e => setEindTijd(e.target.value)}
                className="mt-1 w-full rounded-xl bg-surface-container-high px-3 py-2.5 text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
          </div>

          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Opmerking (optioneel)</label>
            <textarea value={opmerking} onChange={e => setOpmerking(e.target.value)} rows={2} maxLength={500}
              placeholder="Bijv. solo oefenen voor het examen"
              className="mt-1 w-full rounded-xl bg-surface-container-high px-3 py-2.5 text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </div>

          {fout && <p className="font-body text-sm text-red-500">{fout}</p>}
          {succes && <p className="font-body text-sm text-green-500">{succes}</p>}

          <Button type="submit" loading={busy} disabled={!magReserveren} className="w-full">
            Aanvraag versturen
          </Button>
        </form>
      )}

      <section className="mt-8" aria-label="Mijn reserveringen">
        <h2 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-3">
          Mijn reserveringen ({mijnReserveringen.length})
        </h2>
        {mijnReserveringen.length === 0 ? (
          <p className="text-on-surface-variant">Nog geen reserveringen.</p>
        ) : (
          <ul className="space-y-2">
            {mijnReserveringen.map(r => (
              <li key={r.id} className="rounded-2xl glass-card border border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-label font-bold text-on-surface">
                    Boot {r.bootNummer}{r.naam ? ` — ${r.naam}` : ''}
                  </span>
                  <span className="font-label text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
                <p className="font-body text-xs text-on-surface-variant mt-1">
                  {r.datum} · {r.startTijd}–{r.eindTijd}
                </p>
                {r.opmerking && <p className="font-body text-xs text-on-surface-variant mt-1">“{r.opmerking}”</p>}
                {r.reactie && <p className="font-body text-xs text-primary mt-1">School: “{r.reactie}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
