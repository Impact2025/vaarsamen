'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SchoolFinancieelConfig } from '@/lib/db/queries/school-financieel'

// Basis-IBAN check (mod-97). Voldoende voor client-side feedback.
function ibanValide(raw: string): boolean {
  const s = raw.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(s)) return false
  const herschikt = s.slice(4) + s.slice(0, 4)
  const uitgbreid = herschikt.replace(/[A-Z]/g, c => (c.charCodeAt(0) - 55).toString())
  let rest = 0
  for (const ch of uitgbreid) {
    rest = (rest * 10 + (ch.charCodeAt(0) - 48)) % 97
  }
  return rest === 1
}

interface Props {
  schoolId: string
  schoolNaam: string
  initial: SchoolFinancieelConfig | null
}

// incasso-type opties
const TYPES: { v: 'RCUR' | 'FRST'; label: string }[] = [
  { v: 'RCUR', label: 'RCUR — herhaald (recurring)' },
  { v: 'FRST', label: 'FRST — eerste incasso' },
]

export function FinInstellingenClient({ schoolId, schoolNaam, initial }: Props) {
  const router = useRouter()
  const [naam, setNaam]         = useState(initial?.naam ?? schoolNaam)
  const [iban, setIban]         = useState(initial?.iban ?? '')
  const [bic, setBic]           = useState(initial?.bic ?? '')
  const [creditorId, setCreditorId] = useState(initial?.creditorId ?? '')
  const [type, setType]         = useState<'RCUR' | 'FRST'>(initial?.type ?? 'RCUR')
  const [busy, setBusy]         = useState(false)
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const t = useRef(0)

  const ibanRaw  = iban.replace(/\s+/g, '').toUpperCase()
  const ibanOk   = ibanValide(ibanRaw)
  const bicOk    = bic === '' || /^[A-Z0-9]{8,11}$/.test(bic.toUpperCase())
  const credOk   = creditorId.trim().length >= 3
  const naamOk   = naam.trim().length >= 2
  const valid    = ibanOk && bicOk && credOk && naamOk

  const save = useCallback(async () => {
    if (!valid) { setToast({ type: 'error', msg: 'Controleer de invoer.' }); return }
    setBusy(true)
    try {
      const res = await fetch(`/api/school/${schoolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financieel: {
            naam: naam.trim(),
            iban: ibanRaw,
            bic: bic.trim().toUpperCase(),
            creditorId: creditorId.trim(),
            type,
          },
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Opslaan mislukt (${res.status})`)
      }
      setToast({ type: 'success', msg: 'SEPA-crediteur opgeslagen.' })
      setTimeout(() => router.push(`/school/${schoolId}/financieel`), 900)
    } catch (e: any) {
      setToast({ type: 'error', msg: e.message ?? 'Opslaan mislukt' })
    } finally {
      setBusy(false)
    }
  }, [valid, naam, ibanRaw, bic, creditorId, type, schoolId, router])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/school/${schoolId}/financieel`}
          className="p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Terug naar financieel"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_back</span>
        </Link>
        <div>
          <p className="font-label text-xs text-primary capitalize mb-1">Financieel · {schoolNaam}</p>
          <h1 className="font-headline font-black text-2xl text-on-surface">SEPA-crediteur</h1>
        </div>
      </div>

      {toast && (
        <div className={['rounded-2xl px-4 py-3 flex items-center gap-2 font-label text-sm',
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-primary text-on-primary'].join(' ')}>
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.msg}
        </div>
      )}

      <section className="glass-card rounded-3xl p-6 border border-white/5 space-y-5">
        <div>
          <h2 className="font-headline font-bold text-base text-on-surface">Gegevens van de zeilschool</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Deze gegevens komen in het SEPA-incasso bestand (als crediteur). De IBAN wordt gebruikt
            om de incasso's vanaf jouw rekening te trekken.
          </p>
        </div>

        <div className="space-y-4">
          <Field label="Naam ten name van" hint="Bv. 'Zeilschool De Zwaluw'">
            <input
              className="form-input w-full rounded-xl px-3.5 py-2.5 font-label text-sm"
              value={naam} onChange={e => setNaam(e.target.value)}
              placeholder="Zeilschool De Zwaluw"
            />
          </Field>

          <Field label="IBAN (crediteur)" hint={iban && !ibanOk ? 'Ongeldige IBAN' : undefined}>
            <input
              className={['form-input w-full rounded-xl px-3.5 py-2.5 font-label text-sm font-mono',
                iban && !ibanOk ? 'border-red-500' : ''].join(' ')}
              value={iban} onChange={e => setIban(e.target.value)}
              placeholder="NL91 ABNA 0417 1643 00"
              maxLength={34}
            />
            {ibanRaw && ibanOk && (
              <p className="font-label text-[11px] text-green-600 dark:text-green-300 mt-1">✓ Geldige IBAN</p>
            )}
          </Field>

          <Field label="BIC (optioneel)" hint={bic && !bicOk ? 'Ongeldige BIC' : undefined}>
            <input
              className={['form-input w-full rounded-xl px-3.5 py-2.5 font-label text-sm font-mono uppercase',
                bic && !bicOk ? 'border-red-500' : ''].join(' ')}
              value={bic} onChange={e => setBic(e.target.value.toUpperCase())}
              placeholder="ABNANL2A"
              maxLength={11}
            />
          </Field>

          <Field label="Crediteur-ID (bij je bank)" hint="De unieke SEPA-crediteur-ID die je bank heeft toegekend (bv. NL53ZZZ000000000001).">
            <input
              className="form-input w-full rounded-xl px-3.5 py-2.5 font-label text-sm font-mono"
              value={creditorId} onChange={e => setCreditorId(e.target.value)}
              placeholder="NL53ZZZ000000000001"
              maxLength={35}
            />
          </Field>

          <Field label="Incasso-type">
            <div className="flex flex-wrap gap-2">
              {TYPES.map(o => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setType(o.v)}
                  className={['px-3.5 py-2.5 rounded-xl border font-label text-sm transition-colors',
                    type === o.v
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/10 text-on-surface-variant hover:bg-surface-container-high'].join(' ')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={busy || !valid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">save</span>
            {busy ? 'Opslaan…' : 'Opslaan'}
          </button>
          <Link
            href={`/school/${schoolId}/financieel`}
            className="px-4 py-2.5 rounded-xl font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Annuleren
          </Link>
        </div>
      </section>

      <p className="font-label text-[11px] text-on-surface-variant leading-relaxed">
        Zorg dat deze gegevens overeenkomen met wat je bank heeft geregistreerd als SEPA-crediteur.
        Een verkeerde creditor-ID of IBAN zorgt dat je bank de incasso weigert.
      </p>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-label text-sm font-semibold text-on-surface block mb-1.5">{label}</span>
      {children}
      {hint && <span className="font-label text-[11px] text-red-600 dark:text-red-300 mt-1 block">{hint}</span>}
    </label>
  )
}
