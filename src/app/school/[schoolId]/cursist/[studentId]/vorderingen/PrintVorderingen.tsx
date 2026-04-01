'use client'

import type { VorderingenResult, SkillScore } from '@/lib/db/queries/school'

const SCORE_LABELS: Record<SkillScore, { label: string; symbol: string; cls: string }> = {
  aangeboden: { label: 'Aangeboden', symbol: 'A',  cls: 'bg-blue-100 text-blue-800' },
  matig:      { label: 'Matig',      symbol: 'M',  cls: 'bg-yellow-100 text-yellow-800' },
  redelijk:   { label: 'Redelijk',   symbol: 'R',  cls: 'bg-orange-100 text-orange-800' },
  beheerst:   { label: 'Beheerst',   symbol: 'B',  cls: 'bg-green-100 text-green-800' },
}

const SCORE_PRINT: Record<SkillScore, string> = {
  aangeboden: 'A',
  matig:      'M',
  redelijk:   'R',
  beheerst:   'B',
}

function formatDatum(datum: string) {
  return new Date(datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function LastScore({ skills, lessen }: { skills: VorderingenResult['skills']; lessen: VorderingenResult['lessen'] }) {
  // For each skill, find the most recent score
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {skills.map(skill => {
        let lastScore: SkillScore | null = null
        for (const les of [...lessen].reverse()) {
          if (les.scores[skill.id]) { lastScore = les.scores[skill.id]; break }
        }
        if (!lastScore) return null
        const s = SCORE_LABELS[lastScore]
        return (
          <span key={skill.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
            {skill.naam} <span className="font-bold">{s.symbol}</span>
          </span>
        )
      })}
    </div>
  )
}

interface Props {
  vorderingen: VorderingenResult[]
  cursistNaam: string
}

export function PrintVorderingen({ vorderingen, cursistNaam }: Props) {
  function handlePrint() {
    window.print()
  }

  const today = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-dvh bg-white text-gray-900">
      {/* Print-hidden toolbar */}
      <div className="print:hidden sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="javascript:history.back()"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Terug
          </a>
          <span className="text-gray-300">|</span>
          <h1 className="text-sm font-semibold text-gray-700">Vorderingenstaat — {cursistNaam}</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Afdrukken / Opslaan als PDF
        </button>
      </div>

      {/* Document */}
      <div className="max-w-5xl mx-auto px-8 py-10 print:px-6 print:py-4">
        {/* Document header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-800 print:mb-4 print:pb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">Vorderingenstaat</h1>
            <p className="text-lg text-gray-700 mt-1">{cursistNaam}</p>
            <p className="text-sm text-gray-500 mt-1">Afgedrukt op {today}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-semibold text-gray-700">VaarSamen</p>
            <p>vaarsamen.nl</p>
          </div>
        </div>

        {vorderingen.length === 0 && (
          <p className="text-center text-gray-500 py-12">Geen vorderingen gevonden.</p>
        )}

        {vorderingen.map((cursus, ci) => (
          <div key={cursus.course.id} className={ci > 0 ? 'mt-10 print:mt-6 print:break-before-page' : ''}>
            {/* Cursus header */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 print:text-base">{cursus.course.name}</h2>
              <p className="text-sm text-gray-500">{cursus.school.name}{cursus.school.city ? ` · ${cursus.school.city}` : ''}</p>
              {cursus.skills.length > 0 && cursus.lessen.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Huidige stand</p>
                  <LastScore skills={cursus.skills} lessen={cursus.lessen} />
                </div>
              )}
            </div>

            {/* Skills × Lessen matrix */}
            {cursus.skills.length > 0 && cursus.lessen.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse print:text-[9px]">
                  <thead>
                    <tr>
                      {/* Skill column header */}
                      <th className="text-left font-semibold text-gray-600 border border-gray-300 bg-gray-50 px-2 py-1.5 min-w-[180px] print:min-w-[140px]">
                        Vaardigheid
                      </th>
                      {cursus.lessen.map(les => (
                        <th key={les.lesId} className="font-medium text-gray-600 border border-gray-300 bg-gray-50 px-1 py-1 text-center whitespace-nowrap">
                          <div>{formatDatum(les.datum)}</div>
                          {les.bootNummer && (
                            <div className="text-gray-400 font-normal">#{les.bootNummer}</div>
                          )}
                          {les.soloGevaren && (
                            <div className="text-purple-600 font-bold">solo</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cursus.skills.map((skill, si) => (
                      <tr key={skill.id} className={si % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">
                          <span className="text-gray-400 text-[10px] mr-1">{skill.code}</span>{skill.naam}
                        </td>
                        {cursus.lessen.map(les => {
                          const score = les.scores[skill.id]
                          return (
                            <td key={les.lesId} className="border border-gray-300 text-center px-0.5 py-1">
                              {score ? (
                                <span
                                  className={`inline-block w-6 h-6 leading-6 rounded font-bold print:w-5 print:h-5 print:leading-5 print:rounded-none ${SCORE_LABELS[score].cls}`}
                                  title={SCORE_LABELS[score].label}
                                >
                                  {SCORE_PRINT[score]}
                                </span>
                              ) : (
                                <span className="text-gray-200">·</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {cursus.lessen.length === 0 ? 'Nog geen lessen gevolgd.' : 'Nog geen vaardigheden gedefinieerd.'}
              </p>
            )}

            {/* Opmerkingen per les */}
            {cursus.lessen.some(l => l.note) && (
              <div className="mt-4 print:mt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Opmerkingen</p>
                <div className="space-y-1">
                  {cursus.lessen.filter(l => l.note).map(les => (
                    <div key={les.lesId} className="text-xs text-gray-600 flex gap-2">
                      <span className="font-medium text-gray-500 shrink-0">{formatDatum(les.datum)}:</span>
                      <span>{les.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legenda */}
            <div className="mt-6 pt-3 border-t border-gray-200 flex flex-wrap gap-3 print:mt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mr-1 self-center">Legenda:</p>
              {(Object.keys(SCORE_LABELS) as SkillScore[]).map(score => (
                <span key={score} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${SCORE_LABELS[score].cls}`}>
                  <span className="font-bold">{SCORE_PRINT[score]}</span> = {SCORE_LABELS[score].label}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Handtekeningen ruimte */}
        {vorderingen.length > 0 && (
          <div className="mt-12 pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 print:mt-8 print:break-inside-avoid">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-8">Handtekening cursist</p>
              <div className="border-b border-gray-400 w-full" />
              <p className="text-xs text-gray-400 mt-1">{cursistNaam}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-8">Handtekening instructeur</p>
              <div className="border-b border-gray-400 w-full" />
              <p className="text-xs text-gray-400 mt-1">Datum: ___________</p>
            </div>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
