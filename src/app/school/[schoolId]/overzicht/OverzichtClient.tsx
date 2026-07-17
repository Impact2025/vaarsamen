'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { SchoolOverzichtData } from '@/lib/db/queries/school-overzicht'
import type { SchoolRole } from '@/lib/db/schema'

// ─── BADGE HELPERS ────────────────────────────────────────────────────────────

type Badge = { label: string; cls: string }

const VERHUUR_STATUS: Record<string, Badge> = {
  aangevraagd: { label: 'Aangevraagd',   cls: 'bg-amber-400/15 text-amber-600 dark:text-amber-300' },
  goedgekeurd: { label: 'Goedgekeurd',  cls: 'bg-primary/15 text-primary' },
  afgewezen:   { label: 'Afgewezen',    cls: 'bg-red-500/15 text-red-600 dark:text-red-300' },
  geannuleerd: { label: 'Geannuleerd',  cls: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400' },
}

const KLUS_STATUS: Record<string, Badge> = {
  gemeld:        { label: 'Gemeld',        cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' },
  in_behandeling: { label: 'In behandeling', cls: 'bg-amber-400/15 text-amber-600 dark:text-amber-300' },
  besteld:       { label: 'Besteld',       cls: 'bg-violet-500/15 text-violet-600 dark:text-violet-300' },
}

const PRIORITEIT: Record<string, Badge> = {
  urgent: { label: 'Urgent', cls: 'bg-red-500/15 text-red-600 dark:text-red-300 ring-1 ring-red-500/30' },
  hoog:   { label: 'Hoog',   cls: 'bg-orange-500/15 text-orange-600 dark:text-orange-300' },
  normaal: { label: 'Normaal', cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' },
  laag:   { label: 'Laag',   cls: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400' },
}

const ROL_LABEL: Record<string, string> = {
  eigenaar:   'Eigenaar',
  instructeur: 'Instructeur',
  cursist:    'Cursist',
  lid:        'Lid',
  klusser:    'Klusser',
}

function Badge({ b }: { b: Badge }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label text-[11px] font-semibold ${b.cls}`}>
      {b.label}
    </span>
  )
}

function initials(naam: string | null): string {
  if (!naam) return '?'
  return naam.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

// ─── TOAST ─────────────────────────────────────────────────────────────────────

type ToastEntry = { id: number; message: string; type: 'success' | 'error' }
function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const counter = useRef(0)
  const toast = useCallback((message: string, type: ToastEntry['type'] = 'success') => {
    const id = ++counter.current
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
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={[
            'flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-deep font-label text-sm font-semibold',
            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-primary text-on-primary',
          ].join(' ')}
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">
            {t.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── PANEL CARD WRAPPER ─────────────────────────────────────────────────────────

function Panel({
  title, icon, href, hrefLabel, children,
}: {
  title: string
  icon: string
  href: string
  hrefLabel: string
  children: React.ReactNode
}) {
  return (
    <section className="glass-card rounded-3xl p-5 border border-white/5 flex flex-col">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">{icon}</span>
          </span>
          <h2 className="font-headline font-bold text-base text-on-surface">{title}</h2>
        </div>
        <Link
          href={href}
          className="font-label text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-0.5"
        >
          {hrefLabel}
          <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
        </Link>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="py-8 text-center font-label text-sm text-on-surface-variant">
      {label}
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

interface Props {
  schoolId: string
  schoolNaam: string
  data: SchoolOverzichtData
  myRole: SchoolRole
  isStaff: boolean
}

const KPIS = [
  { key: 'totaalLeden' as const, label: 'Leden totaal', icon: 'group' },
  { key: 'openVerhuur' as const, label: 'Verhuur open', icon: 'key', alert: true },
  { key: 'goedgekeurd' as const, label: 'Goedgekeurd', icon: 'check_circle' },
  { key: 'openKlussen' as const, label: 'Klussen open', icon: 'build', alert: true },
]

export function OverzichtClient({ schoolId, schoolNaam, data, myRole, isStaff }: Props) {
  const { kpis, nieuweLeden, laatsteVerhuur, openKlussen } = data
  const [mounted, setMounted] = useState(false)
  const { toasts, toast } = useToast()

  useEffect(() => setMounted(true), [])

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="font-label text-xs text-primary capitalize mb-1">{myRole} · {schoolNaam}</p>
          <h1 className="font-headline font-black text-2xl text-on-surface">Overzicht</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Direct zicht op nieuwe leden, bootverhuur en klussen.
          </p>
        </div>
        <Link
          href={`/school/${schoolId}/dashboard`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-label text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors border border-white/5"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
          Uitgebreid dashboard
        </Link>
      </div>

      {/* KPI-strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map(k => {
          const value = kpis[k.key]
          const hasAlert = 'alert' in k && k.alert && value > 0
          return (
            <div
              key={k.key}
              className={[
                'glass-card rounded-2xl p-4 border transition-all',
                hasAlert ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/5',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">{k.icon}</span>
                </span>
                {hasAlert && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" aria-label="Vereist aandacht" />
                )}
              </div>
              <div className="font-headline font-black text-2xl text-on-surface">
                {value.toLocaleString('nl-NL')}
              </div>
              <p className="font-label text-xs text-on-surface-variant mt-0.5">{k.label}</p>
            </div>
          )
        })}
      </div>

      {/* Panelen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Nieuwe leden */}
        {isStaff && (
          <Panel title="Nieuwe leden" icon="person_add" href={`/school/${schoolId}/dashboard`} hrefLabel="Alle leden">
            {nieuweLeden.length === 0 ? (
              <EmptyRow label="Nog geen leden aangemeld." />
            ) : (
              <ul className="divide-y divide-white/5 -my-1">
                {nieuweLeden.map(l => (
                  <li key={l.userId} className="flex items-center gap-3 py-2.5">
                    <span className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center font-headline font-bold text-sm text-on-surface-variant flex-shrink-0">
                      {initials(l.naam)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-label text-sm font-semibold text-on-surface truncate">{l.naam ?? l.email}</p>
                      <p className="font-label text-[11px] text-on-surface-variant truncate">
                        {ROL_LABEL[l.role] ?? l.role}
                        {l.joinedAt && (
                          <> · {format(new Date(l.joinedAt), 'd MMM', { locale: nl })}</>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {/* Laatste bootverhuur */}
        <Panel title="Laatste bootverhuur" icon="sailing" href={`/school/${schoolId}/verhuur`} hrefLabel="Alle verhuur">
          {laatsteVerhuur.length === 0 ? (
            <EmptyRow label="Nog geen verhuur geboekt." />
          ) : (
            <ul className="space-y-2">
              {laatsteVerhuur.map(v => (
                <li
                  key={v.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 hover:bg-surface-container-high/50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">sailing</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-label text-sm font-semibold text-on-surface truncate">
                      Boot {v.bootNummer}{v.bootNaam ? ` · ${v.bootNaam}` : ''}
                    </p>
                    <p className="font-label text-[11px] text-on-surface-variant truncate">
                      {format(parseISO(v.datum), 'EEEE d MMM', { locale: nl })} · {v.startTijd}–{v.eindTijd}
                      {v.aanvragerNaam && <> · {v.aanvragerNaam}</>}
                    </p>
                  </div>
                  <Badge b={VERHUUR_STATUS[v.status] ?? { label: v.status, cls: 'bg-zinc-500/15 text-zinc-500' }} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Open klussen */}
        <Panel title="Open klussen" icon="build" href={`/school/${schoolId}/dashboard`} hrefLabel="Alle klussen">
          {openKlussen.length === 0 ? (
            <EmptyRow label="Geen open klussen. 💪" />
          ) : (
            <ul className="space-y-2">
              {openKlussen.map(k => (
                <li
                  key={k.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl border border-white/5 hover:bg-surface-container-high/50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">build</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-label text-sm font-semibold text-on-surface truncate">{k.titel}</p>
                    <p className="font-label text-[11px] text-on-surface-variant truncate">
                      {(k.bootNummer || k.bootNaam) ? `Boot ${k.bootNummer}${k.bootNaam ? ` · ${k.bootNaam}` : ''}` : 'Geen boot'}
                      {k.gemeldOp && <> · {format(new Date(k.gemeldOp), 'd MMM', { locale: nl })}</>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge b={PRIORITEIT[k.prioriteit ?? 'normaal'] ?? { label: k.prioriteit ?? 'normaal', cls: 'bg-zinc-500/15 text-zinc-500' }} />
                      <Badge b={KLUS_STATUS[k.status] ?? { label: k.status, cls: 'bg-zinc-500/15 text-zinc-500' }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

      </div>
    </div>
  )
}
