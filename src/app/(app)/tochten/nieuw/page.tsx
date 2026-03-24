'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SAILING_AREAS, BOAT_LABELS, CWO_LABELS, type BoatType, type CWOLevel } from '@/types'

const VAARTIJDEN = ['06:00','07:00','08:00','09:00','09:30','10:00','10:30','11:00','12:00','13:00','14:00']

export default function NieuwTochtPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Volgende donderdag als default
  const nextThursday = (() => {
    const d   = new Date()
    const day = d.getDay()
    const diff = (4 - day + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
  })()

  const [form, setForm] = useState({
    titel:          '',
    beschrijving:   '',
    datum:          nextThursday,
    vertrekTijd:    '09:00',
    vaargebied:     'amsterdam',
    locatie:        '',
    bootType:       '' as BoatType | '',
    cwoMinimum:     'geen' as CWOLevel,
    aantalPlaatsen: 1,
  })

  const set = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/tochten', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...form,
          bootType:   form.bootType || undefined,
          aantalPlaatsen: Number(form.aantalPlaatsen),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.fieldErrors ? 'Controleer de ingevulde gegevens.' : data.error)

      router.push(`/tochten/${data.tocht.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="px-4 pt-6 pb-10">
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          aria-label="Terug"
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Oproep plaatsen</h1>
          <p className="font-body text-xs text-on-surface-variant">Vertel andere zeilers wanneer en waar je vaart</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Titel */}
        <Field label="Titel" required>
          <input
            type="text"
            value={form.titel}
            onChange={e => set('titel', e.target.value)}
            placeholder='bijv. "Donderdagochtend Kaag, zoek maatje voor Valk"'
            maxLength={80}
            required
            className={inputCls}
          />
        </Field>

        {/* Datum + tijd */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Datum" required>
            <input
              type="date"
              value={form.datum}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => set('datum', e.target.value)}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Vertrek">
            <select value={form.vertrekTijd} onChange={e => set('vertrekTijd', e.target.value)} className={inputCls}>
              {VAARTIJDEN.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        {/* Vaargebied */}
        <Field label="Vaargebied" required>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Vaargebied kiezen">
            {SAILING_AREAS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={form.vaargebied === id}
                onClick={() => set('vaargebied', id)}
                className={`px-3 py-2 rounded-full border font-label text-sm font-bold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${form.vaargebied === id
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* Locatie */}
        <Field label="Jachthaven / vertrekpunt">
          <input
            type="text"
            value={form.locatie}
            onChange={e => set('locatie', e.target.value)}
            placeholder='bijv. "MZV De Boet, Kaag"'
            maxLength={100}
            className={inputCls}
          />
        </Field>

        {/* Boottype */}
        <Field label="Boottype">
          <select value={form.bootType} onChange={e => set('bootType', e.target.value)} className={inputCls}>
            <option value="">Geen voorkeur</option>
            {(Object.keys(BOAT_LABELS) as BoatType[]).map(t => (
              <option key={t} value={t}>{BOAT_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        {/* CWO minimum */}
        <Field label="Minimaal CWO-niveau">
          <select value={form.cwoMinimum} onChange={e => set('cwoMinimum', e.target.value as CWOLevel)} className={inputCls}>
            {(Object.keys(CWO_LABELS) as CWOLevel[]).map(l => (
              <option key={l} value={l}>{CWO_LABELS[l]}</option>
            ))}
          </select>
        </Field>

        {/* Aantal plaatsen */}
        <Field label="Aantal maatjes gezocht">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                type="button"
                aria-pressed={form.aantalPlaatsen === n}
                onClick={() => set('aantalPlaatsen', n)}
                className={`w-12 h-12 rounded-2xl border font-headline font-bold text-lg transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${form.aantalPlaatsen === n
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>

        {/* Omschrijving */}
        <Field label="Omschrijving">
          <textarea
            value={form.beschrijving}
            onChange={e => set('beschrijving', e.target.value)}
            placeholder="Vertel iets meer over de tocht, wat je zoekt in een maatje, etc."
            rows={4}
            maxLength={500}
            className={`${inputCls} resize-none`}
          />
          <p className="text-right font-label text-xs text-on-surface-variant mt-1">
            {form.beschrijving.length}/500
          </p>
        </Field>

        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-error/10 border border-error/20">
            <p className="font-label text-sm text-error">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !form.titel || !form.datum || !form.vaargebied}
          className="w-full py-5 rounded-full gradient-primary text-on-primary
                     font-headline font-extrabold text-lg shadow-glow
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-95 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {saving ? 'Opslaan...' : '⛵ Oproep plaatsen'}
        </button>
      </form>
    </main>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-label text-sm font-semibold text-on-surface mb-2">
        {label}{required && <span className="text-primary ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = `w-full px-4 py-3.5 bg-surface-container-high rounded-2xl
  text-on-surface placeholder:text-on-surface-variant/40
  border border-white/10 focus:border-primary/50 font-body text-base
  focus:outline-none focus-visible:ring-1 focus-visible:ring-primary`
