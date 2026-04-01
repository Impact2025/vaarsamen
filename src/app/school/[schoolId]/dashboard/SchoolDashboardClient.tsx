'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { SchoolDashboardData } from '@/lib/db/queries/school'
import { BOAT_LABELS } from '@/types'

// ─── TOAST ────────────────────────────────────────────────────────────────────

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
            t.type === 'error'
              ? 'bg-error text-on-error'
              : 'bg-primary text-on-primary',
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

interface Props {
  dashboard: SchoolDashboardData
  schoolId:  string
  myUserId:  string
  myRole:    'eigenaar' | 'instructeur' | 'cursist'
}

type Tab = 'lessen' | 'vloot' | 'leden' | 'verhuur'

export function SchoolDashboardClient({ dashboard, schoolId, myUserId, myRole }: Props) {
  const { school, stats, courses, recenteLessen } = dashboard
  const isEigenaar = myRole === 'eigenaar'

  const [activeTab, setActiveTab]         = useState<Tab>('lessen')
  const [openCourse, setOpenCourse]       = useState<string | null>(courses[0]?.id ?? null)
  const [showNieuweCursus, setShowNieuweCursus] = useState(false)
  const [mounted, setMounted]             = useState(false)
  const { toasts, toast } = useToast()

  useEffect(() => setMounted(true), [])

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">{school.name}</h1>
          {school.city && (
            <p className="font-body text-sm text-on-surface-variant mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">location_on</span>
              {school.city}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cursisten',    value: stats.totaalCursisten,    icon: 'school'         },
          { label: 'Instructeurs', value: stats.totaalInstructeurs, icon: 'person_check'   },
          { label: 'Lessen',       value: stats.totaalLessen,       icon: 'calendar_today' },
          { label: 'Cursussen',    value: stats.totaalCursussen,    icon: 'menu_book'      },
        ].map(s => (
          <div key={s.label} className="bg-surface-container rounded-2xl p-4 border border-white/5">
            <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">{s.icon}</span>
            <p className="font-headline font-black text-3xl text-on-surface mt-1">{s.value}</p>
            <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs — altijd 4 buttons in DOM (voorkomt SSR/client hydration mismatch) */}
      <div className="flex gap-1 bg-surface-container rounded-2xl p-1 border border-white/5" role="tablist">
        {([
          { id: 'lessen',  label: 'Lessen',    icon: 'calendar_today', eigenaarOnly: false },
          { id: 'leden',   label: 'Cursisten', icon: 'group',          eigenaarOnly: false },
          { id: 'vloot',   label: 'Vloot',     icon: 'sailing',        eigenaarOnly: true  },
          { id: 'verhuur', label: 'Verhuur',   icon: 'key',            eigenaarOnly: true  },
        ] as { id: Tab; label: string; icon: string; eigenaarOnly: boolean }[]).map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            hidden={mounted && tab.eigenaarOnly && !isEigenaar}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-label text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-primary/15 text-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'lessen' && (
        <LessenTab
          courses={courses}
          recenteLessen={recenteLessen}
          schoolId={schoolId}
          openCourse={openCourse}
          setOpenCourse={setOpenCourse}
          isEigenaar={isEigenaar}
          onNieuweCursus={() => setShowNieuweCursus(true)}
        />
      )}

      {activeTab === 'leden' && (
        <LedenTab schoolId={schoolId} myUserId={myUserId} toast={toast} />
      )}

      {activeTab === 'vloot' && isEigenaar && (
        <VlootTab schoolId={schoolId} toast={toast} />
      )}

      {activeTab === 'verhuur' && isEigenaar && (
        <VerhuurTab schoolId={schoolId} toast={toast} />
      )}

      {showNieuweCursus && (
        <NieuweCursusModal schoolId={schoolId} onClose={() => setShowNieuweCursus(false)} />
      )}
    </div>
  )
}

// ─── LESSEN TAB ───────────────────────────────────────────────────────────────

function LessenTab({
  courses, recenteLessen, schoolId, openCourse, setOpenCourse, isEigenaar, onNieuweCursus
}: {
  courses: SchoolDashboardData['courses']
  recenteLessen: SchoolDashboardData['recenteLessen']
  schoolId: string
  openCourse: string | null
  setOpenCourse: (id: string | null) => void
  isEigenaar: boolean
  onNieuweCursus: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-bold text-lg text-on-surface">Cursussen</h2>
        {isEigenaar && (
          <button
            onClick={onNieuweCursus}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
            Cursus
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-8 border border-white/5 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant" aria-hidden="true">menu_book</span>
          <p className="font-body text-on-surface-variant mt-2">Nog geen cursussen aangemaakt.</p>
          {isEigenaar && (
            <button onClick={onNieuweCursus} className="mt-4 font-label text-sm text-primary hover:underline">
              Maak eerste cursus aan
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id} className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center gap-3 p-4 hover:bg-surface-container-high transition-colors">
                <button
                  onClick={() => setOpenCourse(openCourse === course.id ? null : course.id)}
                  className="flex-1 min-w-0 text-left"
                  aria-expanded={openCourse === course.id}
                >
                  <p className="font-headline font-semibold text-on-surface">{course.name}</p>
                  <p className="font-label text-xs text-on-surface-variant mt-0.5 uppercase tracking-wider">
                    {course.cwoLevel?.replace('_', ' ').toUpperCase()} · {course.aantalCursisten} cursisten · {course.aantalLessen} lessen
                  </p>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <NieuweLesButton courseId={course.id} schoolId={schoolId} />
                  <button
                    onClick={() => setOpenCourse(openCourse === course.id ? null : course.id)}
                    className="p-1 -mr-1"
                    aria-label={openCourse === course.id ? 'Inklappen' : 'Uitklappen'}
                  >
                    <span
                      className="material-symbols-outlined text-on-surface-variant transition-transform duration-200"
                      style={{ transform: openCourse === course.id ? 'rotate(180deg)' : 'none' }}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </button>
                </div>
              </div>
              {openCourse === course.id && (
                <LessenLijst courseId={course.id} schoolId={schoolId} />
              )}
            </div>
          ))}
        </div>
      )}

      {recenteLessen.length > 0 && (
        <div>
          <h2 className="font-headline font-bold text-lg text-on-surface mb-3">Recente lessen</h2>
          <div className="space-y-2">
            {recenteLessen.map(les => (
              <Link
                key={les.id}
                href={`/school/${schoolId}/les/${les.id}`}
                className="flex items-center gap-3 p-3 bg-surface-container rounded-xl border border-white/5 hover:bg-surface-container-high transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">sailing</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label text-sm font-semibold text-on-surface">
                    {format(parseISO(les.datum), 'd MMMM yyyy', { locale: nl })}
                  </p>
                  <p className="font-label text-xs text-on-surface-variant truncate">
                    {les.cursusNaam}
                    {les.windRichting && les.windKracht != null ? ` · ${les.windRichting} ${les.windKracht} Bft` : ''}
                    {les.instructeurNaam ? ` · ${les.instructeurNaam}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 text-on-surface-variant">
                  <span className="font-label text-xs">{les.aantalCursisten}</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">person</span>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── LESSEN LIJST ─────────────────────────────────────────────────────────────

function LessenLijst({ courseId, schoolId }: { courseId: string; schoolId: string }) {
  const [lessen, setLessen] = useState<null | {
    id: string; datum: string; windRichting: string | null; windKracht: number | null;
    aantalCursisten: number; instructeurNaam: string | null
  }[]>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/school/${schoolId}/lessen?courseId=${courseId}`)
      .then(r => r.json())
      .then(d => { setLessen(d.lessen ?? []); setLoading(false) })
      .catch(() => { setLessen([]); setLoading(false) })
  }, [courseId, schoolId])

  if (loading) {
    return (
      <div className="px-4 pb-4 space-y-2 border-t border-white/5">
        {[1, 2].map(i => <div key={i} className="h-12 bg-surface-container-high rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (!lessen || lessen.length === 0) {
    return (
      <p className="px-4 pb-4 font-body text-sm text-on-surface-variant border-t border-white/5 pt-3">
        Nog geen lessen voor deze cursus.
      </p>
    )
  }

  return (
    <div className="px-4 pb-4 space-y-1 border-t border-white/5 pt-2">
      {lessen.map(les => (
        <Link
          key={les.id}
          href={`/school/${schoolId}/les/${les.id}`}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors"
        >
          <div className="flex-1">
            <p className="font-label text-sm font-semibold text-on-surface">
              {format(parseISO(les.datum), 'd MMM yyyy', { locale: nl })}
            </p>
            {les.windRichting && les.windKracht != null && (
              <p className="font-label text-xs text-on-surface-variant">{les.windRichting} {les.windKracht} Bft</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="font-label text-xs">{les.aantalCursisten}</span>
            <span className="material-symbols-outlined text-sm" aria-hidden="true">person</span>
            <span className="material-symbols-outlined text-sm" aria-hidden="true">chevron_right</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── VLOOT TAB ────────────────────────────────────────────────────────────────

type Boot = { id: string; bootNummer: string; bootType: string | null; naam: string | null }

function VlootTab({ schoolId, toast }: { schoolId: string; toast: (msg: string, type?: 'success' | 'error') => void }) {
  const [vloot, setVloot]       = useState<Boot[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBoot, setEditBoot] = useState<Boot | null>(null)

  useEffect(() => {
    fetch(`/api/school/${schoolId}/vloot`)
      .then(r => r.json())
      .then(d => { setVloot(d.vloot ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [schoolId])

  async function deleteBoot(bootId: string) {
    if (!confirm('Boot verwijderen?')) return
    const res = await fetch(`/api/school/${schoolId}/vloot/${bootId}`, { method: 'DELETE' })
    if (res.ok) {
      setVloot(prev => prev.filter(b => b.id !== bootId))
      toast('Boot verwijderd')
    } else {
      toast('Verwijderen mislukt', 'error')
    }
  }

  function onSaved(boot: Boot, isEdit: boolean) {
    if (isEdit) {
      setVloot(prev => prev.map(b => b.id === boot.id ? boot : b))
    } else {
      setVloot(prev => [...prev, boot])
    }
    toast(isEdit ? 'Boot bijgewerkt' : 'Boot toegevoegd')
    setShowForm(false)
    setEditBoot(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-bold text-lg text-on-surface">Schoolvloot</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
          Boot
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />)}
        </div>
      ) : vloot.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-8 border border-white/5 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant" aria-hidden="true">sailing</span>
          <p className="font-body text-on-surface-variant mt-2">Nog geen boten toegevoegd.</p>
          <p className="font-body text-xs text-on-surface-variant/60 mt-1">
            Voeg de boten van je school toe zodat instructeurs het bootnummer kunnen registreren per les.
          </p>
          <button onClick={() => setShowForm(true)} className="mt-4 font-label text-sm text-primary hover:underline">
            Eerste boot toevoegen
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {vloot.map(boot => (
            <div
              key={boot.id}
              className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-white/5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">sailing</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label text-sm font-semibold text-on-surface">
                  Boot {boot.bootNummer}
                  {boot.naam ? ` — ${boot.naam}` : ''}
                </p>
                {boot.bootType && (
                  <p className="font-label text-xs text-on-surface-variant">
                    {BOAT_LABELS[boot.bootType as keyof typeof BOAT_LABELS] ?? boot.bootType}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => { setEditBoot(boot); setShowForm(true) }}
                  aria-label={`Boot ${boot.bootNummer} bewerken`}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">edit</span>
                </button>
                <button
                  onClick={() => deleteBoot(boot.id)}
                  aria-label={`Boot ${boot.bootNummer} verwijderen`}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <BootFormModal
          schoolId={schoolId}
          boot={editBoot}
          onClose={() => { setShowForm(false); setEditBoot(null) }}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

// ─── BOOT FORM MODAL ──────────────────────────────────────────────────────────

function BootFormModal({
  schoolId, boot, onClose, onSaved
}: {
  schoolId: string
  boot: Boot | null
  onClose: () => void
  onSaved: (boot: Boot, isEdit: boolean) => void
}) {
  const [nummer, setNummer] = useState(boot?.bootNummer ?? '')
  const [naam, setNaam]     = useState(boot?.naam ?? '')
  const [type, setType]     = useState(boot?.bootType ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const BOOT_TYPE_OPTIONS = [
    { value: '',          label: '— type niet opgegeven —' },
    { value: 'valk',      label: 'Valk' },
    { value: 'polyvalk',  label: 'Polyvalk' },
    { value: 'laser',     label: 'Laser / ILCA' },
    { value: 'laser_pico',label: 'Laser Pico' },
    { value: 'rs_feva',   label: 'RS Feva' },
    { value: 'kajuitjacht',label: 'Kajuitjacht' },
    { value: 'catamaran', label: 'Catamaran' },
    { value: 'anders',    label: 'Anders' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const url    = boot ? `/api/school/${schoolId}/vloot/${boot.id}` : `/api/school/${schoolId}/vloot`
    const method = boot ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bootNummer: nummer, bootType: type || undefined, naam: naam || undefined }),
    })
    if (res.ok) {
      const d = await res.json()
      onSaved(d.boot, !!boot)
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij opslaan')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label={boot ? 'Boot bewerken' : 'Boot toevoegen'}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface-container rounded-3xl border border-white/10 p-6 space-y-4 shadow-deep"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg text-on-surface">
            {boot ? 'Boot bewerken' : 'Boot toevoegen'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="p-2 rounded-xl hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="boot-nummer">
            Bootnummer *
          </label>
          <input
            id="boot-nummer" type="text" value={nummer} onChange={e => setNummer(e.target.value)}
            required autoFocus placeholder="1, 2, Valk-3…"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          />
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="boot-type">
            Boottype
          </label>
          <select
            id="boot-type" value={type} onChange={e => setType(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          >
            {BOOT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="boot-naam">
            Naam (optioneel)
          </label>
          <input
            id="boot-naam" type="text" value={naam} onChange={e => setNaam(e.target.value)}
            placeholder="bijv. Zeehond, Dolfijn…" maxLength={100}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          />
        </div>

        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl gradient-primary font-label font-semibold text-on-primary disabled:opacity-50 shadow-glow"
        >
          {saving ? 'Opslaan…' : boot ? 'Opslaan' : 'Boot toevoegen'}
        </button>
      </form>
    </div>
  )
}

// ─── LEDEN TAB ────────────────────────────────────────────────────────────────

type Lid = { userId: string; naam: string | null; email: string; image: string | null; role: string; joinedAt: string | null }
type Invite = { id: string; token: string; role: string; label: string | null; usedCount: number; maxUses: number | null; expiresAt: string | null }

function LedenTab({ schoolId, myUserId, toast }: { schoolId: string; myUserId: string; toast: (msg: string, type?: 'success' | 'error') => void }) {
  const [leden, setLeden]       = useState<Lid[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [addRole, setAddRole]   = useState<'cursist' | 'instructeur'>('cursist')
  const [addEmail, setAddEmail] = useState('')
  const [addError, setAddError] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  // Uitnodigingen
  const [invites, setInvites]         = useState<Invite[]>([])
  const [showInvite, setShowInvite]   = useState(false)
  const [inviteRole, setInviteRole]   = useState<'cursist' | 'instructeur'>('cursist')
  const [inviteLabel, setInviteLabel] = useState('')
  const [inviteSaving, setInviteSaving] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/school/${schoolId}/leden`)
      .then(r => r.json())
      .then(d => { setLeden(d.leden ?? []); setLoading(false) })
      .catch(() => setLoading(false))
    fetch(`/api/school/${schoolId}/invite`)
      .then(r => r.json())
      .then(d => setInvites(d.invites ?? []))
      .catch(() => {})
  }, [schoolId])

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault(); setInviteSaving(true)
    const res = await fetch(`/api/school/${schoolId}/invite`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: inviteRole, label: inviteLabel || undefined }),
    })
    if (res.ok) {
      const d = await res.json()
      setInvites(prev => [...prev, d.invite])
      setInviteLabel(''); setShowInvite(false)
      toast('Uitnodigingslink aangemaakt')
    } else {
      toast('Aanmaken mislukt', 'error')
    }
    setInviteSaving(false)
  }

  async function handleDeleteInvite(token: string) {
    const res = await fetch(`/api/school/${schoolId}/invite?token=${token}`, { method: 'DELETE' })
    if (res.ok) {
      setInvites(prev => prev.filter(i => i.token !== token))
      toast('Link verwijderd')
    } else {
      toast('Verwijderen mislukt', 'error')
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/school/join/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setAddSaving(true); setAddError('')
    const res = await fetch(`/api/school/${schoolId}/leden`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail, role: addRole }),
    })
    if (res.ok) {
      const d = await res.json()
      setLeden(prev => [...prev, { ...d.lid, joinedAt: new Date().toISOString() }])
      setAddEmail(''); setShowAdd(false)
      toast('Lid toegevoegd')
    } else {
      const d = await res.json()
      setAddError(typeof d.error === 'string' ? d.error : 'Fout bij toevoegen')
    }
    setAddSaving(false)
  }

  async function handleRemove(userId: string) {
    if (!confirm('Lid verwijderen uit school?')) return
    const res = await fetch(`/api/school/${schoolId}/leden?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setLeden(prev => prev.filter(l => l.userId !== userId))
      toast('Lid verwijderd')
    } else {
      toast('Verwijderen mislukt', 'error')
    }
  }

  const cursisten    = leden.filter(l => l.role === 'cursist')
  const instructeurs = leden.filter(l => l.role === 'instructeur' || l.role === 'eigenaar')

  const ROLE_LABELS: Record<string, string> = { eigenaar: 'Eigenaar', instructeur: 'Instructeur', cursist: 'Cursist' }
  const ROLE_ICON:   Record<string, string> = { eigenaar: 'star', instructeur: 'person_check', cursist: 'school' }

  function LidRow({ lid }: { lid: Lid }) {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex-shrink-0 overflow-hidden flex items-center justify-center">
          {lid.image
            ? <img src={lid.image} alt="" className="w-full h-full object-cover" />
            : <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">person</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label text-sm font-semibold text-on-surface truncate">{lid.naam ?? lid.email}</p>
          <p className="font-label text-xs text-on-surface-variant truncate">{lid.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={[
            'flex items-center gap-1 px-2 py-1 rounded-lg font-label text-[11px] font-semibold',
            lid.role === 'eigenaar'    ? 'bg-amber-400/15 text-amber-300'  :
            lid.role === 'instructeur' ? 'bg-primary/15 text-primary'      :
                                         'bg-white/8 text-on-surface-variant',
          ].join(' ')}>
            <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{ROLE_ICON[lid.role] ?? 'person'}</span>
            {ROLE_LABELS[lid.role] ?? lid.role}
          </span>
          {lid.role === 'cursist' && (
            <a
              href={`/school/${schoolId}/cursist/${lid.userId}/vorderingen`}
              aria-label={`Vorderingenstaat van ${lid.naam ?? lid.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">description</span>
            </a>
          )}
          {lid.userId !== myUserId && lid.role !== 'eigenaar' && (
            <button
              onClick={() => handleRemove(lid.userId)}
              aria-label={`${lid.naam ?? lid.email} verwijderen`}
              className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">person_remove</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-bold text-lg text-on-surface">Leden</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInvite(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container border border-white/10 font-label text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:border-primary/30 transition-colors"
            aria-label="Uitnodigingslink genereren"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">link</span>
            Uitnodigen
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">person_add</span>
            Toevoegen
          </button>
        </div>
      </div>

      {/* Uitnodigingslink aanmaken */}
      {showInvite && (
        <form onSubmit={handleCreateInvite} className="bg-surface-container-high rounded-2xl p-4 border border-primary/20 space-y-3">
          <p className="font-label text-sm font-semibold text-on-surface">Nieuwe uitnodigingslink</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteLabel}
              onChange={e => setInviteLabel(e.target.value)}
              placeholder="Omschrijving bijv. Kielboot II 2026"
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as 'cursist' | 'instructeur')}
              className="px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            >
              <option value="cursist">Cursist</option>
              <option value="instructeur">Instructeur</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit" disabled={inviteSaving}
              className="flex-1 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary disabled:opacity-50 shadow-glow"
            >
              {inviteSaving ? 'Aanmaken…' : 'Link aanmaken'}
            </button>
            <button
              type="button" onClick={() => setShowInvite(false)}
              className="px-4 py-2.5 rounded-xl bg-surface-container font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      {/* Actieve uitnodigingslinks */}
      {invites.length > 0 && (
        <div className="bg-surface-container rounded-2xl border border-white/5 px-4 py-2 space-y-0">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider py-2">
            Uitnodigingslinks ({invites.length})
          </p>
          {invites.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 py-2.5 border-t border-white/5">
              <div className="flex-1 min-w-0">
                <p className="font-label text-sm text-on-surface truncate">
                  {inv.label || (inv.role === 'cursist' ? 'Cursist uitnodiging' : 'Instructeur uitnodiging')}
                </p>
                <p className="font-label text-[11px] text-on-surface-variant/60 font-mono mt-0.5">
                  /school/join/{inv.token}
                  {inv.maxUses !== null ? ` · ${inv.usedCount}/${inv.maxUses} gebruikt` : ` · ${inv.usedCount}× gebruikt`}
                </p>
              </div>
              <span className={[
                'px-2 py-0.5 rounded-lg font-label text-[11px] font-semibold flex-shrink-0',
                inv.role === 'cursist' ? 'bg-white/8 text-on-surface-variant' : 'bg-primary/15 text-primary',
              ].join(' ')}>
                {inv.role === 'cursist' ? 'Cursist' : 'Instructeur'}
              </span>
              <button
                onClick={() => copyInviteLink(inv.token)}
                className="p-2 rounded-xl bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
                aria-label="Link kopiëren"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  {copiedToken === inv.token ? 'check' : 'content_copy'}
                </span>
              </button>
              <button
                onClick={() => handleDeleteInvite(inv.token)}
                className="p-2 rounded-xl text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
                aria-label="Link verwijderen"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toevoegen form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-surface-container-high rounded-2xl p-4 border border-primary/20 space-y-3">
          <p className="font-label text-sm font-semibold text-on-surface">Lid toevoegen op e-mailadres</p>
          <div className="flex gap-2">
            <input
              type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
              required placeholder="naam@voorbeeld.nl"
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            />
            <select
              value={addRole}
              onChange={e => setAddRole(e.target.value as 'cursist' | 'instructeur')}
              className="px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            >
              <option value="cursist">Cursist</option>
              <option value="instructeur">Instructeur</option>
            </select>
          </div>
          {addError && <p className="font-body text-sm text-error" role="alert">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="submit" disabled={addSaving}
              className="flex-1 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary disabled:opacity-50 shadow-glow"
            >
              {addSaving ? 'Toevoegen…' : 'Toevoegen'}
            </button>
            <button
              type="button" onClick={() => { setShowAdd(false); setAddError('') }}
              className="px-4 py-2.5 rounded-xl bg-surface-container font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container rounded-xl animate-pulse"/>)}</div>
      ) : (
        <div className="space-y-4">
          {instructeurs.length > 0 && (
            <div className="bg-surface-container rounded-2xl border border-white/5 px-4">
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider pt-3 pb-1">
                Instructeurs ({instructeurs.length})
              </p>
              {instructeurs.map(lid => <LidRow key={lid.userId} lid={lid} />)}
            </div>
          )}
          {cursisten.length > 0 && (
            <div className="bg-surface-container rounded-2xl border border-white/5 px-4">
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider pt-3 pb-1">
                Cursisten ({cursisten.length})
              </p>
              {cursisten.map(lid => <LidRow key={lid.userId} lid={lid} />)}
            </div>
          )}
          {leden.length === 0 && (
            <div className="bg-surface-container rounded-2xl p-8 border border-white/5 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant" aria-hidden="true">group</span>
              <p className="font-body text-on-surface-variant mt-2">Nog geen leden toegevoegd.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── NIEUWE LES BUTTON ────────────────────────────────────────────────────────

function NieuweLesButton({ courseId, schoolId }: { courseId: string; schoolId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-label text-xs font-semibold hover:bg-primary/20 transition-colors"
        aria-label="Nieuwe les aanmaken"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
        Les
      </button>
      {open && <NieuweLesModal courseId={courseId} schoolId={schoolId} onClose={() => setOpen(false)} />}
    </>
  )
}

// ─── NIEUWE LES MODAL ────────────────────────────────────────────────────────

function NieuweLesModal({ courseId, schoolId, onClose }: {
  courseId: string; schoolId: string; onClose: () => void
}) {
  const [datum, setDatum]           = useState(new Date().toISOString().slice(0, 10))
  const [windRichting, setWindR]    = useState('')
  const [windKracht, setWindK]      = useState('')
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [leden, setLeden]           = useState<{ userId: string; naam: string | null }[]>([])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    fetch(`/api/school/${schoolId}/leden`)
      .then(r => r.json())
      .then(d => setLeden((d.leden ?? []).filter((l: { role: string }) => l.role === 'cursist')))
      .catch(() => {})
  }, [schoolId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (studentIds.length === 0) { setError('Selecteer minimaal 1 cursist'); return }
    setSaving(true); setError('')
    const res = await fetch(`/api/school/${schoolId}/lessen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        datum,
        windRichting: windRichting || undefined,
        windKracht:   windKracht ? Number(windKracht) : undefined,
        studentIds,
      }),
    })
    if (res.ok) {
      const { les } = await res.json()
      window.location.href = `/school/${schoolId}/les/${les.id}`
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij aanmaken')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Nieuwe les aanmaken"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface-container rounded-3xl border border-white/10 p-6 space-y-4 shadow-deep"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg text-on-surface">Nieuwe les</h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="p-2 rounded-xl hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="les-datum">Datum</label>
          <input
            id="les-datum" type="date" value={datum} onChange={e => setDatum(e.target.value)} required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="les-wind-r">Windrichting</label>
            <input
              id="les-wind-r" type="text" value={windRichting} onChange={e => setWindR(e.target.value.toUpperCase())}
              placeholder="ZW" maxLength={5}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="les-wind-k">Windkracht (Bft)</label>
            <input
              id="les-wind-k" type="number" value={windKracht} onChange={e => setWindK(e.target.value)}
              placeholder="3" min={0} max={12}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
            Cursisten ({studentIds.length} geselecteerd)
          </label>
          <div className="mt-2 max-h-44 overflow-y-auto space-y-0.5 rounded-xl bg-surface border border-white/10 p-1">
            {leden.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant p-3">
                Geen cursisten gevonden. Voeg cursisten toe via het Leden-tabblad.
              </p>
            ) : (
              leden.map(lid => (
                <label key={lid.userId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container-high cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentIds.includes(lid.userId)}
                    onChange={e => setStudentIds(prev =>
                      e.target.checked ? [...prev, lid.userId] : prev.filter(id => id !== lid.userId)
                    )}
                    className="w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <span className="font-body text-sm text-on-surface">{lid.naam ?? lid.userId}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl gradient-primary font-label font-semibold text-on-primary disabled:opacity-50 shadow-glow"
        >
          {saving ? 'Aanmaken…' : 'Les aanmaken & openen'}
        </button>
      </form>
    </div>
  )
}

// ─── VERHUUR TAB ──────────────────────────────────────────────────────────────

type BoekingDashboard = {
  id: string; bootId: string; bootNummer: string; bootNaam: string | null
  datum: string; startTijd: string; eindTijd: string
  opmerking: string | null; reactie: string | null
  status: 'aangevraagd' | 'goedgekeurd' | 'afgewezen' | 'geannuleerd'
  isMine: boolean
  aanvrager?: { id: string; name: string | null; email: string }
}

const BD_STATUS = {
  aangevraagd: { label: 'Aangevraagd', cls: 'bg-amber-400/15 text-amber-300',       icon: 'hourglass_empty' },
  goedgekeurd: { label: 'Goedgekeurd', cls: 'bg-green-400/15 text-green-300',       icon: 'check_circle'    },
  afgewezen:   { label: 'Afgewezen',   cls: 'bg-red-400/15 text-red-300',           icon: 'cancel'          },
  geannuleerd: { label: 'Geannuleerd', cls: 'bg-white/8 text-on-surface-variant',   icon: 'block'           },
}

function VerhuurTab({ schoolId, toast }: { schoolId: string; toast: (msg: string, type?: 'success' | 'error') => void }) {
  const [boekingen, setBoekingen] = useState<BoekingDashboard[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'aangevraagd' | 'alle'>('aangevraagd')

  async function laad() {
    setLoading(true)
    const res = await fetch(`/api/school/${schoolId}/verhuur`)
    if (res.ok) setBoekingen(await res.json())
    setLoading(false)
  }

  useEffect(() => { laad() }, [schoolId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function update(id: string, status: BoekingDashboard['status'], reactie?: string) {
    const res = await fetch(`/api/school/${schoolId}/verhuur/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reactie }),
    })
    if (res.ok) {
      toast(status === 'goedgekeurd' ? 'Aanvraag goedgekeurd' : 'Aanvraag afgewezen')
    } else {
      toast('Bijwerken mislukt', 'error')
    }
    laad()
  }

  const zichtbaar = filter === 'aangevraagd'
    ? boekingen.filter(b => b.status === 'aangevraagd')
    : boekingen

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-bold text-lg text-on-surface">Bootverhuur</h2>
        <div className="flex items-center gap-2">
          <a
            href={`/school/${schoolId}/verhuur`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container border border-white/10 font-label text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">open_in_new</span>
            Kalender
          </a>
          <button
            onClick={() => setFilter(f => f === 'aangevraagd' ? 'alle' : 'aangevraagd')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container border border-white/10 font-label text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {filter === 'aangevraagd' ? 'Toon alles' : 'Alleen open'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 bg-surface-container rounded-2xl animate-pulse" />)}
        </div>
      ) : zichtbaar.length === 0 ? (
        <div className="bg-surface-container rounded-2xl border border-white/5 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30" aria-hidden="true">key</span>
          <p className="font-body text-sm text-on-surface-variant mt-2">
            {filter === 'aangevraagd' ? 'Geen openstaande aanvragen.' : 'Geen boekingen gevonden.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {zichtbaar.map(b => {
            const si = BD_STATUS[b.status]
            return (
              <div key={b.id} className="bg-surface-container rounded-2xl border border-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label font-semibold text-sm text-on-surface">
                        Boot #{b.bootNummer}{b.bootNaam ? ` — ${b.bootNaam}` : ''}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${si.cls}`}>
                        <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{si.icon}</span>
                        {si.label}
                      </span>
                    </div>
                    <p className="font-label text-xs text-on-surface-variant">
                      {b.datum} · {b.startTijd}–{b.eindTijd}
                    </p>
                    {b.aanvrager && (
                      <p className="font-label text-xs text-on-surface-variant">
                        {b.aanvrager.name ?? b.aanvrager.email}
                      </p>
                    )}
                    {b.opmerking && (
                      <p className="font-body text-xs text-on-surface-variant italic">"{b.opmerking}"</p>
                    )}
                    {b.reactie && (
                      <p className="font-body text-xs text-primary">↳ {b.reactie}</p>
                    )}
                  </div>

                  {b.status === 'aangevraagd' && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => update(b.id, 'goedgekeurd')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-400/15 text-green-300 font-label text-xs font-semibold hover:bg-green-400/25 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">check</span>
                        Goedkeuren
                      </button>
                      <button
                        onClick={() => update(b.id, 'afgewezen')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-400/15 text-red-300 font-label text-xs font-semibold hover:bg-red-400/25 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
                        Afwijzen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── NIEUWE CURSUS MODAL ──────────────────────────────────────────────────────

function NieuweCursusModal({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const [name, setName]       = useState('')
  const [cwoLevel, setCwo]    = useState('cwo_kielboot2')
  const [startDate, setStart] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const CWO_OPTIONS = [
    { value: 'cwo_kielboot1', label: 'CWO Kielboot I'  },
    { value: 'cwo_kielboot2', label: 'CWO Kielboot II' },
    { value: 'cwo_kielboot3', label: 'CWO Kielboot III'},
    { value: 'cwo1',          label: 'CWO 1' },
    { value: 'cwo2',          label: 'CWO 2' },
    { value: 'cwo3',          label: 'CWO 3' },
    { value: 'cwo4',          label: 'CWO 4' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch(`/api/school/${schoolId}/cursussen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cwoLevel, startDate: startDate || undefined }),
    })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij aanmaken')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Nieuwe cursus aanmaken"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface-container rounded-3xl border border-white/10 p-6 space-y-4 shadow-deep"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg text-on-surface">Nieuwe cursus</h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="p-2 rounded-xl hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="cursus-naam">Naam</label>
          <input
            id="cursus-naam" type="text" value={name} onChange={e => setName(e.target.value)}
            required autoFocus placeholder="Kielboot II Praktijk 2026"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          />
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="cursus-cwo">CWO Niveau</label>
          <select
            id="cursus-cwo" value={cwoLevel} onChange={e => setCwo(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          >
            {CWO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="cursus-start">Startdatum (optioneel)</label>
          <input
            id="cursus-start" type="date" value={startDate} onChange={e => setStart(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          />
        </div>

        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl gradient-primary font-label font-semibold text-on-primary disabled:opacity-50 shadow-glow"
        >
          {saving ? 'Aanmaken…' : 'Cursus aanmaken'}
        </button>
      </form>
    </div>
  )
}
