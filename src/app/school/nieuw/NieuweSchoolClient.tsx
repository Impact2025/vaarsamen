'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function NieuweSchoolClient() {
  const router = useRouter()
  const [name, setName]           = useState('')
  const [slug, setSlug]           = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [postcode, setPostcode]   = useState('')
  const [huisnummer, setHuisnummer] = useState('')
  const [straat, setStraat]       = useState('')
  const [city, setCity]           = useState('')
  const [website, setWebsite]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [pcLoading, setPcLoading] = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const pcTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Automatisch slug genereren vanuit naam
  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) {
      setSlug(
        val.toLowerCase()
           .normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '')
           .replace(/[^a-z0-9\s-]/g, '')
           .replace(/\s+/g, '-')
           .replace(/-+/g, '-')
           .slice(0, 50)
      )
    }
  }

  // Postcode-lookup debounce — triggered door postcode én huisnummer
  function triggerLookup(pc: string, hnr: string) {
    if (pcTimer.current) clearTimeout(pcTimer.current)
    const cleanPc = pc.replace(/\s/g, '')
    if (!/^\d{4}[a-zA-Z]{2}$/.test(cleanPc)) return

    pcTimer.current = setTimeout(async () => {
      setPcLoading(true)
      try {
        const url = hnr.trim()
          ? `/api/postcode/${cleanPc}?huisnummer=${encodeURIComponent(hnr.trim())}`
          : `/api/postcode/${cleanPc}`
        const res  = await fetch(url)
        const data = await res.json()
        if (res.ok) {
          if (data.city)   setCity(data.city)
          if (data.straat) setStraat(data.straat)
          if (data.postcode) setPostcode(data.postcode) // normaliseer naar "1234 AB"
        }
      } finally {
        setPcLoading(false)
      }
    }, 400)
  }

  function handlePostcodeChange(val: string) {
    setPostcode(val)
    triggerLookup(val, huisnummer)
  }

  function handleHuisnummerChange(val: string) {
    setHuisnummer(val)
    triggerLookup(postcode, val)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErrors({})

    const res = await fetch('/api/school', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug,
        straat:     straat    || undefined,
        huisnummer: huisnummer || undefined,
        postcode:   postcode   || undefined,
        city:       city       || undefined,
        website:    website    || undefined,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      router.push(`/school/${data.school.id}/dashboard`)
    } else if (res.status === 409) {
      setErrors({ slug: 'Deze naam is al in gebruik, kies een andere.' })
      setSaving(false)
    } else if (data.error?.fieldErrors) {
      const fe = data.error.fieldErrors as Record<string, string[]>
      setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]])))
      setSaving(false)
    } else {
      setErrors({ _: data.error?.toString() ?? 'Er ging iets mis' })
      setSaving(false)
    }
  }

  const STEPS = [
    { icon: 'school',          label: 'Schoolgegevens invullen' },
    { icon: 'sailing',         label: 'Vloot toevoegen' },
    { icon: 'group',           label: 'Cursisten & instructeurs uitnodigen' },
    { icon: 'calendar_today',  label: 'Eerste cursus en les aanmaken' },
  ]

  return (
    <div className="space-y-8">

      {/* Intro */}
      <div>
        <h1 className="font-headline font-black text-3xl text-on-surface">
          Jouw zeilschool op VaarSamen
        </h1>
        <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
          Digitaliseer je vorderingenstaten en beheer cursussen, vloot en cursisten op één plek.
          Cursisten kunnen hun voortgang zelf inzien.
        </p>
      </div>

      {/* Stappenplan */}
      <div className="space-y-2">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={[
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              i === 0 ? 'bg-primary/20' : 'bg-white/5',
            ].join(' ')}>
              {i === 0
                ? <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">{step.icon}</span>
                : <span className="font-label text-xs text-on-surface-variant">{i + 1}</span>
              }
            </div>
            <p className={['font-label text-sm', i === 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'].join(' ')}>
              {step.label}
            </p>
          </div>
        ))}
      </div>

      {/* Formulier */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Naam */}
        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="school-naam">
            Naam van je zeilschool *
          </label>
          <input
            id="school-naam" type="text" value={name} onChange={e => handleNameChange(e.target.value)}
            required placeholder="Zeilschool De Boet"
            className="mt-1.5 w-full px-4 py-3.5 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body focus:outline-none focus:border-primary/60"
          />
          {errors.name && <p className="mt-1 font-body text-xs text-error">{errors.name}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="school-slug">
            URL-naam (uniek) *
          </label>
          <div className="mt-1.5 flex items-center gap-0 rounded-xl overflow-hidden border border-white/10 focus-within:border-primary/60 bg-surface-container">
            <span className="pl-4 pr-1 font-body text-sm text-on-surface-variant/60 select-none whitespace-nowrap">
              vaarsamen.nl/school/
            </span>
            <input
              id="school-slug" type="text" value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
              required minLength={2} maxLength={50}
              pattern="[a-z0-9][a-z0-9\-]*"
              placeholder="de-boet"
              className="flex-1 px-2 py-3.5 bg-transparent text-on-surface font-body text-sm focus:outline-none"
            />
          </div>
          <p className="mt-1 font-label text-xs text-on-surface-variant/60">
            Alleen kleine letters, cijfers en koppeltekens
          </p>
          {errors.slug && <p className="mt-1 font-body text-xs text-error">{errors.slug}</p>}
        </div>

        {/* Adres — postcode + huisnummer auto-fill */}
        <fieldset className="space-y-3">
          <legend className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
            Locatie
          </legend>

          {/* Postcode + huisnummer naast elkaar */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="school-postcode" className="sr-only">Postcode</label>
              <div className="relative">
                <input
                  id="school-postcode" type="text" value={postcode}
                  onChange={e => handlePostcodeChange(e.target.value)}
                  placeholder="1234 AB"
                  maxLength={7}
                  className="w-full px-4 py-3.5 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body focus:outline-none focus:border-primary/60"
                />
                {pcLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-base animate-spin" aria-hidden="true">
                    progress_activity
                  </span>
                )}
              </div>
              <p className="mt-1 font-label text-[10px] text-on-surface-variant/50">Postcode</p>
            </div>
            <div className="w-28">
              <label htmlFor="school-huisnummer" className="sr-only">Huisnummer</label>
              <input
                id="school-huisnummer" type="text" value={huisnummer}
                onChange={e => handleHuisnummerChange(e.target.value)}
                placeholder="1a"
                maxLength={10}
                className="w-full px-4 py-3.5 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body focus:outline-none focus:border-primary/60"
              />
              <p className="mt-1 font-label text-[10px] text-on-surface-variant/50">Huisnummer</p>
            </div>
          </div>

          {/* Straatnaam — auto-fill of handmatig */}
          <div>
            <label htmlFor="school-straat" className="sr-only">Straatnaam</label>
            <input
              id="school-straat" type="text" value={straat}
              onChange={e => setStraat(e.target.value)}
              placeholder="Straatnaam (vult automatisch in)"
              className="w-full px-4 py-3.5 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body focus:outline-none focus:border-primary/60"
            />
            <p className="mt-1 font-label text-[10px] text-on-surface-variant/50">Straatnaam</p>
          </div>

          {/* Stad — auto-fill of handmatig */}
          <div>
            <label htmlFor="school-city" className="sr-only">Stad / Haven</label>
            <input
              id="school-city" type="text" value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Sassenheim (vult automatisch in)"
              className="w-full px-4 py-3.5 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body focus:outline-none focus:border-primary/60"
            />
            <p className="mt-1 font-label text-[10px] text-on-surface-variant/50">Stad / Haven</p>
          </div>
        </fieldset>

        {/* Website */}
        <div>
          <label className="font-label text-xs text-on-surface-variant uppercase tracking-wider" htmlFor="school-website">
            Website (optioneel)
          </label>
          <input
            id="school-website" type="url" value={website} onChange={e => setWebsite(e.target.value)}
            placeholder="https://www.jouwzeilschool.nl"
            className="mt-1.5 w-full px-4 py-3.5 rounded-xl bg-surface-container border border-white/10 text-on-surface font-body focus:outline-none focus:border-primary/60"
          />
        </div>

        {errors._ && <p className="font-body text-sm text-error" role="alert">{errors._}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full py-4 rounded-2xl gradient-primary font-label font-bold text-on-primary shadow-glow disabled:opacity-50 disabled:shadow-none transition-opacity text-base"
        >
          {saving ? 'School aanmaken…' : 'School aanmaken en starten →'}
        </button>

        <p className="text-center font-label text-xs text-on-surface-variant/60">
          Gratis te gebruiken · Geen creditcard nodig
        </p>
      </form>
    </div>
  )
}
