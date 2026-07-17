'use client'

import { useActionState } from 'react'
import { rondOnboardingAf, type OnboardingState } from './actions'

export default function OnboardingForm({
  token, standaardNaam,
}: { token: string; standaardNaam: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    rondOnboardingAf.bind(null, token),
    {},
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-2xl bg-error/10 border border-error/20 px-4 py-3">
          <p className="font-body text-sm text-error">{state.error}</p>
        </div>
      )}

      <Veld label="Naam" htmlFor="naam">
        <input id="naam" name="naam" required defaultValue={standaardNaam}
               autoComplete="name" className="form-input w-full px-4 py-3 rounded-2xl font-body" />
      </Veld>

      <Veld label="Telefoonnummer" htmlFor="telefoon">
        <input id="telefoon" name="telefoon" required type="tel" autoComplete="tel"
               placeholder="06 12345678"
               className="form-input w-full px-4 py-3 rounded-2xl font-body" />
      </Veld>

      <Veld label="Geboortedatum" htmlFor="geboortedatum" optioneel>
        <input id="geboortedatum" name="geboortedatum" type="date"
               className="form-input w-full px-4 py-3 rounded-2xl font-body" />
      </Veld>

      <Veld label="Noodcontact" htmlFor="noodContact" hint="Naam en telefoonnummer">
        <input id="noodContact" name="noodContact" required
               placeholder="Marieke de Vries — 06 87654321"
               className="form-input w-full px-4 py-3 rounded-2xl font-body" />
      </Veld>

      <Veld label="Zeilervaring" htmlFor="ervaring" optioneel
            hint="Diploma's, jaren ervaring, boten waarmee je overweg kunt">
        <textarea id="ervaring" name="ervaring" rows={3}
                  className="form-input w-full px-4 py-3 rounded-2xl font-body resize-none" />
      </Veld>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="nieuwsbrief" defaultChecked
               className="mt-1 w-4 h-4 rounded accent-primary" />
        <span className="font-body text-sm text-on-surface-variant">
          Houd me op de hoogte via de nieuwsbrief van de school
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="akkoord" required
               className="mt-1 w-4 h-4 rounded accent-primary" />
        <span className="font-body text-sm text-on-surface-variant">
          Ik ga akkoord met de{' '}
          <a href="/voorwaarden" target="_blank" className="text-primary hover:underline">gebruiksvoorwaarden</a>
          {' '}en de{' '}
          <a href="/privacy" target="_blank" className="text-primary hover:underline">privacyverklaring</a>
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 rounded-full gradient-primary text-on-primary
                   font-headline font-bold shadow-glow active:scale-95 transition-all
                   disabled:opacity-60 disabled:active:scale-100
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {pending ? 'Bezig…' : 'Aanmelding versturen'}
      </button>
    </form>
  )
}

function Veld({
  label, htmlFor, hint, optioneel, children,
}: {
  label: string
  htmlFor: string
  hint?: string
  optioneel?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-label text-sm font-bold text-on-surface mb-1.5">
        {label}
        {optioneel && <span className="font-normal text-on-surface-variant"> — optioneel</span>}
      </label>
      {hint && <p className="font-body text-xs text-on-surface-variant mb-2">{hint}</p>}
      {children}
    </div>
  )
}
