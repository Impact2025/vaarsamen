'use client'

import { useState, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'
import type { SchoolFinancieelData, FinPeriode } from '@/lib/db/queries/school-financieel'
import { eur } from '@/lib/db/queries/school-financieel'

const PERIODES: { key: string; label: string }[] = [
  { key: 'deze_maand',   label: 'Deze maand' },
  { key: 'deze_kwartaal', label: 'Deze kwartaal' },
  { key: 'dit_jaar',     label: 'Dit jaar' },
  { key: 'alle',         label: 'Alle jaren' },
]

type ToastEntry = { id: number; message: string; type: 'success' | 'error' }
function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const c = useRef(0)
  const toast = useCallback((message: string, type: ToastEntry['type'] = 'success') => {
    const id = ++c.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])
  return { toasts, toast }
}

function ToastContainer({ toasts }: { toasts: ToastEntry[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} role="status" aria-live="polite"
          className={['flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-deep font-label text-sm font-semibold',
            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-primary text-on-primary'].join(' ')}>
          <span className="material-symbols-outlined text-base" aria-hidden="true">{t.type === 'error' ? 'error' : 'check_circle'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

function KpiCard({ label, waarde, alert, sub }: { label: string; waarde: string; alert?: boolean; sub?: string }) {
  return (
    <div className={['glass-card rounded-2xl p-4 border transition-all',
      alert ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/5'].join(' ')}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-label text-xs text-on-surface-variant">{label}</p>
        {alert && <span className="w-2 h-2 rounded-full bg-amber-400" aria-label="Open" />}
      </div>
      <div className="font-headline font-black text-2xl text-on-surface">{waarde}</div>
      {sub && <p className="font-label text-[11px] text-on-surface-variant mt-0.5">{sub}</p>}
    </div>
  )
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label text-[11px] font-semibold ${cls}`}>{label}</span>
}

interface Props {
  schoolId: string
  schoolNaam: string
  data: SchoolFinancieelData
}

export function FinancieelClient({ schoolId, schoolNaam, data }: Props) {
  const { kpis, verhuur, leden, incassoGereed } = data
  const [periode, setPeriode] = useState('dit_jaar')
  const [busy, setBusy] = useState<null | 'sepa' | 'btw'>(null)
  const { toasts, toast } = useToast()

  const download = useCallback(async (kind: 'sepa' | 'btw') => {
    setBusy(kind)
    try {
      const url = kind === 'sepa'
        ? `/api/school/${schoolId}/export/sepa`
        : `/api/school/${schoolId}/export/btw?periode=${periode}`
      const res = await fetch(url, { method: kind === 'sepa' ? 'POST' : 'GET' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `Export mislukt (${res.status})`)
      }
      const blob = await res.blob()
      const fn = res.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/)?.['1'] ?? `export-${kind}.${kind === 'sepa' ? 'xml' : 'csv'}`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fn
      a.click()
      URL.revokeObjectURL(a.href)
      toast(kind === 'sepa' ? 'SEPA-incasso XML gedownload' : 'BTW-overzicht CSV gedownload')
    } catch (e: any) {
      toast(e.message ?? 'Export mislukt')
    } finally {
      setBusy(null)
    }
  }, [schoolId, periode, toast])

  const sepaCount = incassoGereed.length

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-label text-xs text-primary capitalize mb-1">Financieel · {schoolNaam}</p>
          <h1 className="font-headline font-black text-2xl text-on-surface">Financieel overzicht</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Inkomsten, open posten en SEPA-export voor lidmaatschappen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="form-input rounded-xl px-3 py-2 font-label text-sm"
            aria-label="Periode"
          >
            {PERIODES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* KPI-strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Verhuur ontvangen" waarde={eur(kpis.verhuurBetaald)} sub={`periode: ${data.periode.label}`} />
        <KpiCard label="Verhuur open" waarde={eur(kpis.verhuurOpen)} alert={kpis.verhuurOpenAantal > 0} sub={`${kpis.verhuurOpenAantal} posten open`} />
        <KpiCard label="Lidmaatschap ontvangen" waarde={eur(kpis.lidmaatschapBetaald)} />
        <KpiCard label="Contributie open" waarde={eur(kpis.lidmaatschapOpen)} alert={kpis.lidmaatschapOpenAantal > 0} sub={`${kpis.lidmaatschapOpenAantal} leden`} />
      </div>

      {/* Export-acties */}
      <section className="glass-card rounded-2xl p-5 border border-white/5">
        <h2 className="font-headline font-bold text-base text-on-surface mb-1">Exports</h2>
        <p className="font-body text-sm text-on-surface-variant mb-4">
          Download een kant-en-klaar bestand voor je boekhouding of bank.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => download('sepa')}
            disabled={busy !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">download</span>
            {busy === 'sepa' ? 'Genereren…' : `SEPA-incasso XML (${sepaCount})`}
          </button>
          <button
            onClick={() => download('btw')}
            disabled={busy !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-on-surface font-label text-sm font-semibold hover:bg-surface-container-high disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">download</span>
            {busy === 'btw' ? 'Genereren…' : 'BTW-overzicht CSV'}
          </button>
          <Link
            href={`/school/${schoolId}/dashboard`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-on-surface-variant font-label text-sm hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">settings</span>
            Crediteur instellen
          </Link>
        </div>
        {sepaCount === 0 && (
          <p className="font-label text-xs text-amber-600 dark:text-amber-300 mt-3">
            Nog geen leden met een geldige SEPA-machtiging + IBAN. Vul die in bij het lid om incasso mogelijk te maken.
          </p>
        )}
      </section>

      {/* Lidmaatschappen */}
      <section className="glass-card rounded-3xl p-5 border border-white/5">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">group</span>
            </span>
            <h2 className="font-headline font-bold text-base text-on-surface">Lidmaatschappen</h2>
          </div>
          <span className="font-label text-xs text-on-surface-variant">{leden.length} leden met contributie</span>
        </header>
        {leden.length === 0 ? (
          <div className="py-8 text-center font-label text-sm text-on-surface-variant">Nog geen lidmaatschapsgelden ingesteld.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-label text-xs text-on-surface-variant border-b border-white/5">
                  <th className="pb-2 font-medium">Lid</th>
                  <th className="pb-2 font-medium text-right">Contributie</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">SEPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leden.map(l => (
                  <tr key={l.userId}>
                    <td className="py-2.5">
                      <p className="font-label font-semibold text-on-surface">{l.naam ?? l.email}</p>
                      <p className="font-label text-[11px] text-on-surface-variant">{l.email}</p>
                    </td>
                    <td className="py-2.5 text-right font-label text-on-surface">{eur(l.bedrag)}</td>
                    <td className="py-2.5">
                      {l.status === 'betaald'
                        ? <Badge label="Betaald" cls="bg-primary/15 text-primary" />
                        : <Badge label="Open" cls="bg-amber-400/15 text-amber-600 dark:text-amber-300" />}
                    </td>
                    <td className="py-2.5">
                      {l.incassoGereed
                        ? <Badge label="Incasso gereed" cls="bg-green-500/15 text-green-600 dark:text-green-300" />
                        : <Badge label="Geen machtiging" cls="bg-zinc-500/15 text-zinc-500 dark:text-zinc-400" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Laatste verhuur */}
      <section className="glass-card rounded-3xl p-5 border border-white/5">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">sailing</span>
            </span>
            <h2 className="font-headline font-bold text-base text-on-surface">Laatste bootverhuur</h2>
          </div>
          <Link href={`/school/${schoolId}/verhuur`} className="font-label text-xs text-primary/70 hover:text-primary flex items-center gap-0.5">
            Alle verhuur <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
          </Link>
        </header>
        {verhuur.length === 0 ? (
          <div className="py-8 text-center font-label text-sm text-on-surface-variant">Nog geen verhuur met een bedrag.</div>
        ) : (
          <ul className="space-y-2">
            {verhuur.map(v => (
              <li key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5">
                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">sailing</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-label text-sm font-semibold text-on-surface truncate">
                    Boot {v.bootNummer}{v.bootNaam ? ` · ${v.bootNaam}` : ''}
                  </p>
                  <p className="font-label text-[11px] text-on-surface-variant truncate">
                    {format(parseISO(v.datum), 'EEEE d MMM', { locale: nl })}
                    {v.huurderNaam && <> · {v.huurderNaam}</>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-label text-sm font-semibold text-on-surface">{eur(v.bedrag)}</p>
                  <p className="font-label text-[11px] text-on-surface-variant">
                    {v.betaaldOp ? 'Betaald' : 'Open'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
