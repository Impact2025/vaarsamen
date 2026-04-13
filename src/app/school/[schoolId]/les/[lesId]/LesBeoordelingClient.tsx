'use client'

import { useState, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { LesDetailResult, SkillScore, StudentLesData } from '@/lib/db/queries/school'

// ─── AI PANEL ─────────────────────────────────────────────────────────────────

type AiPanelState = {
  type:    'lesvoorbereiding' | 'analyse'
  subject: string   // les-datum of cursist-naam
  text:    string
  loading: boolean
  error:   string | null
}

function AiPanel({ state, onClose }: { state: AiPanelState; onClose: () => void }) {
  // Render markdown-achtige tekst als plain paragraphs (geen markdown lib nodig)
  const lines = state.text.split('\n')
  return (
    <div className="bg-surface-container rounded-2xl border border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-primary/5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">
            {state.type === 'lesvoorbereiding' ? 'summarize' : 'psychology'}
          </span>
          <div>
            <p className="font-label text-sm font-semibold text-on-surface">
              {state.type === 'lesvoorbereiding' ? 'Lesvoorbereiding' : 'AI Voortgangsanalyse'}
            </p>
            <p className="font-label text-xs text-on-surface-variant">{state.subject}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/10 transition-colors"
          aria-label="Sluiten"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {state.loading && state.text === '' && (
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-base animate-spin" aria-hidden="true">progress_activity</span>
            <span className="font-body text-sm">Analyseren…</span>
          </div>
        )}
        {state.error && (
          <p className="font-body text-sm text-error" role="alert">{state.error}</p>
        )}
        {state.text && (
          <div className="font-body text-sm text-on-surface leading-relaxed space-y-2">
            {lines.map((line, i) => {
              if (line.startsWith('## ')) {
                return <h3 key={i} className="font-headline font-bold text-base text-on-surface mt-4 first:mt-0">{line.slice(3)}</h3>
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-semibold text-on-surface">{line.slice(2, -2)}</p>
              }
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return <p key={i} className="pl-3 text-on-surface-variant before:content-['•'] before:mr-2 before:text-primary">{line.slice(2)}</p>
              }
              if (line.trim() === '') {
                return <div key={i} className="h-1" />
              }
              // Bold inline formatting
              const parts = line.split(/(\*\*[^*]+\*\*)/)
              return (
                <p key={i} className="text-on-surface-variant">
                  {parts.map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j} className="text-on-surface font-semibold">{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              )
            })}
            {state.loading && (
              <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CONSTANTEN ───────────────────────────────────────────────────────────────

const SCORES: { value: SkillScore; label: string; short: string; classes: string; dotClasses: string }[] = [
  {
    value:      'aangeboden',
    label:      'Aangeboden',
    short:      'A',
    classes:    'bg-white/10 text-on-surface border-white/15 hover:bg-white/20',
    dotClasses: 'bg-white/30',
  },
  {
    value:      'matig',
    label:      'Matig',
    short:      'M',
    classes:    'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30',
    dotClasses: 'bg-orange-400',
  },
  {
    value:      'redelijk',
    label:      'Redelijk',
    short:      'R',
    classes:    'bg-amber-400/20 text-amber-300 border-amber-400/30 hover:bg-amber-400/30',
    dotClasses: 'bg-amber-400',
  },
  {
    value:      'beheerst',
    label:      'Beheerst',
    short:      'B',
    classes:    'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30',
    dotClasses: 'bg-primary',
  },
]

function scoreConfig(s: SkillScore | undefined) {
  return SCORES.find(c => c.value === s)
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type StudentState = StudentLesData & {
  scores:      Record<string, SkillScore>
  note:        string
  bootId:      string | null
  soloGevaren: boolean
  isDirty:     boolean
  isSaving:    boolean
  savedOk:     boolean
  error:       string | null
}

interface Props {
  detail:    LesDetailResult
  schoolId:  string
  myUserId:  string
}

// ─── HOOFDCOMPONENT ───────────────────────────────────────────────────────────

export function LesBeoordelingClient({ detail, schoolId }: Props) {
  const { les, fleet, skills, students } = detail

  const [studentStates, setStudentStates] = useState<Record<string, StudentState>>(() =>
    Object.fromEntries(students.map(s => [s.userId, {
      ...s,
      note:        s.note ?? '',
      isDirty:     false,
      isSaving:    false,
      savedOk:     false,
      error:       null,
    }]))
  )

  const [activeStudent, setActiveStudent] = useState<string | null>(students[0]?.userId ?? null)
  const [aiPanel, setAiPanel] = useState<AiPanelState | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const streamAi = useCallback(async (
    url: string,
    body: object,
    type: AiPanelState['type'],
    subject: string,
  ) => {
    // Annuleer vorige stream
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setAiPanel({ type, subject, text: '', loading: true, error: null })

    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  ctrl.signal,
      })

      if (!res.ok) {
        // Lees fout als JSON indien mogelijk; toon nooit raw HTML
        const contentType = res.headers.get('content-type') ?? ''
        let errorMsg = `Serverfout (${res.status}) — probeer het opnieuw`
        if (contentType.includes('application/json')) {
          const json = await res.json().catch(() => null)
          if (json?.error) errorMsg = json.error
        } else if (res.status === 401) {
          errorMsg = 'Geen toegang — log opnieuw in'
        } else if (res.status === 403) {
          errorMsg = 'Geen rechten voor deze actie'
        }
        setAiPanel(p => p ? { ...p, loading: false, error: errorMsg } : null)
        return
      }

      const reader = res.body!.getReader()
      const dec    = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        setAiPanel(p => p ? { ...p, text: p.text + chunk } : null)
      }

      setAiPanel(p => p ? { ...p, loading: false } : null)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setAiPanel(p => p ? { ...p, loading: false, error: (err as Error).message } : null)
    }
  }, [])

  const startLesvoorbereiding = useCallback(() => {
    streamAi(
      `/api/school/${schoolId}/ai/lesvoorbereiding`,
      { lesId: les.id },
      'lesvoorbereiding',
      format(parseISO(les.datum), 'EEEE d MMMM', { locale: nl }),
    )
  }, [schoolId, les.id, les.datum, streamAi])

  const startAnalyse = useCallback((studentUserId: string, naam: string) => {
    streamAi(
      `/api/school/${schoolId}/ai/analyse`,
      { studentUserId, courseId: les.courseId },
      'analyse',
      naam,
    )
  }, [schoolId, les.courseId, streamAi])

  const updateStudent = useCallback((userId: string, patch: Partial<StudentState>) => {
    setStudentStates(prev => ({
      ...prev,
      [userId]: { ...prev[userId], ...patch, isDirty: true, savedOk: false },
    }))
  }, [])

  const setScore = useCallback((userId: string, skillId: string, score: SkillScore) => {
    setStudentStates(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        scores:  { ...prev[userId].scores, [skillId]: score },
        isDirty: true,
        savedOk: false,
      },
    }))
  }, [])

  const saveStudent = useCallback(async (userId: string) => {
    const s = studentStates[userId]
    if (!s) return

    setStudentStates(prev => ({ ...prev, [userId]: { ...prev[userId], isSaving: true, error: null } }))

    try {
      // Bulk beoordelingen + boot/solo
      const assessRes = await fetch(`/api/school/${schoolId}/lessen/${les.id}/beoordelingen`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          studentUserId: userId,
          bootId:        s.bootId,
          soloGevaren:   s.soloGevaren,
          scores:        Object.entries(s.scores).map(([skillId, score]) => ({ skillId, score })),
        }]),
      })

      if (!assessRes.ok) {
        const d = await assessRes.json()
        throw new Error(d.error?.toString() ?? 'Fout bij opslaan beoordelingen')
      }

      // Opmerking opslaan (alleen als niet leeg)
      if (s.note.trim()) {
        const noteRes = await fetch(`/api/school/${schoolId}/lessen/${les.id}/nota`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentUserId: userId, note: s.note.trim() }),
        })
        if (!noteRes.ok) throw new Error('Fout bij opslaan opmerking')
      }

      setStudentStates(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isSaving: false, isDirty: false, savedOk: true, error: null },
      }))
    } catch (err) {
      setStudentStates(prev => ({
        ...prev,
        [userId]: { ...prev[userId], isSaving: false, error: (err as Error).message },
      }))
    }
  }, [studentStates, schoolId, les.id])

  const saveAll = useCallback(async () => {
    const dirtyIds = Object.keys(studentStates).filter(id => studentStates[id].isDirty)
    await Promise.all(dirtyIds.map(saveStudent))
  }, [studentStates, saveStudent])

  const totalScored   = Object.values(studentStates).filter(s => Object.keys(s.scores).length > 0).length
  const totalDirty    = Object.values(studentStates).filter(s => s.isDirty).length
  const allSaved      = Object.values(studentStates).every(s => !s.isDirty)

  return (
    <div className="space-y-4">

      {/* Les header */}
      <div className="bg-surface-container rounded-2xl p-4 border border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-headline font-bold text-xl text-on-surface">
              {format(parseISO(les.datum), 'EEEE d MMMM yyyy', { locale: nl })}
            </h1>
            <p className="font-body text-sm text-on-surface-variant mt-0.5">{les.course.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {les.windRichting && les.windKracht !== null && (
              <div className="flex items-center gap-1.5 justify-end">
                <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">air</span>
                <span className="font-label font-semibold text-on-surface">
                  {les.windRichting} {les.windKracht} Bft
                </span>
              </div>
            )}
            <p className="font-label text-xs text-on-surface-variant mt-1">
              {students.length} cursisten · {totalScored} beoordeeld
            </p>
          </div>
        </div>

        {/* Acties: opslaan + lesvoorbereiding */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5 flex-wrap">
          <button
            onClick={saveAll}
            disabled={allSaved || Object.values(studentStates).some(s => s.isSaving)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary font-label font-semibold text-on-primary text-sm shadow-glow disabled:opacity-40 disabled:shadow-none transition-opacity"
            aria-label="Alle wijzigingen opslaan"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">save</span>
            {allSaved ? 'Alles opgeslagen' : `Alles opslaan${totalDirty > 0 ? ` (${totalDirty})` : ''}`}
          </button>
          {allSaved && (
            <span className="flex items-center gap-1 font-label text-sm text-primary">
              <span className="material-symbols-outlined text-base" aria-hidden="true">check_circle</span>
              Klaar
            </span>
          )}
          <button
            onClick={startLesvoorbereiding}
            disabled={aiPanel?.loading && aiPanel?.type === 'lesvoorbereiding'}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 font-label text-sm font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            aria-label="AI lesvoorbereiding genereren"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">summarize</span>
            Lesvoorbereiding
          </button>
        </div>
      </div>

      {/* AI Panel */}
      {aiPanel && (
        <AiPanel state={aiPanel} onClose={() => { abortRef.current?.abort(); setAiPanel(null) }} />
      )}

      {/* Student tabs + grid */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* Student selector (sidebar op desktop, tabs op mobiel) */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {students.map(student => {
              const state    = studentStates[student.userId]
              const scored   = Object.keys(state?.scores ?? {}).length
              const beheerst = Object.values(state?.scores ?? {}).filter(v => v === 'beheerst').length
              const isActive = activeStudent === student.userId

              return (
                <div key={student.userId} className="flex-shrink-0 lg:flex-shrink flex flex-col gap-1">
                <button
                  onClick={() => setActiveStudent(student.userId)}
                  className={[
                    'flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all w-full',
                    isActive
                      ? 'bg-primary/10 border-primary/30 text-on-surface'
                      : 'bg-surface-container border-white/5 text-on-surface-variant hover:bg-surface-container-high',
                  ].join(' ')}
                  aria-pressed={isActive}
                  aria-label={`${student.naam ?? 'Cursist'}, ${scored} van ${skills.length} beoordeeld`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {student.image
                      ? <img src={student.image} alt="" className="w-full h-full object-cover" />
                      : <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">person</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-label text-sm font-semibold truncate">
                      {student.naam ?? 'Cursist'}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Mini voortgang bar */}
                      <div className="flex gap-0.5" aria-hidden="true">
                        {skills.slice(0, 9).map(skill => {
                          const sc = state?.scores[skill.id]
                          const dot = scoreConfig(sc)
                          return (
                            <span
                              key={skill.id}
                              className={['w-1.5 h-1.5 rounded-full', dot ? dot.dotClasses : 'bg-white/10'].join(' ')}
                            />
                          )
                        })}
                      </div>
                      <span className="font-label text-[10px] text-on-surface-variant">
                        {beheerst}B
                      </span>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    {state?.isSaving && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-label="Opslaan…" />
                    )}
                    {state?.savedOk && !state?.isDirty && (
                      <span className="material-symbols-outlined text-primary text-sm" aria-label="Opgeslagen">check_circle</span>
                    )}
                    {state?.isDirty && !state?.isSaving && (
                      <span className="w-2 h-2 rounded-full bg-orange-400" aria-label="Niet opgeslagen" />
                    )}
                  </div>
                </button>
                {/* AI analyse + vorderingenstaat knoppen */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => startAnalyse(student.userId, student.naam ?? 'Cursist')}
                    disabled={aiPanel?.loading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container border border-white/5 font-label text-[11px] text-on-surface-variant hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-colors disabled:opacity-40"
                    aria-label={`AI analyse voor ${student.naam ?? 'cursist'}`}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">psychology</span>
                    AI analyse
                  </button>
                  <a
                    href={`/school/${schoolId}/cursist/${student.userId}/vorderingen`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-surface-container border border-white/5 font-label text-[11px] text-on-surface-variant hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-colors"
                    aria-label={`Vorderingenstaat van ${student.naam ?? 'cursist'}`}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">description</span>
                  </a>
                </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vorderingenstaat grid voor actieve student */}
        {activeStudent && studentStates[activeStudent] && (
          <StudentGrid
            key={activeStudent}
            student={studentStates[activeStudent]}
            skills={skills}
            fleet={fleet}
            onSetScore={(skillId, score) => setScore(activeStudent, skillId, score)}
            onSetBoot={bootId => updateStudent(activeStudent, { bootId })}
            onSetSolo={solo => updateStudent(activeStudent, { soloGevaren: solo })}
            onSetNote={note => updateStudent(activeStudent, { note })}
            onSave={() => saveStudent(activeStudent)}
          />
        )}
      </div>
    </div>
  )
}

// ─── STUDENT GRID ─────────────────────────────────────────────────────────────

interface StudentGridProps {
  student:    StudentState
  skills:     LesDetailResult['skills']
  fleet:      LesDetailResult['fleet']
  onSetScore: (skillId: string, score: SkillScore) => void
  onSetBoot:  (bootId: string | null) => void
  onSetSolo:  (solo: boolean) => void
  onSetNote:  (note: string) => void
  onSave:     () => void
}

function StudentGrid({
  student, skills, fleet, onSetScore, onSetBoot, onSetSolo, onSetNote, onSave
}: StudentGridProps) {
  const beheerst = Object.values(student.scores).filter(v => v === 'beheerst').length
  const progress = skills.length > 0 ? (beheerst / skills.length) * 100 : 0

  return (
    <div className="flex-1 min-w-0 bg-surface-container rounded-2xl border border-white/5 overflow-hidden">

      {/* Student header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center flex-shrink-0">
              {student.image
                ? <img src={student.image} alt="" className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-xl text-on-surface-variant" aria-hidden="true">person</span>
              }
            </div>
            <div>
              <h2 className="font-headline font-bold text-on-surface">{student.naam ?? 'Cursist'}</h2>
              <p className="font-label text-xs text-on-surface-variant">
                {Object.keys(student.scores).length} van {skills.length} beoordeeld · {beheerst} Beheerst
              </p>
            </div>
          </div>

          {/* Opslaan knop */}
          <button
            onClick={onSave}
            disabled={!student.isDirty || student.isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow disabled:opacity-40 disabled:shadow-none"
            aria-label={student.isSaving ? 'Bezig met opslaan' : 'Wijzigingen opslaan'}
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {student.isSaving ? 'hourglass_empty' : student.savedOk && !student.isDirty ? 'check' : 'save'}
            </span>
            {student.isSaving ? 'Opslaan…' : student.savedOk && !student.isDirty ? 'Opgeslagen' : 'Opslaan'}
          </button>
        </div>

        {/* Voortgangsbalk */}
        <div className="mt-3">
          <div
            className="h-1.5 bg-white/10 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${beheerst} van ${skills.length} vaardigheden beheerst`}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {student.error && (
          <p className="mt-2 font-body text-sm text-error" role="alert">{student.error}</p>
        )}
      </div>

      {/* Boot + solo */}
      <div className="px-4 py-3 bg-surface-container-high/50 border-b border-white/5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-36">
          <label className="font-label text-xs text-on-surface-variant whitespace-nowrap" htmlFor={`boot-${student.userId}`}>
            Boot nr:
          </label>
          <select
            id={`boot-${student.userId}`}
            value={student.bootId ?? ''}
            onChange={e => onSetBoot(e.target.value || null)}
            className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60"
          >
            <option value="">— niet opgegeven —</option>
            {fleet.map(b => (
              <option key={b.id} value={b.id}>{b.bootNummer}{b.naam ? ` (${b.naam})` : ''}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={student.soloGevaren}
            onChange={e => onSetSolo(e.target.checked)}
            className="w-4 h-4 accent-primary"
            id={`solo-${student.userId}`}
          />
          <span className="font-label text-sm text-on-surface" id={`solo-label-${student.userId}`}>
            Solo gevaren
          </span>
        </label>
      </div>

      {/* Vaardigheden grid */}
      <div className="divide-y divide-white/5">
        {skills.map((skill, idx) => {
          const currentScore = student.scores[skill.id]
          const config       = scoreConfig(currentScore)

          return (
            <div
              key={skill.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high/30 transition-colors"
            >
              {/* Vaardigheid naam */}
              <div className="flex-1 min-w-0 flex items-start gap-2">
                <span className="font-label text-[11px] text-on-surface-variant/60 w-6 flex-shrink-0 pt-0.5 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="font-body text-sm text-on-surface leading-snug">{skill.naam}</p>
              </div>

              {/* Score knoppen — grote touch targets voor tablet */}
              <div
                className="flex gap-1.5 flex-shrink-0"
                role="group"
                aria-label={`Score voor ${skill.naam}`}
              >
                {SCORES.map(s => {
                  const isSelected = currentScore === s.value
                  return (
                    <button
                      key={s.value}
                      onClick={() => onSetScore(skill.id, s.value)}
                      aria-pressed={isSelected}
                      aria-label={`${s.label} voor ${skill.naam}`}
                      className={[
                        'min-w-[44px] min-h-[44px] rounded-xl border font-label text-sm font-bold transition-all duration-150',
                        'flex items-center justify-center',
                        isSelected
                          ? `${s.classes} scale-110 shadow-sm ring-1 ring-current/30`
                          : 'bg-surface border-white/10 text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant',
                      ].join(' ')}
                    >
                      {s.short}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Opmerkingen */}
      <div className="p-4 border-t border-white/5">
        <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor={`note-${student.userId}`}>
          Opmerkingen
        </label>
        <textarea
          id={`note-${student.userId}`}
          value={student.note}
          onChange={e => onSetNote(e.target.value)}
          rows={3}
          placeholder="Bijzonderheden, aandachtspunten voor volgende les…"
          className="mt-2 w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm
                     placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 resize-none"
        />
      </div>

      {/* Snel opslaan footer */}
      {student.isDirty && (
        <div className="px-4 py-3 border-t border-white/5 bg-surface-container-high/30 flex items-center justify-between gap-3">
          <p className="font-label text-xs text-on-surface-variant">Niet-opgeslagen wijzigingen</p>
          <button
            onClick={onSave}
            disabled={student.isSaving}
            className="px-5 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow disabled:opacity-40"
          >
            {student.isSaving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      )}
    </div>
  )
}
