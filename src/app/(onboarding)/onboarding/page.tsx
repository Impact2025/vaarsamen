'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { PostcodeVeld, type PostcodeResult } from '@/components/ui/PostcodeVeld'

const schema = z.object({
  displayName: z.string().min(2, 'Naam moet minimaal 2 tekens zijn').max(50),
  homePort:    z.string().max(100).optional(),
  bio:         z.string().max(300).optional(),
})

type FormData = z.infer<typeof schema>

export default function OnboardingStap1() {
  const router = useRouter()
  const [photoUrl,  setPhotoUrl]  = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [location,  setLocation]  = useState<PostcodeResult | null>(null)
  const [postcodeError, setPostcodeError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) setPhotoUrl(data.url)
    } catch {
      alert('Upload mislukt, probeer opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!location) {
      setPostcodeError('Voer een geldige postcode in')
      return
    }
    localStorage.setItem('onboarding_stap1', JSON.stringify({
      ...data,
      photoUrl,
      postcode: location.postcode,
      city:     location.city,
      lat:      location.lat,
      lng:      location.lng,
    }))
    router.push('/onboarding/niveau')
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-8">
      <OnboardingProgress stap={1} totaal={5} />

      <div className="mt-8 mb-10">
        <h1 className="font-headline font-black text-4xl text-on-surface">
          Wie ben jij?
        </h1>
        <p className="font-body text-on-surface-variant mt-2">
          Vertel andere zeilers wie ze kunnen verwachten aan boord.
        </p>
      </div>

      {/* Foto upload */}
      <div className="flex justify-center mb-8">
        <label
          htmlFor="photo-upload"
          className="relative cursor-pointer group"
          aria-label="Profielfoto uploaden"
        >
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
        <FormField label="Naam" error={errors.displayName?.message} required>
          <input
            {...register('displayName')}
            type="text"
            placeholder="bijv. Pieter"
            autoComplete="given-name"
            className={inputClass(!!errors.displayName)}
          />
        </FormField>

        <PostcodeVeld
          onResolved={(r) => { setLocation(r); setPostcodeError(null) }}
          onClear={() => setLocation(null)}
        />
        {postcodeError && (
          <p className="font-label text-xs text-error -mt-2" role="alert">{postcodeError}</p>
        )}

        <FormField label="Thuishaven" error={errors.homePort?.message}>
          <input
            {...register('homePort')}
            type="text"
            placeholder="bijv. WSV De Pelikaan"
            className={inputClass(!!errors.homePort)}
          />
        </FormField>

        <FormField label="Bio" error={errors.bio?.message}>
          <textarea
            {...register('bio')}
            placeholder="Vertel iets over je zeilervaringen, favoriete vaarwater..."
            rows={3}
            maxLength={300}
            className={`${inputClass(!!errors.bio)} resize-none`}
          />
        </FormField>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 rounded-full gradient-primary text-on-primary
                       font-headline font-extrabold text-lg shadow-glow
                       disabled:opacity-50 active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Volgende →
          </button>
        </div>
      </form>
    </main>
  )
}

function OnboardingProgress({ stap, totaal }: { stap: number; totaal: number }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-label text-xs text-on-surface-variant">Stap {stap} van {totaal}</span>
        <span className="font-label text-xs text-primary">{Math.round((stap / totaal) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden" role="progressbar" aria-valuenow={stap} aria-valuemin={1} aria-valuemax={totaal}>
        <div
          className="h-full gradient-primary rounded-full transition-all duration-500"
          style={{ width: `${(stap / totaal) * 100}%` }}
        />
      </div>
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
