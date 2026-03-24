'use client'

import { useState, useRef } from 'react'

export interface PostcodeResult {
  postcode: string
  city:     string
  lat:      number
  lng:      number
}

interface PostcodeVeldProps {
  defaultPostcode?: string
  defaultCity?:     string
  onResolved:       (result: PostcodeResult) => void
  onClear?:         () => void
}

export function PostcodeVeld({ defaultPostcode, defaultCity, onResolved, onClear }: PostcodeVeldProps) {
  const [value,   setValue]   = useState(defaultPostcode ?? '')
  const [city,    setCity]    = useState(defaultCity ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lookup = async (raw: string) => {
    const code = raw.replace(/\s/g, '').toUpperCase()
    if (!/^\d{4}[A-Z]{2}$/.test(code)) return

    setLoading(true)
    setError(null)

    try {
      const res  = await fetch(`/api/postcode/${code}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError('Postcode niet gevonden')
        setCity('')
        onClear?.()
        return
      }

      setCity(data.city)
      onResolved({ postcode: data.postcode, city: data.city, lat: data.lat, lng: data.lng })
    } catch {
      setError('Postcode opzoeken mislukt')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setValue(raw)
    setCity('')
    setError(null)
    onClear?.()

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => lookup(raw), 600)
  }

  const inputBase = `w-full px-4 py-3.5 bg-surface-container-high rounded-2xl
    text-on-surface placeholder:text-on-surface-variant/40
    border border-white/10 focus:border-primary/50 font-body text-base
    focus:outline-none focus-visible:ring-1 focus-visible:ring-primary`

  return (
    <div className="space-y-2">
      <label className="block font-label text-sm font-semibold text-on-surface">
        Postcode <span className="text-primary ml-0.5" aria-hidden="true">*</span>
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="1234 AB"
          maxLength={7}
          autoComplete="postal-code"
          aria-label="Postcode"
          aria-describedby={city ? 'postcode-city' : error ? 'postcode-error' : undefined}
          className={`${inputBase} pr-10 ${error ? 'border-error/50' : ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
          {loading && (
            <span className="material-symbols-outlined text-lg text-on-surface-variant animate-spin">
              progress_activity
            </span>
          )}
          {!loading && city && (
            <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          )}
        </div>
      </div>

      {/* Gevonden plaats */}
      {city && !error && (
        <div
          id="postcode-city"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20"
          aria-live="polite"
        >
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">location_on</span>
          <span className="font-label text-sm font-semibold text-primary">{city}</span>
        </div>
      )}

      {/* Foutmelding */}
      {error && (
        <p id="postcode-error" className="font-label text-xs text-error" role="alert">{error}</p>
      )}
    </div>
  )
}
