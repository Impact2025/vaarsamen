'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SchoolRole, MembershipStatus } from '@/lib/db/schema'

type Aanmelding = {
  userId: string
  naam:   string | null
  email:  string
  role:   SchoolRole
  status: MembershipStatus
}

type Uitnodiging = {
  id:        string
  email:     string | null
  naam:      string | null
  role:      SchoolRole
  expiresAt: string | null
}

const ROL_OPTIES: { waarde: SchoolRole; label: string }[] = [
  { waarde: 'lid',         label: 'Lid — mag huren na goedkeuring' },
  { waarde: 'cursist',     label: 'Cursist — volgt lessen' },
  { waarde: 'klusser',     label: 'Klusser — onderhoud & klussen' },
  { waarde: 'instructeur', label: 'Instructeur — lessen & cursisten' },
]

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  onboarding:           'Onboarding',
  wacht_op_goedkeuring: 'Wacht op goedkeuring',
  goedgekeurd:          'Goedgekeurd',
  afgewezen:            'Afgewezen',
}

export const STATUS_STIJL: Record<MembershipStatus, string> = {
  onboarding:           'bg-white/8 text-on-surface-variant',
  wacht_op_goedkeuring: 'bg-amber-500/15 text-amber-300',
  goedgekeurd:          'bg-primary/15 text-primary',
  afgewezen:            'bg-error/15 text-error',
}

export default function LedenBeheer({
  schoolId, toast, onLedenGewijzigd,
}: {
  schoolId: string
  toast: (msg: string, type?: 'success' | 'error') => void
  onLedenGewijzigd?: () => void
}) {
  const [aanmeldingen, setAanmeldingen] = useState<Aanmelding[]>([])
  const [uitnodigingen, setUitnodigingen] = useState<Uitnodiging[]>([])
  const [bezig, setBezig] = useState<string | null>(null)

  const laden = useCallback(async () => {
    const [ledenRes, invRes] = await Promise.all([
      fetch(`/api/school/${schoolId}/leden`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/school/${schoolId}/leden/invite`).then(r => r.json()).catch(() => ({})),
    ])
    setAanmeldingen(
      (ledenRes.leden ?? []).filter((l: Aanmelding) => l.status === 'wacht_op_goedkeuring'),
    )
    setUitnodigingen(invRes.uitnodigingen ?? [])
  }, [schoolId])

  useEffect(() => { void laden() }, [laden])

  async function beoordeel(userId: string, actie: 'goedkeuren' | 'afwijzen') {
    let body: Record<string, string> = { actie }
    if (actie === 'afwijzen') {
      const reden = window.prompt('Waarom wijs je deze aanmelding af? Dit wordt gemaild.')
      if (!reden || reden.trim().length < 3) return
      body = { actie, reden: reden.trim() }
    }
    setBezig(userId)
    const res = await fetch(`/api/school/${schoolId}/leden/${userId}/beoordeling`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    setBezig(null)
    if (res.ok) {
      setAanmeldingen(prev => prev.filter(a => a.userId !== userId))
      toast(actie === 'goedkeuren' ? 'Lid goedgekeurd — mail verstuurd' : 'Aanmelding afgewezen')
      onLedenGewijzigd?.()
    } else {
      const d = await res.json().catch(() => ({}))
      toast(typeof d.error === 'string' ? d.error : 'Beoordelen mislukt', 'error')
    }
  }

  async function trekIn(id: string) {
    const res = await fetch(`/api/school/${schoolId}/leden/invite?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUitnodigingen(prev => prev.filter(u => u.id !== id))
      toast('Uitnodiging ingetrokken')
    } else {
      toast('Intrekken mislukt', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <UitnodigenForm
        schoolId={schoolId}
        toast={toast}
        onVerstuurd={u => setUitnodigingen(prev => [u, ...prev.filter(p => p.email !== u.email)])}
      />

      {aanmeldingen.length > 0 && (
        <section className="bg-surface-container-high rounded-2xl p-4 border border-amber-400/20 space-y-3">
          <h3 className="font-label text-sm font-bold text-amber-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-base" aria-hidden="true">pending_actions</span>
            Wacht op goedkeuring ({aanmeldingen.length})
          </h3>
          {aanmeldingen.map(a => (
            <div key={a.userId} className="flex items-center justify-between gap-3 bg-surface-container rounded-xl p-3">
              <div className="min-w-0">
                <p className="font-label text-sm font-semibold text-on-surface truncate">
                  {a.naam ?? a.email}
                </p>
                <p className="font-body text-xs text-on-surface-variant truncate">
                  {a.email} · {a.role}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => beoordeel(a.userId, 'afwijzen')}
                  disabled={bezig === a.userId}
                  className="px-3 py-1.5 rounded-lg border border-error/30 text-error font-label text-xs font-semibold hover:bg-error/10 transition-colors disabled:opacity-50"
                >
                  Afwijzen
                </button>
                <button
                  onClick={() => beoordeel(a.userId, 'goedkeuren')}
                  disabled={bezig === a.userId}
                  className="px-3 py-1.5 rounded-lg gradient-primary text-on-primary font-label text-xs font-bold disabled:opacity-50"
                >
                  {bezig === a.userId ? '…' : 'Goedkeuren'}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {uitnodigingen.length > 0 && (
        <section className="bg-surface-container-high rounded-2xl p-4 border border-white/10 space-y-2">
          <h3 className="font-label text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-base" aria-hidden="true">outgoing_mail</span>
            Openstaande uitnodigingen ({uitnodigingen.length})
          </h3>
          {uitnodigingen.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="font-label text-sm text-on-surface truncate">{u.naam ?? u.email}</p>
                <p className="font-body text-xs text-on-surface-variant truncate">
                  {u.email} · uitgenodigd als {u.role}
                </p>
              </div>
              <button
                onClick={() => trekIn(u.id)}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-white/10 font-label text-xs text-on-surface-variant hover:text-error hover:border-error/30 transition-colors"
              >
                Intrekken
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function UitnodigenForm({
  schoolId, toast, onVerstuurd,
}: {
  schoolId: string
  toast: (msg: string, type?: 'success' | 'error') => void
  onVerstuurd: (u: Uitnodiging) => void
}) {
  const [open, setOpen]     = useState(false)
  const [email, setEmail]   = useState('')
  const [naam, setNaam]     = useState('')
  const [role, setRole]     = useState<SchoolRole>('lid')
  const [bezig, setBezig]   = useState(false)
  const [fout, setFout]     = useState('')

  async function versturen(e: React.FormEvent) {
    e.preventDefault()
    setBezig(true); setFout('')
    const res = await fetch(`/api/school/${schoolId}/leden/invite`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, naam: naam || undefined, role }),
    })
    const d = await res.json().catch(() => ({}))
    setBezig(false)

    if (!res.ok) {
      setFout(typeof d.error === 'string' ? d.error : 'Uitnodigen mislukt')
      return
    }
    onVerstuurd(d.uitnodiging)
    setEmail(''); setNaam(''); setOpen(false)
    // De uitnodiging staat in de database, ook als de mail niet aankwam. Dat
    // verschil moet staff zien, anders wacht men op een mail die nooit kwam.
    toast(
      d.mailVerstuurd
        ? `Uitnodiging gemaild naar ${d.uitnodiging.email}`
        : 'Uitnodiging aangemaakt, maar de mail kon niet verstuurd worden — deel de link handmatig',
      d.mailVerstuurd ? 'success' : 'error',
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/30 font-label text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">mail</span>
        Lid uitnodigen per e-mail
      </button>
    )
  }

  return (
    <form onSubmit={versturen} className="bg-surface-container-high rounded-2xl p-4 border border-primary/20 space-y-3">
      <p className="font-label text-sm font-semibold text-on-surface">Lid uitnodigen</p>

      {fout && (
        <div className="rounded-xl bg-error/10 border border-error/20 px-3 py-2">
          <p className="font-body text-xs text-error">{fout}</p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor="inv-email" className="sr-only">E-mailadres</label>
          <input
            id="inv-email" type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="naam@email.nl"
            className="form-input w-full px-3 py-2.5 rounded-xl font-body text-sm"
          />
        </div>
        <div>
          <label htmlFor="inv-naam" className="sr-only">Naam (optioneel)</label>
          <input
            id="inv-naam" value={naam}
            onChange={e => setNaam(e.target.value)}
            placeholder="Naam (optioneel)"
            className="form-input w-full px-3 py-2.5 rounded-xl font-body text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="inv-rol" className="sr-only">Rol</label>
        <select
          id="inv-rol" value={role}
          onChange={e => setRole(e.target.value as SchoolRole)}
          className="form-input w-full px-3 py-2.5 rounded-xl font-body text-sm"
        >
          {ROL_OPTIES.map(o => (
            <option key={o.waarde} value={o.waarde}>{o.label}</option>
          ))}
        </select>
      </div>

      <p className="font-body text-xs text-on-surface-variant">
        Er gaat een mail naar dit adres met een persoonlijke aanmeldlink. Na de onboarding
        beoordeel je de aanmelding hier.
      </p>

      <div className="flex gap-2">
        <button
          type="button" onClick={() => { setOpen(false); setFout('') }}
          className="flex-1 py-2.5 rounded-xl border border-white/10 font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Annuleren
        </button>
        <button
          type="submit" disabled={bezig}
          className="flex-1 py-2.5 rounded-xl gradient-primary text-on-primary font-label text-sm font-bold shadow-glow disabled:opacity-60"
        >
          {bezig ? 'Versturen…' : 'Uitnodiging versturen'}
        </button>
      </div>
    </form>
  )
}
