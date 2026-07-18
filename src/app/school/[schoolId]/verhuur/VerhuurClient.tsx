'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, parseISO, isToday, isPast, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, getDay, isSameMonth, isSameDay, subDays } from 'date-fns'
import { nl } from 'date-fns/locale'

type Boot = { id: string; bootNummer: string; naam: string | null }

type Boeking = {
  id:         string
  bootId:     string
  bootNummer: string
  bootNaam:   string | null
  datum:      string
  startTijd:  string
  eindTijd:   string
  opmerking:  string | null
  reactie:    string | null
  status:     'aangevraagd' | 'goedgekeurd' | 'afgewezen' | 'geannuleerd'
  isMine:     boolean
  aanvrager?: { id: string; name: string | null; email: string }
}

export type VerhuurBlok = { id: string; label: string; van: string; tot: string; omschrijving?: string }
export type VerhuurTariefRij = { naam: string; prijzen: Record<string, number>; extraPerUur?: number; opmerking?: string }
export type VerhuurTarieven = {
  blokken:      VerhuurBlok[]
  tarieven:     VerhuurTariefRij[]
  opmerkingen?: string[]
}

const STATUS_INFO = {
  aangevraagd: { label: 'In behandeling', cls: 'bg-amber-400/15 text-amber-300',  icon: 'hourglass_empty' },
  goedgekeurd: { label: 'Goedgekeurd',    cls: 'bg-green-400/15 text-green-300',  icon: 'check_circle'    },
  afgewezen:   { label: 'Afgewezen',      cls: 'bg-red-400/15 text-red-300',      icon: 'cancel'          },
  geannuleerd: { label: 'Geannuleerd',    cls: 'bg-white/8 text-on-surface-variant', icon: 'block'         },
}

interface Props {
  schoolId:   string
  schoolNaam: string
  vloot:      Boot[]
  isStaff:    boolean
  tarieven?:  VerhuurTarieven | null
}

export function VerhuurClient({ schoolId, schoolNaam, vloot, isStaff, tarieven }: Props) {
  const [view, setView]           = useState<'week' | 'maand'>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [maandStart, setMaandStart] = useState(() => startOfMonth(new Date()))
  const [boekingen, setBoekingen]   = useState<Boeking[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [selectedDatum, setSelectedDatum] = useState<string | null>(null)
  const [selectedBootId, setSelectedBootId] = useState(vloot[0]?.id ?? '')

  const weekDagen = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const van = view === 'week'
    ? format(weekStart, 'yyyy-MM-dd')
    : format(startOfMonth(maandStart), 'yyyy-MM-dd')
  const tot = view === 'week'
    ? format(addDays(weekStart, 6), 'yyyy-MM-dd')
    : format(endOfMonth(maandStart), 'yyyy-MM-dd')

  const laadBoekingen = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/school/${schoolId}/verhuur?van=${van}&tot=${tot}`)
    if (res.ok) setBoekingen(await res.json())
    setLoading(false)
  }, [schoolId, van, tot])

  useEffect(() => { laadBoekingen() }, [laadBoekingen])

  async function handleStatusUpdate(boekingId: string, status: Boeking['status'], reactie?: string) {
    await fetch(`/api/school/${schoolId}/verhuur/${boekingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reactie }),
    })
    laadBoekingen()
  }

  function openAanvraag(datum: string, bootId?: string) {
    setSelectedDatum(datum)
    setSelectedBootId(bootId ?? vloot[0]?.id ?? '')
    setShowForm(true)
  }

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href={`/school/${schoolId}/dashboard`} className="p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Terug naar dashboard">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_back</span>
            </a>
            <div>
              <p className="font-headline font-bold text-on-surface text-sm leading-tight">Bootverhuur</p>
              <p className="font-label text-xs text-on-surface-variant">{schoolNaam}</p>
            </div>
          </div>
          {!isStaff && vloot.length > 0 && (
            <button
              onClick={() => openAanvraag(format(new Date(), 'yyyy-MM-dd'))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
              Aanvragen
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {vloot.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30" aria-hidden="true">sailing</span>
            <p className="font-body text-on-surface-variant">Geen boten in de vloot. Voeg boten toe via het dashboard.</p>
          </div>
        )}

        {vloot.length > 0 && (
          <>
            {/* Weergave-toggle + navigatie */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setView('week')}
                  className={['px-3 py-1.5 rounded-lg font-label text-sm font-semibold transition-colors', view === 'week' ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}
                >
                  Week
                </button>
                <button
                  onClick={() => setView('maand')}
                  className={['px-3 py-1.5 rounded-lg font-label text-sm font-semibold transition-colors', view === 'maand' ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'].join(' ')}
                >
                  Maand
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => view === 'week' ? setWeekStart(w => subWeeks(w, 1)) : setMaandStart(m => subMonths(m, 1))}
                  className="p-2 rounded-xl bg-surface-container border border-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label="Vorige periode"
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">chevron_left</span>
                </button>
                <button
                  onClick={() => { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); setMaandStart(startOfMonth(new Date())) }}
                  className="px-3 py-2 rounded-xl bg-surface-container border border-white/5 font-label text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Vandaag
                </button>
                <button
                  onClick={() => view === 'week' ? setWeekStart(w => addWeeks(w, 1)) : setMaandStart(m => addMonths(m, 1))}
                  className="p-2 rounded-xl bg-surface-container border border-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label="Volgende periode"
                >
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">chevron_right</span>
                </button>
                <p className="ml-2 font-label font-semibold text-on-surface text-sm min-w-[7rem] text-center">
                  {view === 'week'
                    ? `${format(weekStart, 'd MMM', { locale: nl })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: nl })}`
                    : format(maandStart, 'MMMM yyyy', { locale: nl })}
                </p>
              </div>
            </div>

            {/* WEEK-GRID */}
            {view === 'week' && (
              <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-3 py-2 font-label text-on-surface-variant w-24">Boot</th>
                        {weekDagen.map(dag => (
                          <th key={dag.toISOString()} className={[
                            'px-2 py-2 font-label text-center',
                            isToday(dag) ? 'text-primary font-bold' : 'text-on-surface-variant',
                          ].join(' ')}>
                            <div>{format(dag, 'EEE', { locale: nl })}</div>
                            <div className={`text-[10px] ${isToday(dag) ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                              {format(dag, 'd/M')}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vloot.map(boot => (
                        <tr key={boot.id} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-2">
                            <p className="font-label font-semibold text-on-surface">#{boot.bootNummer}</p>
                            {boot.naam && <p className="font-label text-[10px] text-on-surface-variant">{boot.naam}</p>}
                          </td>
                          {weekDagen.map(dag => {
                            const dagStr = format(dag, 'yyyy-MM-dd')
                            const dagBoekingen = boekingen.filter(b => b.bootId === boot.id && b.datum === dagStr && b.status !== 'afgewezen' && b.status !== 'geannuleerd')
                            const isGeboekt = dagBoekingen.some(b => b.status === 'goedgekeurd')
                            const isPastDag = isPast(dag) && !isToday(dag)

                            return (
                              <td key={dag.toISOString()} className="px-1 py-1 text-center">
                                {dagBoekingen.length > 0 ? (
                                  <div className="space-y-0.5">
                                    {dagBoekingen.map(b => (
                                      <div
                                        key={b.id}
                                        className={[
                                          'rounded px-1 py-0.5 text-[10px] font-medium leading-tight',
                                          b.status === 'goedgekeurd'  ? 'bg-green-400/20 text-green-300' :
                                          b.status === 'aangevraagd' ? 'bg-amber-400/20 text-amber-300' : '',
                                        ].join(' ')}
                                      >
                                        {b.startTijd}–{b.eindTijd}
                                        {isStaff && b.aanvrager && (
                                          <span className="block opacity-70">{b.aanvrager.name ?? b.aanvrager.email.split('@')[0]}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : !isPastDag && !isGeboekt ? (
                                  <button
                                    onClick={() => openAanvraag(dagStr, boot.id)}
                                    className="w-full h-7 rounded border border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center"
                                    aria-label={`Boot ${boot.bootNummer} aanvragen op ${format(dag, 'd MMM', { locale: nl })}`}
                                  >
                                    <span className="material-symbols-outlined text-[12px] text-on-surface-variant/30 hover:text-primary/50" aria-hidden="true">add</span>
                                  </button>
                                ) : (
                                  <span className="text-on-surface-variant/20">–</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MAAND-GRID */}
            {view === 'maand' && (
              <MaandGrid
                maandStart={maandStart}
                boekingen={boekingen}
                isStaff={isStaff}
                onDagKlik={(dagStr) => openAanvraag(dagStr, vloot[0]?.id)}
                onBoekingKlik={() => {}}
              />
            )}

            {/* Tarieven informatiekaart */}
            {tarieven && <TarievenKaart tarieven={tarieven} />}

            {/* Aanvragen lijst */}
            <div className="space-y-3">
              <h2 className="font-headline font-bold text-base text-on-surface">
                {isStaff ? 'Alle aanvragen deze week' : 'Mijn aanvragen'}
              </h2>
              {loading ? (
                <p className="text-sm text-on-surface-variant">Laden…</p>
              ) : boekingen.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Geen aanvragen deze week.</p>
              ) : (
                boekingen.map(b => (
                  <BoekingKaart
                    key={b.id}
                    boeking={b}
                    isStaff={isStaff}
                    schoolId={schoolId}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Aanvraag formulier modal */}
      {showForm && (
        <AanvraagModal
          schoolId={schoolId}
          vloot={vloot}
          blokken={tarieven?.blokken}
          initialDatum={selectedDatum ?? format(new Date(), 'yyyy-MM-dd')}
          initialBootId={selectedBootId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); laadBoekingen() }}
        />
      )}
    </div>
  )
}

// ─── MAAND-GRID ─────────────────────────────────────────────────────────────

function MaandGrid({
  maandStart, boekingen, isStaff, onDagKlik, onBoekingKlik,
}: {
  maandStart:  Date
  boekingen:   Boeking[]
  isStaff:     boolean
  onDagKlik:   (dagStr: string) => void
  onBoekingKlik: (id: string) => void
}) {
  // Begin grid op maandag van de week die de 1e bevat; toon 6 weken (42 dagen).
  const gridStart = subDays(startOfWeek(maandStart, { weekStartsOn: 1 }), 0)
  const dagen = eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) })
  const weekDagenHeaders = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

  return (
    <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/5">
        {weekDagenHeaders.map(d => (
          <div key={d} className="px-1 py-2 text-center font-label text-[11px] text-on-surface-variant uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dagen.map(dag => {
          const dagStr = format(dag, 'yyyy-MM-dd')
          const inMaand = isSameMonth(dag, maandStart)
          const dagBoekingen = boekingen
            .filter(b => b.datum === dagStr && b.status !== 'afgewezen' && b.status !== 'geannuleerd')
            .sort((a, b) => a.startTijd.localeCompare(b.startTijd))
          const isVandaag = isToday(dag)

          return (
            <button
              key={dagStr}
              onClick={() => onDagKlik(dagStr)}
              className={[
                'min-h-[88px] text-left px-1.5 py-1 border-b border-r border-white/5 transition-colors',
                inMaand ? 'hover:bg-primary/5' : 'opacity-40',
                isVandaag ? 'bg-primary/10' : '',
              ].join(' ')}
            >
              <div className={[
                'flex items-center justify-between',
                isVandaag ? 'text-primary font-bold' : 'text-on-surface-variant',
              ].join(' ')}>
                <span className="font-label text-xs">{format(dag, 'd')}</span>
                {dagBoekingen.length > 0 && (
                  <span className="font-label text-[9px] text-on-surface-variant/70">{dagBoekingen.length}</span>
                )}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dagBoekingen.slice(0, 3).map(b => (
                  <div
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBoekingKlik(b.id) }}
                    className={[
                      'truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight',
                      b.status === 'goedgekeurd'  ? 'bg-green-400/20 text-green-300' :
                      b.status === 'aangevraagd' ? 'bg-amber-400/20 text-amber-300' :
                      'bg-white/8 text-on-surface-variant',
                    ].join(' ')}
                  >
                    #{b.bootNummer} · {b.startTijd}
                  </div>
                ))}
                {dagBoekingen.length > 3 && (
                  <div className="font-label text-[9px] text-on-surface-variant/70">+{dagBoekingen.length - 3} meer</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── TARIEVEN KAART ───────────────────────────────────────────────────────────

function TarievenKaart({ tarieven }: { tarieven: VerhuurTarieven }) {
  const [open, setOpen] = useState(false)
  const blokLabels = tarieven.blokken.map(b => b.label)

  return (
    <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">payments</span>
          <span className="font-label font-semibold text-sm text-on-surface">Verhuur tarieven</span>
        </div>
        <span className={`material-symbols-outlined text-base text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          expand_more
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {/* Tarieven tabel */}
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs min-w-[380px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 pr-3 font-label text-on-surface-variant w-32">Vaartuig</th>
                  {blokLabels.map(label => (
                    <th key={label} className="text-right py-2 px-1.5 font-label text-on-surface-variant whitespace-nowrap">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tarieven.tarieven.map(rij => (
                  <tr key={rij.naam} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-3">
                      <p className="font-label font-semibold text-on-surface leading-tight">{rij.naam}</p>
                      {rij.extraPerUur && (
                        <p className="font-label text-[10px] text-on-surface-variant mt-0.5">+€{rij.extraPerUur.toFixed(2).replace('.', ',')}/uur extra</p>
                      )}
                      {rij.opmerking && (
                        <p className="font-label text-[10px] text-on-surface-variant mt-0.5">{rij.opmerking}</p>
                      )}
                    </td>
                    {tarieven.blokken.map(blok => {
                      const prijs = rij.prijzen[blok.id]
                      return (
                        <td key={blok.id} className="text-right py-2 px-1.5 font-body text-on-surface tabular-nums">
                          {prijs != null ? `€${prijs.toFixed(2).replace('.', ',')}` : <span className="text-on-surface-variant/30">–</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Perioden omschrijving */}
          <div className="grid grid-cols-2 gap-1.5">
            {tarieven.blokken.map(blok => (
              <div key={blok.id} className="bg-surface rounded-xl px-3 py-2">
                <p className="font-label text-[11px] font-semibold text-on-surface">{blok.label}</p>
                <p className="font-label text-[10px] text-on-surface-variant">{blok.omschrijving ?? `${blok.van} – ${blok.tot}`}</p>
              </div>
            ))}
          </div>

          {/* Opmerkingen */}
          {tarieven.opmerkingen && tarieven.opmerkingen.length > 0 && (
            <ul className="space-y-1">
              {tarieven.opmerkingen.map((o, i) => (
                <li key={i} className="flex items-start gap-1.5 font-body text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[12px] mt-0.5 flex-shrink-0 text-on-surface-variant/50" aria-hidden="true">info</span>
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── BOEKING KAART ────────────────────────────────────────────────────────────

function BoekingKaart({
  boeking,
  isStaff,
  schoolId,
  onStatusUpdate,
}: {
  boeking:        Boeking
  isStaff:        boolean
  schoolId:       string
  onStatusUpdate: (id: string, status: Boeking['status'], reactie?: string) => void
}) {
  const [reactie, setReactie]         = useState('')
  const [showReactie, setShowReactie] = useState(false)
  const si = STATUS_INFO[boeking.status]

  const datum    = parseISO(boeking.datum)
  const isVerleden = isPast(datum) && !isToday(datum)
  const toonRapport = boeking.isMine && boeking.status === 'goedgekeurd' && isVerleden

  return (
    <div className="bg-surface-container rounded-2xl border border-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label font-semibold text-sm text-on-surface">
              Boot #{boeking.bootNummer}{boeking.bootNaam ? ` — ${boeking.bootNaam}` : ''}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${si.cls}`}>
              <span className="material-symbols-outlined text-[12px]" aria-hidden="true">{si.icon}</span>
              {si.label}
            </span>
          </div>
          <p className="font-label text-xs text-on-surface-variant">
            {format(datum, 'EEEE d MMMM', { locale: nl })} · {boeking.startTijd}–{boeking.eindTijd}
          </p>
          {isStaff && boeking.aanvrager && (
            <p className="font-label text-xs text-on-surface-variant">
              Aanvrager: {boeking.aanvrager.name ?? boeking.aanvrager.email}
            </p>
          )}
          {boeking.opmerking && (
            <p className="font-body text-xs text-on-surface-variant mt-1 italic">"{boeking.opmerking}"</p>
          )}
          {boeking.reactie && (
            <p className="font-body text-xs text-primary mt-1">↳ {boeking.reactie}</p>
          )}
        </div>

        {/* Acties */}
        <div className="flex-shrink-0 flex flex-col gap-1.5">
          {isStaff && boeking.status === 'aangevraagd' && (
            <>
              <button
                onClick={() => onStatusUpdate(boeking.id, 'goedgekeurd')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-400/15 text-green-300 font-label text-xs font-semibold hover:bg-green-400/25 transition-colors"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">check</span>
                Goedkeuren
              </button>
              <button
                onClick={() => setShowReactie(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-400/15 text-red-300 font-label text-xs font-semibold hover:bg-red-400/25 transition-colors"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
                Afwijzen
              </button>
            </>
          )}
          {boeking.isMine && boeking.status === 'aangevraagd' && (
            <button
              onClick={() => onStatusUpdate(boeking.id, 'geannuleerd')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/8 text-on-surface-variant font-label text-xs hover:bg-white/15 transition-colors"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">cancel</span>
              Annuleren
            </button>
          )}
          {toonRapport && (
            <a
              href={`/school/${schoolId}/verhuur/${boeking.id}/rapport`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary font-label text-xs font-semibold hover:bg-primary/25 transition-colors"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">rate_review</span>
              Rapport invullen
            </a>
          )}
        </div>
      </div>

      {/* Afwijzen met reactie */}
      {showReactie && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <textarea
            value={reactie}
            onChange={e => setReactie(e.target.value)}
            placeholder="Optionele toelichting voor de cursist…"
            rows={2}
            className="w-full bg-surface rounded-xl border border-white/10 px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary/40"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onStatusUpdate(boeking.id, 'afgewezen', reactie || undefined); setShowReactie(false) }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-400/15 text-red-300 font-label text-xs font-semibold hover:bg-red-400/25 transition-colors"
            >
              Afwijzen bevestigen
            </button>
            <button onClick={() => setShowReactie(false)} className="px-3 py-1.5 rounded-lg text-on-surface-variant font-label text-xs hover:text-on-surface transition-colors">
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AANVRAAG MODAL ────────────────────────────────────────────────────────────

function AanvraagModal({
  schoolId, vloot, blokken, initialDatum, initialBootId, onClose, onSaved,
}: {
  schoolId:      string
  vloot:         Boot[]
  blokken?:      VerhuurBlok[]
  initialDatum:  string
  initialBootId: string
  onClose:       () => void
  onSaved:       () => void
}) {
  const [bootId,      setBootId]      = useState(initialBootId)
  const [datum,       setDatum]       = useState(initialDatum)
  const [startTijd,   setStartTijd]   = useState(blokken ? blokken[0].van : '09:00')
  const [eindTijd,    setEindTijd]    = useState(blokken ? blokken[0].tot : '17:00')
  const [selectedBlok, setSelectedBlok] = useState<string | null>(blokken ? blokken[0].id : null)
  const [opmerking,   setOpmerking]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  function kiesBlok(blok: VerhuurBlok) {
    setSelectedBlok(blok.id)
    setStartTijd(blok.van)
    setEindTijd(blok.tot)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)

    const res = await fetch(`/api/school/${schoolId}/verhuur`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bootId, datum, startTijd, eindTijd, opmerking: opmerking || undefined }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Er ging iets mis')
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface-container rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-headline font-bold text-on-surface">Boot aanvragen</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Sluiten">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Boot</label>
            <select
              value={bootId}
              onChange={e => setBootId(e.target.value)}
              required
              className="w-full bg-surface rounded-xl border border-white/10 px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary/40"
            >
              {vloot.map(b => (
                <option key={b.id} value={b.id}>#{b.bootNummer}{b.naam ? ` — ${b.naam}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Datum</label>
            <input
              type="date"
              value={datum}
              onChange={e => setDatum(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
              className="w-full bg-surface rounded-xl border border-white/10 px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Blok-presets (als de school die heeft geconfigureerd) */}
          {blokken && blokken.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Periode</label>
              <div className="grid grid-cols-2 gap-1.5">
                {blokken.map(blok => (
                  <button
                    key={blok.id}
                    type="button"
                    onClick={() => kiesBlok(blok)}
                    className={[
                      'px-3 py-2 rounded-xl border font-label text-xs font-semibold text-left transition-colors',
                      selectedBlok === blok.id
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-white/10 bg-surface text-on-surface-variant hover:border-white/20',
                    ].join(' ')}
                  >
                    <span className="block">{blok.label}</span>
                    <span className="block font-normal opacity-70 text-[10px] mt-0.5">{blok.omschrijving ?? `${blok.van} – ${blok.tot}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tijden (handmatig, of als backup als geen blokken) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Van</label>
              <input
                type="time"
                value={startTijd}
                onChange={e => { setStartTijd(e.target.value); setSelectedBlok(null) }}
                required
                className="w-full bg-surface rounded-xl border border-white/10 px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Tot</label>
              <input
                type="time"
                value={eindTijd}
                onChange={e => { setEindTijd(e.target.value); setSelectedBlok(null) }}
                required
                className="w-full bg-surface rounded-xl border border-white/10 px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Opmerking (optioneel)</label>
            <textarea
              value={opmerking}
              onChange={e => setOpmerking(e.target.value)}
              placeholder="Bijv. voor het examen, solo oefenen…"
              rows={2}
              maxLength={500}
              className="w-full bg-surface rounded-xl border border-white/10 px-3 py-2 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary/40"
            />
          </div>

          {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-2xl gradient-primary font-label font-bold text-on-primary shadow-glow disabled:opacity-50 disabled:shadow-none transition-opacity"
          >
            {saving ? 'Versturen…' : 'Aanvraag indienen →'}
          </button>
        </form>
      </div>
    </div>
  )
}
