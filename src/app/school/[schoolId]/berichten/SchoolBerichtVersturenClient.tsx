'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Lid = { membershipId: string; naam: string | null; email: string; role: string; status: string }

export function SchoolBerichtVersturenClient({ schoolId, leden }: { schoolId: string; leden: Lid[] }) {
  const router = useRouter()
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())
  const [titel, setTitel]       = useState('')
  const [bericht, setBericht]    = useState('')
  const [busy, setBusy]          = useState(false)
  const [fout, setFout]          = useState<string | null>(null)
  const [succes, setSucces]      = useState<string | null>(null)

  function toggle(id: string) {
    setGeselecteerd(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function verstuur(e: React.FormEvent) {
    e.preventDefault()
    setFout(null); setSucces(null)
    if (geselecteerd.size === 0) { setFout('Selecteer minstens één lid.'); return }
    if (!titel.trim() || !bericht.trim()) { setFout('Vul een titel en bericht in.'); return }
    setBusy(true)
    try {
      const res = await fetch(`/api/school/${schoolId}/berichten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lidIds: [...geselecteerd], titel, bericht }),
      })
      const data = await res.json()
      if (!res.ok) setFout(data.error ?? 'Kon bericht niet versturen.')
      else {
        setSucces(`${data.verstuurd} bericht(en) verstuurd.`)
        setGeselecteerd(new Set()); setTitel(''); setBericht('')
        router.refresh()
      }
    } catch {
      setFout('Netwerkfout. Probeer het opnieuw.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 pb-24">
      <header className="mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Bericht aan leden</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Stuur een bericht dat leden in de VaarSamen-app zien onder “School”.
        </p>
      </header>

      <form onSubmit={verstuur} className="space-y-4">
        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Titel</label>
          <input value={titel} onChange={e => setTitel(e.target.value)} maxLength={120} required
            placeholder="Bijv. Lesrooster week 14"
            className="mt-1 w-full rounded-xl bg-surface-container-high px-3 py-2.5 text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        </div>
        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Bericht</label>
          <textarea value={bericht} onChange={e => setBericht(e.target.value)} rows={4} maxLength={2000} required
            placeholder="Schrijf hier je bericht…"
            className="mt-1 w-full rounded-xl bg-surface-container-high px-3 py-2.5 text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary" />
        </div>

        <div>
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
            Ontvangers ({geselecteerd.size} geselecteerd)
          </p>
          <ul className="space-y-1 max-h-72 overflow-y-auto rounded-xl border border-white/5 p-2">
            {leden.map(l => (
              <li key={l.membershipId}>
                <label className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-container-high cursor-pointer">
                  <input type="checkbox" checked={geselecteerd.has(l.membershipId)} onChange={() => toggle(l.membershipId)}
                    className="accent-primary" />
                  <span className="font-label text-sm text-on-surface">{l.naam ?? l.email}</span>
                  <span className="font-label text-[10px] text-on-surface-variant uppercase ml-auto">{l.role}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {fout && <p className="font-body text-sm text-red-500">{fout}</p>}
        {succes && <p className="font-body text-sm text-green-500">{succes}</p>}

        <Button type="submit" loading={busy} className="w-full">Bericht versturen</Button>
      </form>
    </div>
  )
}
