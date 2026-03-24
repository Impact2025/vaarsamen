'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { CWO_LABELS, SAILING_AREAS, SKILL_TAGS, type CWOLevel } from '@/types'
import { PostcodeVeld, type PostcodeResult } from '@/components/ui/PostcodeVeld'

const RADIUS_PRESETS = [25, 50, 100, 200, 500] as const

const schema = z.object({
  displayName: z.string().min(2, 'Naam moet minimaal 2 tekens zijn').max(50),
  age:         z.coerce.number().int().min(16).max(99).optional() as z.ZodOptional<z.ZodNumber>,
  bio:         z.string().max(300, 'Bio mag maximaal 300 tekens zijn').optional(),
  homePort:    z.string().max(100).optional(),
  cwoLevel:    z.enum(['geen', 'cwo1', 'cwo2', 'cwo3', 'cwo4', 'cwo_kielboot1', 'cwo_kielboot2', 'cwo_kielboot3']),
})

type FormData = z.infer<typeof schema>

interface ProfileData {
  id:             string
  displayName:    string
  age?:           number | null
  bio?:           string | null
  postcode?:      string | null
  city?:          string | null
  homePort?:      string | null
  photoUrl?:      string | null
  cwoLevel?:      CWOLevel | null
  sailingAreas?:  string[] | null
  skillTags?:     string[] | null
  lat?:           number | null
  lng?:           number | null
  searchRadiusKm?: number | null
}

export default function ProfielBewerkenClient({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const [photoUrl,  setPhotoUrl]  = useState<string | null>(profile.photoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [areas,     setAreas]     = useState<string[]>(profile.sailingAreas ?? [])
  const [skills,    setSkills]    = useState<string[]>(profile.skillTags ?? [])
  const [error,     setError]     = useState<string | null>(null)
  const [location,  setLocation]  = useState<PostcodeResult | null>(
    profile.postcode && profile.city && profile.lat && profile.lng
      ? { postcode: profile.postcode, city: profile.city, lat: profile.lat, lng: profile.lng }
      : null
  )
  const [radius, setRadius] = useState<number>(profile.searchRadiusKm ?? 50)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile.displayName,
      age:         profile.age ?? undefined,
      bio:         profile.bio ?? '',
      homePort:    profile.homePort ?? '',
      cwoLevel:    (profile.cwoLevel ?? 'geen') as CWOLevel,
    },
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) setPhotoUrl(data.url)
      else setError('Upload mislukt, probeer opnieuw.')
    } catch {
      setError('Upload mislukt, probeer opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...data,
          photoUrl:       photoUrl ?? undefined,
          sailingAreas:   areas,
          skillTags:      skills,
          postcode:       location?.postcode,
          city:           location?.city,
          lat:            location?.lat,
          lng:            location?.lng,
          searchRadiusKm: radius,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Opslaan mislukt')
      }
      router.push('/profiel')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    }
  }

  const toggleArea  = (id: string)  => setAreas(prev  => prev.includes(id)  ? prev.filter(a => a !== id)  : [...prev, id])
  const toggleSkill = (s: string)   => setSkills(prev => prev.includes(s)   ? prev.filter(x => x !== s)   : [...prev, s])

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profiel"
          className="w-10 h-10 glass-card rounded-full border border-white/10 flex items-center justify-center
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Terug naar profiel"
        >
          <span className="material-symbols-outlined text-on-surface" aria-hidden="true">arrow_back</span>
        </Link>
        <h1 className="font-headline font-black text-2xl text-on-surface">Profiel bewerken</h1>
      </div>

      {/* Foto */}
      <div className="flex justify-center mb-8">
        <label htmlFor="photo-upload" className="relative cursor-pointer group" aria-label="Profielfoto wijzigen">
          <div className="w-28 h-28 rounded-[1.8rem] overflow-hidden bg-surface-container-high
                          border-2 border-dashed border-primary/30 group-hover:border-primary/60
                          flex items-center justify-center transition-all">
            {photoUrl ? (
              <Image src={photoUrl} alt="Profielfoto" fill className="object-cover" sizes="112px" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-3xl text-primary/60" aria-hidden="true">
                  {uploading ? 'hourglass_empty' : 'add_a_photo'}
                </span>
                <span className="font-label text-[10px] text-on-surface-variant">
                  {uploading ? 'Uploaden...' : 'Foto'}
                </span>
              </div>
            )}
          </div>
          {photoUrl && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-primary
                            flex items-center justify-center shadow-glow" aria-hidden="true">
              <span className="material-symbols-outlined text-on-primary text-sm">edit</span>
            </div>
          )}
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePhotoUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Persoonlijke info */}
        <FormField label="Naam" error={errors.displayName?.message} required>
          <input
            {...register('displayName')}
            type="text"
            autoComplete="given-name"
            className={inputClass(!!errors.displayName)}
          />
        </FormField>

        <FormField label="Leeftijd" error={errors.age?.message}>
          <input {...register('age')} type="number" min={16} max={99} className={inputClass(!!errors.age)} />
        </FormField>

        {/* Postcode + auto-lookup */}
        <PostcodeVeld
          defaultPostcode={profile.postcode ?? ''}
          defaultCity={profile.city ?? ''}
          onResolved={(r) => setLocation(r)}
          onClear={() => setLocation(null)}
        />

        {/* Zoekradius */}
        <div>
          <label className="block font-label text-sm font-semibold text-on-surface mb-3">
            Zoekradius
            <span className="ml-2 font-normal text-on-surface-variant">
              {radius >= 500 ? 'Heel Nederland' : `${radius} km`}
            </span>
          </label>
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Zoekradius kiezen">
            {RADIUS_PRESETS.map(km => (
              <button
                key={km}
                type="button"
                aria-pressed={radius === km}
                onClick={() => setRadius(km)}
                className={`px-4 py-2 rounded-full border font-label text-xs font-bold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${radius === km
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {km >= 500 ? 'Heel NL' : `${km} km`}
              </button>
            ))}
          </div>
          <p className="mt-2 font-label text-xs text-on-surface-variant">
            Je ziet zeilers binnen {radius >= 500 ? 'heel Nederland' : `${radius} km van ${location?.city ?? 'jouw postcode'}`}.
          </p>
        </div>

        <FormField label="Thuishaven" error={errors.homePort?.message}>
          <input {...register('homePort')} type="text" className={inputClass(!!errors.homePort)} />
        </FormField>

        <FormField label="Bio" error={errors.bio?.message}>
          <textarea
            {...register('bio')}
            rows={3}
            maxLength={300}
            className={`${inputClass(!!errors.bio)} resize-none`}
          />
        </FormField>

        {/* CWO niveau */}
        <div>
          <label className="block font-label text-sm font-semibold text-on-surface mb-1.5">CWO niveau</label>
          <select {...register('cwoLevel')} className={inputClass(!!errors.cwoLevel)}>
            {(Object.entries(CWO_LABELS) as [CWOLevel, string][]).map(([level, label]) => (
              <option key={level} value={level}>{label}</option>
            ))}
          </select>
        </div>

        {/* Vaargebieden */}
        <div>
          <label className="block font-label text-sm font-semibold text-on-surface mb-2">Vaargebieden</label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Vaargebieden selecteren">
            {SAILING_AREAS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={areas.includes(id)}
                onClick={() => toggleArea(id)}
                className={`px-4 py-2 rounded-full border font-label text-xs font-bold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${areas.includes(id)
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Vaardigheden */}
        <div>
          <label className="block font-label text-sm font-semibold text-on-surface mb-2">
            Vaardigheden <span className="text-on-surface-variant font-normal">(optioneel)</span>
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Vaardigheden selecteren">
            {SKILL_TAGS.map(skill => (
              <button
                key={skill}
                type="button"
                aria-pressed={skills.includes(skill)}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2 rounded-xl border font-label text-xs font-semibold transition-all
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${skills.includes(skill)
                    ? 'border-secondary/60 bg-secondary/10 text-secondary'
                    : 'border-white/10 bg-surface-container text-on-surface-variant hover:border-white/20'}`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-error/10 border border-error/20">
            <p className="font-label text-sm text-error">{error}</p>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="w-full py-5 rounded-full gradient-primary text-on-primary
                       font-headline font-extrabold text-lg shadow-glow
                       disabled:opacity-50 active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isSubmitting ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({ label, error, required, children }: {
  label:    string
  error?:   string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block font-label text-sm font-semibold text-on-surface mb-1.5">
        {label}{required && <span className="text-primary ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 font-label text-xs text-error" role="alert">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-3.5 bg-surface-container-high rounded-2xl
    text-on-surface placeholder:text-on-surface-variant/40
    border ${hasError ? 'border-error/50' : 'border-white/10'}
    focus:border-primary/50 font-body text-base
    focus:outline-none focus-visible:ring-1 focus-visible:ring-primary`
}
