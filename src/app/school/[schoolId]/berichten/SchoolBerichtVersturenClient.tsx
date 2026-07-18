'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

type Lid = { membershipId: string; naam: string | null; email: string; role: string; status: string }
type Verzonden = { id: string; titel: string; bericht: string; createdAt: string | null; reacties: number }
type Reactie = { id: string; bericht: string; gelezenDoorSchoolOp: string | null; createdAt: string | null }

export function SchoolBerichtVersturenClient({ schoolId, leden }: { schoolId: string; leden: Lid[] }) {
  const router = useRouter()
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())
  const [titel, setTitel]       = useState('')
  const [bericht, setBericht]    = useState('')
  const [busy, setBusy]          = useState(false)
  const [fout, setFout]          = useState<string | null>(null)
  const [succes, setSucces]      = useState<string | null>(null)
  const [verzonden, setVerzonden] = useState<Verzonden[]>([])
  const [openId, setOpenId]      = useState<string | null>(null)
  const [reacties, setReacties]  = useState<Record<string, Reactie[]>>({})

  async function laadVerzonden() {
    try {
      const res = await fetch(`/api/school/${schoolId}/berichten`)
      if (res.ok) {
        const d = await res.json()
        setVerzonden(d.berichten ?? [])
      }
    } catch { /* ignore */ }
  }
  useEffect(() => { laadVerzonden() }, [schoolId])

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
        await laadVerzonden()
        router.refresh()
      }
    } catch {
      setFout('Netwerkfout. Probeer het opnieuw.')
    } finally {
      setBusy(false)
    }
  }

  async function openBericht(id: string) {
    setOpenId(id)
    if (!reacties[id]) {
      const res = await fetch(`/api/school/${schoolId}/berichten/${id}`)
      if (res.ok) {
        const d = await res.json()
        setReacties(prev => ({ ...prev, [id]: d.reacties ?? [] }))
      }
    }
  }

  async function markeerGelezen(berichtId: string, reactieId: string) {
    const res = await fetch(`/api/school/${schoolId}/berichten/${berichtId}/reactie/${reactieId}`, { method: 'PATCH' })
    if (res.ok) {
      setReacties(prev => ({
        ...prev,
        [berichtId]: (prev[berichtId] ?? []).map(r => r.id === reactieId ? { ...r, gelezenDoorSchoolOp: new Date().toISOString() } : r),
      }))
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

      <section className="mt-10" aria-label="Verzonden berichten">
        <h2 className="font-label font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-3">
          Verzonden ({verzonden.length})
        </h2>
        {verzonden.length === 0 ? (
          <p className="text-on-surface-variant">Nog geen berichten verstuurd.</p>
        ) : (
          <ul className="space-y-2">
            {verzonden.map(v => (
              <li key={v.id} className="rounded-2xl glass-card border border-white/5">
                <button onClick={() => openBericht(v.id)} className="w-full text-left p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label font-bold text-on-surface">{v.titel}</span>
                    <span className="font-label text-[10px] rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      {v.reacties} {v.reacties === 1 ? 'reactie' : 'reacties'}
                    </span>
                  </div>
                  <p className="font-body text-xs text-on-surface-variant mt-1">{v.bericht}</p>
                </button>

                {openId === v.id && (reacties[v.id] ?? []).length > 0 && (
                  <div className="px-4 pb-4 space-y-2">
                    {(reacties[v.id] ?? []).map(r => (
                      <div key={r.id} className="rounded-xl bg-surface-container-high/60 p-3">
                        <p className="font-body text-sm text-on-surface">{r.bericht}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-label text-[10px] text-on-surface-variant">
                            {r.gelezenDoorSchoolOp ? 'Gezien door school' : 'Nog niet gelezen'}
                          </span>
                          {!r.gelezenDoorSchoolOp && (
                            <button onClick={() => markeerGelezen(v.id, r.id)}
                              className="font-label text-[10px] text-primary underline">
                              Markeer als gelezen
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
