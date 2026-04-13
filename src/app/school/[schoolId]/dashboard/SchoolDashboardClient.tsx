'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { SchoolDashboardData } from '@/lib/db/queries/school'
import { BOAT_LABELS } from '@/types'
import { AnimatePresence } from 'framer-motion'
import { DashboardTour } from '@/components/onboarding/DashboardTour'
import { useDashboardTour } from '@/hooks/useDashboardTour'

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

type Tab = 'lessen' | 'cursisten' | 'berichten' | 'vloot' | 'leden' | 'verhuur' | 'meldingen' | 'instellingen'
type CourseRow = SchoolDashboardData['courses'][number]

export function SchoolDashboardClient({ dashboard, schoolId, myUserId, myRole }: Props) {
  const { school, stats, courses, recenteLessen } = dashboard
  const isEigenaar = myRole === 'eigenaar'

  const [activeTab, setActiveTab]         = useState<Tab>('lessen')
  const [openCourse, setOpenCourse]       = useState<string | null>(courses[0]?.id ?? null)
  const [showNieuweCursus, setShowNieuweCursus] = useState(false)
  const [editCursus, setEditCursus]             = useState<CourseRow | null>(null)
  const [mounted, setMounted]             = useState(false)
  const { toasts, toast } = useToast()
  const { show: showTour, dismiss: dismissTour } = useDashboardTour('school')

  useEffect(() => setMounted(true), [])

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      {/* Welkomstour — eenmalig bij eerste bezoek */}
      {mounted && (
        <AnimatePresence>
          {showTour && (
            <DashboardTour
              role={isEigenaar ? 'eigenaar' : 'instructeur'}
              onDismiss={dismissTour}
              onSetTab={tab => setActiveTab(tab as Tab)}
            />
          )}
        </AnimatePresence>
      )}

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

      {/* Stats — instructeur ziet 3 relevante cijfers, eigenaar alle 4 */}
      {isEigenaar ? (
        <div data-tour="stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
      ) : (
        <div data-tour="stats" className="grid grid-cols-3 gap-3">
          {[
            { label: 'Cursisten',  value: stats.totaalCursisten,  icon: 'school'         },
            { label: 'Lessen',     value: stats.totaalLessen,     icon: 'calendar_today' },
            { label: 'Cursussen',  value: stats.totaalCursussen,  icon: 'menu_book'      },
          ].map(s => (
            <div key={s.label} className="bg-surface-container rounded-2xl p-4 border border-white/5">
              <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">{s.icon}</span>
              <p className="font-headline font-black text-3xl text-on-surface mt-1">{s.value}</p>
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div data-tour="tabs" className="flex gap-1 bg-surface-container rounded-2xl p-1 border border-white/5" role="tablist">
        {(isEigenaar ? ([
          { id: 'lessen',       label: 'Lessen',       icon: 'calendar_today' },
          { id: 'leden',        label: 'Team',         icon: 'group'          },
          { id: 'berichten',    label: 'Berichten',    icon: 'forum'          },
          { id: 'vloot',        label: 'Vloot',        icon: 'sailing'        },
          { id: 'verhuur',      label: 'Verhuur',      icon: 'key'            },
          { id: 'meldingen',    label: 'Meldingen',    icon: 'report'         },
          { id: 'instellingen', label: 'Instellingen', icon: 'settings'       },
        ] as { id: Tab; label: string; icon: string }[]) : ([
          { id: 'lessen',    label: 'Lessen',    icon: 'calendar_today' },
          { id: 'cursisten', label: 'Cursisten', icon: 'school'         },
          { id: 'berichten', label: 'Berichten', icon: 'forum'          },
        ] as { id: Tab; label: string; icon: string }[])).map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
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
          onEditCursus={setEditCursus}
        />
      )}

      {activeTab === 'cursisten' && (
        <CursistenTab schoolId={schoolId} />
      )}

      {activeTab === 'berichten' && (
        <BerichtenTab schoolId={schoolId} myUserId={myUserId} />
      )}

      {activeTab === 'leden' && isEigenaar && (
        <LedenTab schoolId={schoolId} myUserId={myUserId} toast={toast} />
      )}

      {activeTab === 'vloot' && isEigenaar && (
        <VlootTab schoolId={schoolId} toast={toast} />
      )}

      {activeTab === 'verhuur' && isEigenaar && (
        <VerhuurTab schoolId={schoolId} toast={toast} />
      )}

      {activeTab === 'meldingen' && isEigenaar && (
        <MeldingenTab schoolId={schoolId} toast={toast} />
      )}

      {activeTab === 'instellingen' && isEigenaar && (
        <InstellingenTab schoolId={schoolId} school={school} toast={toast} />
      )}

      {showNieuweCursus && (
        <CursusFormModal schoolId={schoolId} onClose={() => setShowNieuweCursus(false)} />
      )}

      {editCursus && (
        <CursusFormModal
          schoolId={schoolId}
          cursus={editCursus}
          onClose={() => setEditCursus(null)}
        />
      )}
    </div>
  )
}

// ─── LESSEN TAB ───────────────────────────────────────────────────────────────

function LessenTab({
  courses: initialCourses, recenteLessen, schoolId, openCourse, setOpenCourse, isEigenaar, onNieuweCursus, onEditCursus
}: {
  courses: SchoolDashboardData['courses']
  recenteLessen: SchoolDashboardData['recenteLessen']
  schoolId: string
  openCourse: string | null
  setOpenCourse: (id: string | null) => void
  isEigenaar: boolean
  onNieuweCursus: () => void
  onEditCursus: (cursus: CourseRow) => void
}) {
  const [courses, setCourses] = useState(initialCourses)

  async function deleteCursus(cursusId: string, cursusNaam: string) {
    if (!confirm(`Cursus "${cursusNaam}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    const res = await fetch(`/api/school/${schoolId}/cursussen/${cursusId}`, { method: 'DELETE' })
    if (res.ok) {
      setCourses(prev => prev.filter(c => c.id !== cursusId))
    }
  }
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  <NieuweLesButton courseId={course.id} schoolId={schoolId} />
                  {isEigenaar && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); onEditCursus(course) }}
                        aria-label={`Cursus ${course.name} bewerken`}
                        className="p-1.5 rounded-xl text-on-surface-variant/50 hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base" aria-hidden="true">edit</span>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteCursus(course.id, course.name) }}
                        aria-label={`Cursus ${course.name} verwijderen`}
                        className="p-1.5 rounded-xl text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                      </button>
                    </>
                  )}
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
  const [vloot, setVloot]                   = useState<Boot[]>([])
  const [loading, setLoading]               = useState(true)
  const [showForm, setShowForm]             = useState(false)
  const [editBoot, setEditBoot]             = useState<Boot | null>(null)
  const [beschikbaarheidBoot, setBeschBoot] = useState<Boot | null>(null)

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
                  onClick={() => setBeschBoot(boot)}
                  aria-label={`Beschikbaarheid boot ${boot.bootNummer} beheren`}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">event_busy</span>
                </button>
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

      {beschikbaarheidBoot && (
        <BeschikbaarheidModal
          schoolId={schoolId}
          boot={beschikbaarheidBoot}
          onClose={() => setBeschBoot(null)}
          toast={toast}
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

// ─── BESCHIKBAARHEID MODAL ───────────────────────────────────────────────────

type Periode = { id: string; dateFrom: string; dateTo: string; reden: string | null }

function BeschikbaarheidModal({ schoolId, boot, onClose, toast }: {
  schoolId: string
  boot:     Boot
  onClose:  () => void
  toast:    (msg: string, type?: 'success' | 'error') => void
}) {
  const [periodes, setPeriodes] = useState<Periode[]>([])
  const [loading, setLoading]   = useState(true)
  const [dateFrom, setFrom]     = useState('')
  const [dateTo, setTo]         = useState('')
  const [reden, setReden]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    fetch(`/api/school/${schoolId}/vloot/beschikbaarheid?bootId=${boot.id}`)
      .then(r => r.json())
      .then(d => { setPeriodes(d.periodes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, schoolId, boot.id])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch(`/api/school/${schoolId}/vloot/beschikbaarheid`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bootId: boot.id, dateFrom, dateTo, reden: reden || undefined }),
    })
    if (res.ok) {
      const d = await res.json()
      setPeriodes(prev => [...prev, d.periode].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom)))
      setFrom(''); setTo(''); setReden('')
      toast('Periode toegevoegd')
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij toevoegen')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/school/${schoolId}/vloot/beschikbaarheid?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPeriodes(prev => prev.filter(p => p.id !== id))
      toast('Periode verwijderd')
    } else {
      toast('Verwijderen mislukt', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Beschikbaarheid beheren"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md bg-surface-container rounded-3xl border border-white/10 p-6 space-y-5 shadow-deep"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Boot {boot.bootNummer}{boot.naam ? ` — ${boot.naam}` : ''}
            </h2>
            <p className="font-label text-xs text-on-surface-variant mt-0.5">Niet-beschikbare periodes</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="p-2 rounded-xl hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Bestaande periodes */}
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-surface rounded-xl animate-pulse" />)}</div>
        ) : periodes.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant text-center py-2">
            Geen geblokkeerde periodes.
          </p>
        ) : (
          <div className="space-y-1.5">
            {periodes.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface rounded-xl border border-white/8">
                <span className="material-symbols-outlined text-amber-400 text-base flex-shrink-0" aria-hidden="true">event_busy</span>
                <div className="flex-1 min-w-0">
                  <p className="font-label text-sm text-on-surface">
                    {p.dateFrom} → {p.dateTo}
                  </p>
                  {p.reden && <p className="font-label text-xs text-on-surface-variant truncate">{p.reden}</p>}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  aria-label="Periode verwijderen"
                  className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Nieuwe periode toevoegen */}
        <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-white/8">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Periode toevoegen</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-label text-xs text-on-surface-variant" htmlFor="bsch-from">Van</label>
              <input id="bsch-from" type="date" value={dateFrom} onChange={e => setFrom(e.target.value)} required
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />
            </div>
            <div>
              <label className="font-label text-xs text-on-surface-variant" htmlFor="bsch-to">Tot en met</label>
              <input id="bsch-to" type="date" value={dateTo} onChange={e => setTo(e.target.value)} required
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />
            </div>
          </div>
          <input type="text" value={reden} onChange={e => setReden(e.target.value)}
            placeholder="Reden (bijv. onderhoud, schade…)"
            className="w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />
          {error && <p className="font-body text-xs text-error" role="alert">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary disabled:opacity-50 shadow-glow">
            {saving ? 'Toevoegen…' : 'Periode blokkeren'}
          </button>
        </form>
      </div>
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

// ─── CURSUS FORM MODAL (nieuw + bewerken) ─────────────────────────────────────

const CWO_OPTIONS = [
  { value: 'cwo_kielboot1', label: 'CWO Kielboot I'   },
  { value: 'cwo_kielboot2', label: 'CWO Kielboot II'  },
  { value: 'cwo_kielboot3', label: 'CWO Kielboot III' },
  { value: 'cwo1',          label: 'CWO 1' },
  { value: 'cwo2',          label: 'CWO 2' },
  { value: 'cwo3',          label: 'CWO 3' },
  { value: 'cwo4',          label: 'CWO 4' },
]

function CursusFormModal({
  schoolId, cursus, onClose,
}: {
  schoolId: string
  cursus?: CourseRow
  onClose: () => void
}) {
  const isEdit = !!cursus
  const [name, setName]       = useState(cursus?.name      ?? '')
  type CwoLevel = 'geen' | 'cwo1' | 'cwo2' | 'cwo3' | 'cwo4' | 'cwo_kielboot1' | 'cwo_kielboot2' | 'cwo_kielboot3'
  const [cwoLevel, setCwo]    = useState<CwoLevel>((cursus?.cwoLevel ?? 'cwo_kielboot2') as CwoLevel)
  const [startDate, setStart] = useState(cursus?.startDate ?? '')
  const [endDate, setEnd]     = useState(cursus?.endDate   ?? '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const url    = isEdit
      ? `/api/school/${schoolId}/cursussen/${cursus!.id}`
      : `/api/school/${schoolId}/cursussen`
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        cwoLevel,
        startDate: startDate || undefined,
        endDate:   endDate   || undefined,
      }),
    })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? `Fout bij ${isEdit ? 'opslaan' : 'aanmaken'}`)
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog" aria-modal="true"
      aria-label={isEdit ? 'Cursus bewerken' : 'Nieuwe cursus aanmaken'}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface-container rounded-3xl border border-white/10 p-6 space-y-4 shadow-deep"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg text-on-surface">
            {isEdit ? 'Cursus bewerken' : 'Nieuwe cursus'}
          </h2>
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
            id="cursus-cwo" value={cwoLevel} onChange={e => setCwo(e.target.value as CwoLevel)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          >
            {CWO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="cursus-start">Startdatum</label>
            <input
              id="cursus-start" type="date" value={startDate} onChange={e => setStart(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="cursus-end">Einddatum</label>
            <input
              id="cursus-end" type="date" value={endDate} onChange={e => setEnd(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full py-3 rounded-xl gradient-primary font-label font-semibold text-on-primary disabled:opacity-50 shadow-glow"
        >
          {saving
            ? (isEdit ? 'Opslaan…' : 'Aanmaken…')
            : (isEdit ? 'Opslaan'  : 'Cursus aanmaken')
          }
        </button>
      </form>
    </div>
  )
}

// ─── MELDINGEN TAB ────────────────────────────────────────────────────────────

type Melding = {
  issue:  {
    id: string; titel: string; beschrijving: string | null; status: string
    prioriteit: string | null; internNote: string | null
    createdAt: string; updatedAt: string; resolvedAt: string | null; rentalId: string | null
  }
  boot:   { id: string; bootNummer: string; naam: string | null } | null
  melder: { id: string; name: string | null; email: string } | null
}

const STATUS_FLOW: { value: string; label: string; cls: string; icon: string }[] = [
  { value: 'gemeld',         label: 'Gemeld',         cls: 'bg-red-400/15 text-red-300',      icon: 'report'           },
  { value: 'in_behandeling', label: 'In behandeling', cls: 'bg-amber-400/15 text-amber-300',  icon: 'engineering'      },
  { value: 'besteld',        label: 'Besteld',        cls: 'bg-blue-400/15 text-blue-300',    icon: 'shopping_cart'    },
  { value: 'gerepareerd',    label: 'Gerepareerd',    cls: 'bg-green-400/15 text-green-300',  icon: 'build_circle'     },
  { value: 'gesloten',       label: 'Gesloten',       cls: 'bg-white/8 text-on-surface-variant', icon: 'check_circle' },
]

const PRIO_CLS: Record<string, string> = {
  urgent: 'bg-red-400/20 text-red-300',
  hoog:   'bg-amber-400/15 text-amber-300',
  normaal:'bg-white/8 text-on-surface-variant',
  laag:   'bg-white/5 text-on-surface-variant/60',
}

function MeldingenTab({ schoolId, toast }: { schoolId: string; toast: (msg: string, type?: 'success' | 'error') => void }) {
  const [meldingen, setMeldingen]   = useState<Melding[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilter]   = useState<string>('actief')
  const [openId, setOpenId]         = useState<string | null>(null)
  const [notitie, setNotitie]       = useState<Record<string, string>>({})
  const [showNieuw, setShowNieuw]   = useState(false)

  useEffect(() => {
    fetch(`/api/school/${schoolId}/meldingen`)
      .then(r => r.json())
      .then(d => { setMeldingen(d.meldingen ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [schoolId])

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/school/${schoolId}/meldingen/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    if (res.ok) {
      const d = await res.json()
      setMeldingen(prev => prev.map(m => m.issue.id === id ? { ...m, issue: d.melding } : m))
      toast('Status bijgewerkt')
    } else {
      toast('Bijwerken mislukt', 'error')
    }
  }

  async function saveNotitie(id: string) {
    const res = await fetch(`/api/school/${schoolId}/meldingen/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ internNote: notitie[id] }),
    })
    if (res.ok) {
      const d = await res.json()
      setMeldingen(prev => prev.map(m => m.issue.id === id ? { ...m, issue: d.melding } : m))
      toast('Notitie opgeslagen')
    } else {
      toast('Opslaan mislukt', 'error')
    }
  }

  const actief    = ['gemeld', 'in_behandeling', 'besteld']
  const zichtbaar = filterStatus === 'actief'
    ? meldingen.filter(m => actief.includes(m.issue.status))
    : filterStatus === 'alle'
    ? meldingen
    : meldingen.filter(m => m.issue.status === filterStatus)

  const aantalActief = meldingen.filter(m => actief.includes(m.issue.status)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-headline font-bold text-lg text-on-surface">Meldingen</h2>
          {aantalActief > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-400/15 text-red-300 font-label text-xs font-semibold">
              {aantalActief} open
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-container border border-white/10 text-on-surface font-label text-xs focus:outline-none"
          >
            <option value="actief">Open meldingen</option>
            <option value="alle">Alle</option>
            {STATUS_FLOW.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowNieuw(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary font-label text-xs font-semibold text-on-primary shadow-glow"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
            Melding
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-surface-container rounded-2xl animate-pulse" />)}</div>
      ) : zichtbaar.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-8 border border-white/5 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30" aria-hidden="true">check_circle</span>
          <p className="font-body text-sm text-on-surface-variant mt-2">
            {filterStatus === 'actief' ? 'Geen open meldingen.' : 'Geen meldingen gevonden.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {zichtbaar.map(({ issue, boot, melder }) => {
            const si = STATUS_FLOW.find(s => s.value === issue.status) ?? STATUS_FLOW[0]
            const isOpen = openId === issue.id
            return (
              <div key={issue.id} className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer hover:bg-surface-container-high transition-colors"
                  onClick={() => setOpenId(isOpen ? null : issue.id)}
                >
                  <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center ${si.cls}`}>
                    <span className="material-symbols-outlined text-base" aria-hidden="true"
                          style={{ fontVariationSettings: "'FILL' 1" }}>{si.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label text-sm font-semibold text-on-surface truncate">{issue.titel}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {boot && (
                        <span className="font-label text-[11px] text-on-surface-variant">
                          Boot {boot.bootNummer}{boot.naam ? ` — ${boot.naam}` : ''}
                        </span>
                      )}
                      {melder && (
                        <span className="font-label text-[11px] text-on-surface-variant/60">
                          · {melder.name ?? melder.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {issue.prioriteit && issue.prioriteit !== 'normaal' && (
                      <span className={`px-2 py-0.5 rounded-lg font-label text-[10px] font-semibold uppercase ${PRIO_CLS[issue.prioriteit] ?? ''}`}>
                        {issue.prioriteit}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-lg font-label text-[11px] font-semibold ${si.cls}`}>
                      {si.label}
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant text-base transition-transform duration-200"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} aria-hidden="true">
                      expand_more
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
                    {issue.beschrijving && (
                      <p className="font-body text-sm text-on-surface-variant">{issue.beschrijving}</p>
                    )}

                    {/* Status wijzigen */}
                    <div>
                      <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-2">Status bijwerken</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_FLOW.map(s => (
                          <button
                            key={s.value}
                            onClick={() => updateStatus(issue.id, s.value)}
                            disabled={issue.status === s.value}
                            className={[
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-xs font-semibold transition-all',
                              issue.status === s.value
                                ? s.cls + ' opacity-100 ring-1 ring-current'
                                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface',
                            ].join(' ')}
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">{s.icon}</span>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interne notitie */}
                    <div className="space-y-2">
                      <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Interne notitie</p>
                      <textarea
                        rows={3}
                        value={notitie[issue.id] ?? issue.internNote ?? ''}
                        onChange={e => setNotitie(prev => ({ ...prev, [issue.id]: e.target.value }))}
                        placeholder="Bijv. onderdeel besteld bij leverancier…"
                        className="w-full px-3 py-2.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60 resize-none"
                      />
                      <button
                        onClick={() => saveNotitie(issue.id)}
                        className="px-4 py-2 rounded-xl bg-surface-container-high font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        Notitie opslaan
                      </button>
                    </div>

                    {issue.rentalId && (
                      <p className="font-label text-[11px] text-on-surface-variant/40">
                        Ingediend via verhuurrapport · {new Date(issue.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showNieuw && (
        <NieuweMeldingModal schoolId={schoolId} onClose={() => setShowNieuw(false)} onSaved={m => {
          setMeldingen(prev => [m, ...prev])
          setShowNieuw(false)
          toast('Melding aangemaakt')
        }} />
      )}
    </div>
  )
}

// ─── NIEUWE MELDING MODAL ─────────────────────────────────────────────────────

function NieuweMeldingModal({ schoolId, onClose, onSaved }: {
  schoolId: string
  onClose:  () => void
  onSaved:  (m: Melding) => void
}) {
  const [vloot, setVloot]         = useState<{ id: string; bootNummer: string; naam: string | null }[]>([])
  const [bootId, setBootId]       = useState('')
  const [titel, setTitel]         = useState('')
  const [beschrijving, setBeschr] = useState('')
  const [prioriteit, setPrio]     = useState('normaal')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    fetch(`/api/school/${schoolId}/vloot`)
      .then(r => r.json())
      .then(d => { setVloot(d.vloot ?? []); setBootId(d.vloot?.[0]?.id ?? '') })
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, schoolId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const res = await fetch(`/api/school/${schoolId}/meldingen`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bootId, titel, beschrijving: beschrijving || undefined, prioriteit }),
    })
    if (res.ok) {
      const d = await res.json()
      onSaved(d.melding)
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij aanmaken')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog" aria-modal="true" aria-label="Melding aanmaken"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-surface-container rounded-3xl border border-white/10 p-6 space-y-4 shadow-deep"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-lg text-on-surface">Melding aanmaken</h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="p-2 rounded-xl hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="mel-boot">Boot</label>
          <select id="mel-boot" value={bootId} onChange={e => setBootId(e.target.value)} required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60">
            {vloot.map(b => <option key={b.id} value={b.id}>Boot {b.bootNummer}{b.naam ? ` — ${b.naam}` : ''}</option>)}
          </select>
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="mel-titel">Titel</label>
          <input id="mel-titel" type="text" value={titel} onChange={e => setTitel(e.target.value)}
            required autoFocus placeholder="Bijv. Roer beschadigd"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60" />
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="mel-beschr">Beschrijving (optioneel)</label>
          <textarea id="mel-beschr" rows={3} value={beschrijving} onChange={e => setBeschr(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60 resize-none" />
        </div>

        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="mel-prio">Prioriteit</label>
          <select id="mel-prio" value={prioriteit} onChange={e => setPrio(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60">
            <option value="laag">Laag</option>
            <option value="normaal">Normaal</option>
            <option value="hoog">Hoog</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-xl gradient-primary font-label font-semibold text-on-primary disabled:opacity-50 shadow-glow">
          {saving ? 'Aanmaken…' : 'Melding aanmaken'}
        </button>
      </form>
    </div>
  )
}

// ─── INSTELLINGEN TAB ─────────────────────────────────────────────────────────

// Matches the VerhuurTarieven structure already used by VerhuurClient.tsx
type InsteBlok = { id: string; label: string; van: string; tot: string; omschrijving: string }
type InsteTarief = { naam: string; prijzen: Record<string, number>; extraPerUur?: number; opmerking?: string }
type InsteData = { blokken: InsteBlok[]; tarieven: InsteTarief[]; opmerkingen: string[] }

function parseInsteData(raw: unknown): InsteData {
  if (!raw || typeof raw !== 'object') return { blokken: [], tarieven: [], opmerkingen: [] }
  const r = raw as Record<string, unknown>
  return {
    blokken:    Array.isArray(r.blokken)    ? r.blokken    as InsteBlok[]    : [],
    tarieven:   Array.isArray(r.tarieven)   ? r.tarieven   as InsteTarief[]  : [],
    opmerkingen: Array.isArray(r.opmerkingen) ? r.opmerkingen as string[]   : [],
  }
}

function InstellingenTab({
  schoolId,
  school,
  toast,
}: {
  schoolId: string
  school:   SchoolDashboardData['school']
  toast:    (msg: string, type?: 'success' | 'error') => void
}) {
  const inputCls = 'w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60'
  const labelCls = 'font-label text-xs text-on-surface-variant uppercase tracking-wider'

  // ── Algemeen ────────────────────────────────────────────────────────────
  const [naam,       setNaam]      = useState(school.name        ?? '')
  const [city,       setCity]      = useState(school.city        ?? '')
  const [straat,     setStraat]    = useState(school.straat      ?? '')
  const [huisnummer, setHuisnr]    = useState(school.huisnummer  ?? '')
  const [postcode,   setPostcode]  = useState(school.postcode    ?? '')
  const [website,    setWebsite]   = useState(school.website     ?? '')
  const [beschr,     setBeschr]    = useState(school.description ?? '')
  const [savingAlg,  setSavingAlg] = useState(false)
  const [errorAlg,   setErrorAlg]  = useState('')

  // ── Tarieven ─────────────────────────────────────────────────────────────
  const [data,       setData]      = useState<InsteData>(() => parseInsteData(school.verhuurTarieven))
  const [savingTar,  setSavingTar] = useState(false)
  const [errorTar,   setErrorTar]  = useState('')
  const [opmText,    setOpmText]   = useState(() => parseInsteData(school.verhuurTarieven).opmerkingen.join('\n'))

  // New blok form
  const [showBlok,   setShowBlok]  = useState(false)
  const [blokLabel,  setBlokLabel] = useState('')
  const [blokVan,    setBlokVan]   = useState('09:00')
  const [blokTot,    setBlokTot]   = useState('13:00')
  const [blokOmschr, setBlokOm]    = useState('')

  // New tarief form
  const [showTarief,  setShowTarief] = useState(false)
  const [tariefNaam,  setTariefNaam] = useState('')
  const [tariefPrijs, setTariefPrijs] = useState<Record<string, string>>({})
  const [tariefExtra, setTariefExtra] = useState('')
  const [tariefOpm,   setTariefOpm]  = useState('')

  // ── Helpers ──────────────────────────────────────────────────────────────
  async function putTarieven(next: InsteData) {
    setSavingTar(true); setErrorTar('')
    const res = await fetch(`/api/school/${schoolId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ verhuurTarieven: next }),
    })
    if (res.ok) {
      setData(next)
      toast('Tarieven opgeslagen')
    } else {
      const d = await res.json()
      setErrorTar(typeof d.error === 'string' ? d.error : 'Fout bij opslaan')
    }
    setSavingTar(false)
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function saveAlgemeen(e: React.FormEvent) {
    e.preventDefault(); setSavingAlg(true); setErrorAlg('')
    const res = await fetch(`/api/school/${schoolId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:        naam        || undefined,
        city:        city        || undefined,
        straat:      straat      || undefined,
        huisnummer:  huisnummer  || undefined,
        postcode:    postcode    || undefined,
        website:     website     || undefined,
        description: beschr      || undefined,
      }),
    })
    if (res.ok) {
      toast('Schoolgegevens opgeslagen')
    } else {
      const d = await res.json()
      setErrorAlg(typeof d.error === 'string' ? d.error : 'Fout bij opslaan')
    }
    setSavingAlg(false)
  }

  function addBlok(e: React.FormEvent) {
    e.preventDefault()
    if (!blokLabel) return
    const blok: InsteBlok = {
      id:          blokLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      label:       blokLabel,
      van:         blokVan,
      tot:         blokTot,
      omschrijving: blokOmschr || `${blokVan} – ${blokTot}`,
    }
    putTarieven({ ...data, blokken: [...data.blokken, blok] })
    setBlokLabel(''); setBlokOm(''); setShowBlok(false)
  }

  function removeBlok(id: string) {
    const updated: InsteData = {
      ...data,
      blokken: data.blokken.filter(b => b.id !== id),
      tarieven: data.tarieven.map(t => {
        const prijzen = { ...t.prijzen }
        delete prijzen[id]
        return { ...t, prijzen }
      }),
    }
    putTarieven(updated)
  }

  function addTarief(e: React.FormEvent) {
    e.preventDefault()
    if (!tariefNaam) return
    const prijzen: Record<string, number> = {}
    for (const [blokId, v] of Object.entries(tariefPrijs)) {
      const n = parseFloat(v)
      if (!isNaN(n) && n > 0) prijzen[blokId] = n
    }
    const rij: InsteTarief = {
      naam:    tariefNaam,
      prijzen,
      ...(tariefExtra ? { extraPerUur: parseFloat(tariefExtra) } : {}),
      ...(tariefOpm   ? { opmerking: tariefOpm }                 : {}),
    }
    putTarieven({ ...data, tarieven: [...data.tarieven, rij] })
    setTariefNaam(''); setTariefPrijs({}); setTariefExtra(''); setTariefOpm(''); setShowTarief(false)
  }

  function removeTarief(naam: string) {
    putTarieven({ ...data, tarieven: data.tarieven.filter(t => t.naam !== naam) })
  }

  function saveOpmerkingen() {
    const lines = opmText.split('\n').map(l => l.trim()).filter(Boolean)
    putTarieven({ ...data, opmerkingen: lines })
  }

  return (
    <div className="space-y-6">

      {/* ── Schoolgegevens ─────────────────────────────────────────── */}
      <section className="bg-surface-container rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">store</span>
          <h2 className="font-headline font-bold text-lg text-on-surface">Schoolgegevens</h2>
        </div>

        <form onSubmit={saveAlgemeen} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="inst-naam">Naam school</label>
              <input id="inst-naam" type="text" value={naam} onChange={e => setNaam(e.target.value)}
                required className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inst-straat">Straat</label>
              <input id="inst-straat" type="text" value={straat} onChange={e => setStraat(e.target.value)}
                placeholder="Havenstraat" className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inst-huisnr">Huisnummer</label>
              <input id="inst-huisnr" type="text" value={huisnummer} onChange={e => setHuisnr(e.target.value)}
                placeholder="12a" className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inst-postcode">Postcode</label>
              <input id="inst-postcode" type="text" value={postcode} onChange={e => setPostcode(e.target.value)}
                placeholder="1234 AB" className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className={labelCls} htmlFor="inst-city">Stad / Plaats</label>
              <input id="inst-city" type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="Amsterdam" className={`mt-1 ${inputCls}`} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="inst-website">Website</label>
              <input id="inst-website" type="url" value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://www.mijnzeilschool.nl" className={`mt-1 ${inputCls}`} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="inst-beschr">Beschrijving (optioneel)</label>
              <textarea id="inst-beschr" rows={3} value={beschr} onChange={e => setBeschr(e.target.value)}
                placeholder="Korte omschrijving van de school…"
                className={`mt-1 ${inputCls} resize-none`} />
            </div>
          </div>
          {errorAlg && <p className="font-body text-sm text-error" role="alert">{errorAlg}</p>}
          <button type="submit" disabled={savingAlg}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary disabled:opacity-50 shadow-glow">
            <span className="material-symbols-outlined text-base" aria-hidden="true">save</span>
            {savingAlg ? 'Opslaan…' : 'Gegevens opslaan'}
          </button>
        </form>
      </section>

      {/* ── Verhuurblokken ─────────────────────────────────────────── */}
      <section className="bg-surface-container rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">schedule</span>
            <h2 className="font-headline font-bold text-lg text-on-surface">Tijdblokken</h2>
          </div>
          <button onClick={() => setShowBlok(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow">
            <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
            Blok
          </button>
        </div>

        <p className="font-body text-xs text-on-surface-variant/70">
          Definieer huurperiodes (bijv. ochtend/middag). Huurders kiezen een blok bij het aanvragen.
        </p>

        {data.blokken.length === 0 && !showBlok ? (
          <div className="text-center py-4">
            <p className="font-body text-sm text-on-surface-variant">Nog geen tijdblokken ingesteld.</p>
            <button onClick={() => setShowBlok(true)} className="mt-2 font-label text-sm text-primary hover:underline">
              Voeg eerste blok toe
            </button>
          </div>
        ) : (
          data.blokken.length > 0 && (
            <div className="space-y-1.5">
              {data.blokken.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-white/8">
                  <div className="flex-1 min-w-0">
                    <p className="font-label text-sm font-semibold text-on-surface">{b.label}</p>
                    <p className="font-label text-[11px] text-on-surface-variant">{b.omschrijving || `${b.van} – ${b.tot}`}</p>
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant/60">{b.van}–{b.tot}</span>
                  <button onClick={() => removeBlok(b.id)} disabled={savingTar}
                    aria-label={`Blok ${b.label} verwijderen`}
                    className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {showBlok && (
          <form onSubmit={addBlok} className="bg-surface rounded-xl border border-primary/20 p-4 space-y-3">
            <p className={labelCls}>Nieuw tijdblok</p>
            <input type="text" value={blokLabel} onChange={e => setBlokLabel(e.target.value)}
              required autoFocus placeholder="Bijv. Blok 1, Ochtend, Hele dag…"
              className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`${labelCls} block mb-1`} htmlFor="blok-van">Van</label>
                <input id="blok-van" type="time" value={blokVan} onChange={e => setBlokVan(e.target.value)}
                  required className={inputCls} />
              </div>
              <div>
                <label className={`${labelCls} block mb-1`} htmlFor="blok-tot">Tot</label>
                <input id="blok-tot" type="time" value={blokTot} onChange={e => setBlokTot(e.target.value)}
                  required className={inputCls} />
              </div>
            </div>
            <input type="text" value={blokOmschr} onChange={e => setBlokOm(e.target.value)}
              placeholder="Omschrijving (bijv. 10:00 – 14:00 · terug om 13:45)"
              className={inputCls} />
            <div className="flex gap-2">
              <button type="submit" disabled={savingTar}
                className="flex-1 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary disabled:opacity-50 shadow-glow">
                {savingTar ? 'Opslaan…' : 'Blok toevoegen'}
              </button>
              <button type="button" onClick={() => setShowBlok(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Annuleren
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── Tarieven (boot types × blokken) ────────────────────────── */}
      <section className="bg-surface-container rounded-2xl border border-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">sell</span>
            <h2 className="font-headline font-bold text-lg text-on-surface">Tarieven</h2>
          </div>
          {data.blokken.length > 0 && (
            <button onClick={() => setShowTarief(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow">
              <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
              Tarief
            </button>
          )}
        </div>

        {data.blokken.length === 0 ? (
          <p className="font-body text-sm text-on-surface-variant/60 text-center py-2">
            Voeg eerst tijdblokken toe voordat je tarieven instelt.
          </p>
        ) : data.tarieven.length === 0 && !showTarief ? (
          <div className="text-center py-4">
            <p className="font-body text-sm text-on-surface-variant">Nog geen tarieven ingesteld.</p>
            <button onClick={() => setShowTarief(true)} className="mt-2 font-label text-sm text-primary hover:underline">
              Voeg eerste tarief toe
            </button>
          </div>
        ) : (
          data.tarieven.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="pb-2 font-label text-xs text-on-surface-variant uppercase tracking-wider pr-4">Boot / vaartuig</th>
                    {data.blokken.map(b => (
                      <th key={b.id} className="pb-2 font-label text-xs text-on-surface-variant uppercase tracking-wider px-2 text-right whitespace-nowrap">
                        {b.label}
                      </th>
                    ))}
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.tarieven.map(t => (
                    <tr key={t.naam} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-label text-sm font-semibold text-on-surface">{t.naam}</p>
                        {t.opmerking && <p className="font-label text-[10px] text-on-surface-variant mt-0.5">{t.opmerking}</p>}
                        {t.extraPerUur != null && (
                          <p className="font-label text-[10px] text-on-surface-variant/60">+€{t.extraPerUur}/uur extra</p>
                        )}
                      </td>
                      {data.blokken.map(b => (
                        <td key={b.id} className="py-3 px-2 text-right font-body tabular-nums text-on-surface">
                          {t.prijzen[b.id] != null ? `€${t.prijzen[b.id]}` : <span className="text-on-surface-variant/30">—</span>}
                        </td>
                      ))}
                      <td className="py-3 pl-2">
                        <button onClick={() => removeTarief(t.naam)} disabled={savingTar}
                          aria-label={`Tarief ${t.naam} verwijderen`}
                          className="p-1 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-colors">
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {showTarief && data.blokken.length > 0 && (
          <form onSubmit={addTarief} className="bg-surface rounded-xl border border-primary/20 p-4 space-y-3">
            <p className={labelCls}>Nieuw tarief</p>
            <input type="text" value={tariefNaam} onChange={e => setTariefNaam(e.target.value)}
              required autoFocus placeholder="Naam (bijv. Sloep, Valk, Kano…)"
              className={inputCls} />
            <div className="space-y-1.5">
              <p className={labelCls}>Prijs per blok (€)</p>
              {data.blokken.map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="font-label text-xs text-on-surface-variant w-28 flex-shrink-0">{b.label}</span>
                  <input
                    type="number" min={0} step={0.01} placeholder="—"
                    value={tariefPrijs[b.id] ?? ''}
                    onChange={e => setTariefPrijs(prev => ({ ...prev, [b.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`${labelCls} block mb-1`} htmlFor="tar-extra">Meerprijs/uur (€, optioneel)</label>
                <input id="tar-extra" type="number" min={0} step={0.01} value={tariefExtra}
                  onChange={e => setTariefExtra(e.target.value)} placeholder="0.00"
                  className={inputCls} />
              </div>
              <div>
                <label className={`${labelCls} block mb-1`} htmlFor="tar-opm">Opmerking (optioneel)</label>
                <input id="tar-opm" type="text" value={tariefOpm}
                  onChange={e => setTariefOpm(e.target.value)} placeholder="Bijv. kinderen halve prijs"
                  className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingTar}
                className="flex-1 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary disabled:opacity-50 shadow-glow">
                {savingTar ? 'Opslaan…' : 'Tarief toevoegen'}
              </button>
              <button type="button" onClick={() => setShowTarief(false)}
                className="px-4 py-2.5 rounded-xl bg-surface-container font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                Annuleren
              </button>
            </div>
          </form>
        )}

        {errorTar && <p className="font-body text-sm text-error" role="alert">{errorTar}</p>}
      </section>

      {/* ── Opmerkingen ────────────────────────────────────────────── */}
      <section className="bg-surface-container rounded-2xl border border-white/5 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">info</span>
          <h2 className="font-headline font-bold text-lg text-on-surface">Aanvullende informatie</h2>
        </div>
        <p className="font-body text-xs text-on-surface-variant/70">
          Elke regel wordt als losse opmerking getoond op de verhuurtariefkaart (bijv. borgregels, openingstijden).
        </p>
        <textarea rows={4} value={opmText} onChange={e => setOpmText(e.target.value)}
          placeholder="Bijv. Borg €50 bij ophalen boot schoon inleveren&#10;Openingstijden: ma–vr 09:00–17:00"
          className={`${inputCls} resize-none`} />
        <button type="button" onClick={saveOpmerkingen} disabled={savingTar}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">save</span>
          {savingTar ? 'Opslaan…' : 'Opslaan'}
        </button>
      </section>
    </div>
  )
}

// ─── CURSISTEN TAB (voor instructeurs) ───────────────────────────────────────

function CursistenTab({ schoolId }: { schoolId: string }) {
  const [cursisten, setCursisten] = useState<{
    userId: string; naam: string | null; email: string; image: string | null; joinedAt: string | null
  }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/school/${schoolId}/leden`)
      .then(r => r.json())
      .then(d => {
        const alleleden = d.leden ?? []
        setCursisten(alleleden.filter((l: { role: string }) => l.role === 'cursist'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [schoolId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-surface-container rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (cursisten.length === 0) {
    return (
      <div className="bg-surface-container rounded-2xl p-8 border border-white/5 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant" aria-hidden="true">school</span>
        <p className="font-body text-on-surface-variant mt-2">Nog geen cursisten in deze school.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-headline font-bold text-lg text-on-surface">
        Cursisten <span className="font-normal text-on-surface-variant text-base">({cursisten.length})</span>
      </h2>
      <div className="bg-surface-container rounded-2xl border border-white/5 divide-y divide-white/5">
        {cursisten.map(c => (
          <div key={c.userId} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex-shrink-0 overflow-hidden flex items-center justify-center">
              {c.image
                ? <img src={c.image} alt="" className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">person</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label text-sm font-semibold text-on-surface truncate">{c.naam ?? c.email}</p>
              <p className="font-label text-xs text-on-surface-variant truncate">{c.email}</p>
            </div>
            <a
              href={`/school/${schoolId}/cursist/${c.userId}/vorderingen`}
              aria-label={`Vorderingenstaat van ${c.naam ?? c.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-label text-xs font-semibold hover:bg-primary/20 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">description</span>
              <span className="hidden sm:inline">Vorderingen</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── BERICHTEN TAB ────────────────────────────────────────────────────────────

type Bericht = {
  id: string
  inhoud: string
  courseId: string | null
  createdAt: string | null
  sender: { id: string; name: string | null; email: string; image: string | null } | null
}

function BerichtenTab({ schoolId, myUserId }: { schoolId: string; myUserId: string }) {
  const [berichten, setBerichten] = useState<Bericht[]>([])
  const [loading, setLoading]     = useState(true)
  const [tekst, setTekst]         = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    fetch(`/api/school/${schoolId}/berichten`)
      .then(r => r.json())
      .then(d => { setBerichten(d.berichten ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [schoolId])

  async function handleVerzenden(e: React.FormEvent) {
    e.preventDefault()
    if (!tekst.trim()) return
    setSending(true); setError('')
    const res = await fetch(`/api/school/${schoolId}/berichten`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ inhoud: tekst.trim() }),
    })
    if (res.ok) {
      const refreshed = await fetch(`/api/school/${schoolId}/berichten`).then(r => r.json())
      setBerichten(refreshed.berichten ?? [])
      setTekst('')
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij verzenden')
    }
    setSending(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/school/${schoolId}/berichten?id=${id}`, { method: 'DELETE' })
    if (res.ok) setBerichten(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="space-y-4">
      <h2 className="font-headline font-bold text-lg text-on-surface">Berichten</h2>

      {/* Nieuw bericht */}
      <form onSubmit={handleVerzenden} className="bg-surface-container rounded-2xl border border-white/5 p-4 space-y-3">
        <textarea
          value={tekst}
          onChange={e => setTekst(e.target.value)}
          rows={3}
          placeholder="Schrijf een bericht aan het team…"
          maxLength={2000}
          className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60 resize-none"
        />
        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={sending || !tekst.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">send</span>
            {sending ? 'Verzenden…' : 'Verzenden'}
          </button>
        </div>
      </form>

      {/* Berichten lijst */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-container rounded-xl animate-pulse" />)}
        </div>
      ) : berichten.length === 0 ? (
        <div className="bg-surface-container rounded-2xl p-8 border border-white/5 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant" aria-hidden="true">forum</span>
          <p className="font-body text-on-surface-variant mt-2">Nog geen berichten geplaatst.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {berichten.map(b => (
            <div key={b.id} className="bg-surface-container rounded-2xl border border-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {b.sender?.image
                    ? <img src={b.sender.image} alt="" className="w-full h-full object-cover" />
                    : <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">person</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-label text-sm font-semibold text-on-surface">
                      {b.sender?.name ?? b.sender?.email ?? 'Onbekend'}
                    </span>
                    {b.createdAt && (
                      <span className="font-label text-xs text-on-surface-variant">
                        {format(new Date(b.createdAt), 'd MMM yyyy · HH:mm', { locale: nl })}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-on-surface mt-1 whitespace-pre-wrap">{b.inhoud}</p>
                </div>
                {b.sender?.id === myUserId && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    aria-label="Bericht verwijderen"
                    className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
