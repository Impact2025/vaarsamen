'use client'

import { useState, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { VorderingenResult, SkillScore } from '@/lib/db/queries/school'

interface Props {
  vorderingen: VorderingenResult
  schoolId:    string
}

// ─── SCORE WEERGAVE ───────────────────────────────────────────────────────────

const SCORE_CONFIG: Record<SkillScore, { label: string; short: string; cell: string; badge: string }> = {
  aangeboden: {
    label: 'Aangeboden',
    short: 'A',
    cell:  'bg-white/8 text-on-surface-variant',
    badge: 'bg-white/10 text-on-surface-variant border border-white/15',
  },
  matig: {
    label: 'Matig',
    short: 'M',
    cell:  'bg-orange-500/15 text-orange-300',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  },
  redelijk: {
    label: 'Redelijk',
    short: 'R',
    cell:  'bg-amber-400/15 text-amber-300',
    badge: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
  },
  beheerst: {
    label: 'Beheerst',
    short: 'B',
    cell:  'bg-primary/15 text-primary',
    badge: 'bg-primary/20 text-primary border border-primary/30',
  },
}

function ScoreBadge({ score }: { score: SkillScore | undefined }) {
  if (!score) return <span className="w-7 h-7 rounded-lg bg-white/5" aria-label="Niet beoordeeld" />
  const c = SCORE_CONFIG[score]
  return (
    <span
      className={['w-7 h-7 rounded-lg font-label text-xs font-bold flex items-center justify-center', c.badge].join(' ')}
      aria-label={c.label}
    >
      {c.short}
    </span>
  )
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function VorderingenGrid({ vorderingen, schoolId }: Props) {
  const { school, course, skills, lessen } = vorderingen
  const [expandNote, setExpandNote] = useState<string | null>(null)

  // AI analyse state
  const [aiText, setAiText]       = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)
  const [aiOpen, setAiOpen]       = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function startAiAnalyse() {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setAiText(''); setAiError(null); setAiLoading(true); setAiOpen(true)

    try {
      const res = await fetch('/api/mijn-vorderingen/ai-analyse', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ schoolId }),
        signal:  ctrl.signal,
      })

      if (!res.ok) {
        const txt = await res.text()
        setAiError(txt || 'Fout bij analyse'); setAiLoading(false); return
      }

      const reader = res.body!.getReader()
      const dec    = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAiText(p => p + dec.decode(value, { stream: true }))
      }
      setAiLoading(false)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setAiError((err as Error).message); setAiLoading(false)
    }
  }

  // Bereken voortgang per vaardigheid (hoogste score)
  const skillProgress = skills.map(skill => {
    const allScores = lessen
      .map(l => l.scores[skill.id])
      .filter(Boolean) as SkillScore[]

    const scoreOrder: SkillScore[] = ['aangeboden', 'matig', 'redelijk', 'beheerst']
    const best = allScores.reduce<SkillScore | undefined>((acc, s) => {
      if (!acc) return s
      return scoreOrder.indexOf(s) > scoreOrder.indexOf(acc) ? s : acc
    }, undefined)

    const beheerstCount = allScores.filter(s => s === 'beheerst').length
    return { skill, best, beheerstCount, total: allScores.length }
  })

  const beheerstTotaal = skillProgress.filter(s => s.best === 'beheerst').length
  const progressPct    = skills.length > 0 ? (beheerstTotaal / skills.length) * 100 : 0

  return (
    <section aria-label={`Vorderingen ${course.name}`}>

      {/* Cursus header */}
      <div className="bg-surface-container rounded-2xl border border-white/5 p-4 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-label text-xs text-primary uppercase tracking-wider">{school.name}</p>
            <h2 className="font-headline font-bold text-lg text-on-surface mt-0.5">{course.name}</h2>
            <p className="font-label text-xs text-on-surface-variant mt-1">
              {lessen.length} {lessen.length === 1 ? 'les' : 'lessen'} ·{' '}
              {beheerstTotaal} van {skills.length} vaardigheden beheerst
            </p>
          </div>
          {/* Circulaire voortgang (simpele taart) */}
          <div className="flex-shrink-0" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              <circle
                cx="26" cy="26" r="22"
                fill="none"
                stroke="#46f1c5"
                strokeWidth="4"
                strokeDasharray={`${(progressPct / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
                className="transition-all duration-700"
              />
              <text x="26" y="30" textAnchor="middle" fill="#46f1c5" fontSize="11" fontWeight="bold" fontFamily="system-ui">
                {Math.round(progressPct)}%
              </text>
            </svg>
          </div>
        </div>

        {/* Legenda + AI knop */}
        <div className="flex items-center gap-3 mt-3 flex-wrap" aria-label="Legenda scores">
          {(Object.entries(SCORE_CONFIG) as [SkillScore, typeof SCORE_CONFIG[SkillScore]][]).map(([key, c]) => (
            <span key={key} className={['flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-label', c.badge].join(' ')}>
              <span className="font-bold">{c.short}</span> {c.label}
            </span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <a
              href={`/school/${school.id}/verhuur`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high border border-white/10 font-label text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Boot aanvragen voor vrij varen"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">key</span>
              Boot lenen
            </a>
            <button
              onClick={startAiAnalyse}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 font-label text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              aria-label="AI voortgangsanalyse opvragen"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">psychology</span>
              AI analyse
            </button>
          </div>
        </div>

        {/* AI analyse panel */}
        {aiOpen && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">psychology</span>
                <span className="font-label text-xs font-semibold text-on-surface">AI Voortgangsanalyse</span>
                {aiLoading && (
                  <span className="material-symbols-outlined text-primary text-sm animate-spin" aria-hidden="true">progress_activity</span>
                )}
              </div>
              <button
                onClick={() => { abortRef.current?.abort(); setAiOpen(false) }}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label="Sluiten"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
              </button>
            </div>

            {aiError && <p className="font-body text-xs text-error" role="alert">{aiError}</p>}

            {aiText && (
              <div className="font-body text-sm text-on-surface-variant leading-relaxed space-y-1.5">
                {aiText.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="font-headline font-bold text-sm text-on-surface mt-3 first:mt-0">{line.slice(3)}</h3>
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-on-surface text-xs">{line.slice(2, -2)}</p>
                  if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="pl-3 text-xs">{line.slice(2)}</p>
                  if (line.trim() === '') return <div key={i} className="h-1" />
                  const parts = line.split(/(\*\*[^*]+\*\*)/)
                  return (
                    <p key={i} className="text-xs">
                      {parts.map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j} className="text-on-surface font-semibold">{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  )
                })}
                {aiLoading && <span className="inline-block w-1 h-3.5 bg-primary animate-pulse ml-0.5 align-text-bottom" aria-hidden="true" />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid — horizontaal scrollbaar op mobiel */}
      <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: `${250 + lessen.length * 56}px` }}>
            <thead>
              {/* Datum rij */}
              <tr className="border-b border-white/5">
                <th className="sticky left-0 bg-surface-container z-10 px-4 py-2 text-left font-label text-xs text-on-surface-variant uppercase tracking-wider w-[250px]">
                  Vaardigheid
                </th>
                {lessen.map(les => (
                  <th key={les.lesId} className="px-2 py-2 font-label text-xs text-on-surface-variant text-center whitespace-nowrap min-w-[52px]">
                    {format(parseISO(les.datum), 'd MMM', { locale: nl })}
                  </th>
                ))}
                <th className="px-2 py-2 font-label text-xs text-primary text-center">Beste</th>
              </tr>
              {/* Wind + boot rij */}
              <tr className="border-b border-white/5 bg-surface-container-high/30">
                <td className="sticky left-0 bg-surface-container-high/30 z-10 px-4 py-1.5 font-label text-[10px] text-on-surface-variant/70">
                  Wind / Boot
                </td>
                {lessen.map(les => (
                  <td key={les.lesId} className="px-1 py-1.5 text-center">
                    <div className="font-label text-[10px] text-on-surface-variant/70 leading-tight">
                      {les.windRichting && les.windKracht !== null
                        ? <><span>{les.windRichting}</span><br /><span>{les.windKracht}B</span></>
                        : <span>—</span>
                      }
                      {les.bootNummer && (
                        <><br /><span className="text-primary/70">#{les.bootNummer}</span></>
                      )}
                    </div>
                  </td>
                ))}
                <td />
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {skills.map((skill, idx) => {
                const prog = skillProgress[idx]
                return (
                  <tr key={skill.id} className="hover:bg-surface-container-high/20 transition-colors">
                    {/* Vaardigheid naam */}
                    <td className="sticky left-0 bg-surface-container z-10 px-4 py-2.5 hover:bg-surface-container-high/30">
                      <div className="flex items-start gap-2">
                        <span className="font-label text-[11px] text-on-surface-variant/50 tabular-nums pt-0.5 w-5 flex-shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <p className="font-body text-xs text-on-surface leading-snug">{skill.naam}</p>
                      </div>
                    </td>

                    {/* Score per les */}
                    {lessen.map(les => (
                      <td key={les.lesId} className="px-2 py-2.5 text-center">
                        <div className="flex justify-center">
                          <ScoreBadge score={les.scores[skill.id] as SkillScore | undefined} />
                        </div>
                      </td>
                    ))}

                    {/* Beste score */}
                    <td className="px-2 py-2.5 text-center">
                      <div className="flex justify-center">
                        <ScoreBadge score={prog.best} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Solo + instructeur footer */}
            <tfoot className="border-t border-white/10 bg-surface-container-high/20">
              <tr>
                <td className="sticky left-0 bg-surface-container-high/20 z-10 px-4 py-2 font-label text-[10px] text-on-surface-variant/70">
                  Solo gevaren
                </td>
                {lessen.map(les => (
                  <td key={les.lesId} className="px-2 py-2 text-center font-label text-[11px]">
                    {les.soloGevaren
                      ? <span className="text-primary" aria-label="Ja">✓</span>
                      : <span className="text-on-surface-variant/30" aria-label="Nee">—</span>
                    }
                  </td>
                ))}
                <td />
              </tr>
              <tr className="border-t border-white/5">
                <td className="sticky left-0 bg-surface-container-high/20 z-10 px-4 py-2 font-label text-[10px] text-on-surface-variant/70">
                  Instructeur
                </td>
                {lessen.map(les => (
                  <td key={les.lesId} className="px-1 py-2 text-center font-label text-[10px] text-on-surface-variant/60">
                    {les.instructeurNaam
                      ? les.instructeurNaam.split(' ')[0]
                      : '—'
                    }
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Opmerkingen sectie */}
        {lessen.some(l => l.note) && (
          <div className="border-t border-white/5 p-4 space-y-2">
            <h3 className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Opmerkingen instructeur</h3>
            {lessen.filter(l => l.note).map(les => (
              <div key={les.lesId} className="bg-surface rounded-xl p-3 border border-white/5">
                <p className="font-label text-xs text-on-surface-variant/70 mb-1">
                  {format(parseISO(les.datum), 'd MMMM yyyy', { locale: nl })}
                  {les.instructeurNaam ? ` · ${les.instructeurNaam}` : ''}
                </p>
                <p className="font-body text-sm text-on-surface">{les.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
