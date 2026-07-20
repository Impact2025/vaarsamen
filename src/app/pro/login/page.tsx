import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Zeilschool login · VaarSamen' }

export default async function ProLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await auth()
  // Al ingelogd als staff? direct door naar /pro
  if (session?.user?.id) {
    // (role-check gebeurt in de /pro layout; hier enkel voorkomen dat een
    //  al-ingelogde gebruiker de login opnieuw ziet)
  }

  const { callbackUrl, error } = await searchParams
  const redirectTo = callbackUrl ?? '/pro'

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-[1.5rem] gradient-primary shadow-glow flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                school
              </span>
            </div>
          </div>
          <h1 className="font-headline font-black text-3xl text-on-surface">
            Zeilschool beheer
          </h1>
          <p className="font-body text-on-surface-variant">
            Inloggen als eigenaar of instructeur
          </p>
        </div>

        {/* Foutmelding */}
        {error && (
          <div className="rounded-2xl bg-error/10 border border-error/20 px-4 py-3">
            <p className="font-body text-sm text-error text-center">
              {error === 'pw'
                ? 'Onjuist e-mailadres of wachtwoord, of geen eigenaar/instructeur-account.'
                : 'Er ging iets mis. Probeer het opnieuw.'}
            </p>
          </div>
        )}

        {/* Wachtwoord-formulier (school-password provider) */}
        <div className="glass-card rounded-card p-6 space-y-4">
          <form
            action={async (formData: FormData) => {
              'use server'
              const email = (formData.get('email') as string) ?? ''
              const password = (formData.get('password') as string) ?? ''
              try {
                await signIn('school-password', { email, password, redirectTo })
              } catch (e: unknown) {
                if (isRedirectError(e)) throw e
                redirect('/pro/login?error=pw')
              }
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="email" className="sr-only">E-mailadres</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="jij@zeilschool.nl"
                autoComplete="email"
                className="form-input w-full px-4 py-4 rounded-2xl font-body text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Wachtwoord</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Wachtwoord"
                autoComplete="current-password"
                className="form-input w-full px-4 py-4 rounded-2xl font-body text-base"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-full gradient-primary text-on-primary
                         font-headline font-bold shadow-glow
                         active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Inloggen als school
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px divider-line" />
            <span className="font-label text-xs text-on-surface-variant">of</span>
            <div className="flex-1 h-px divider-line" />
          </div>

          {/* Magic link voor instructeurs & leden */}
          <form
            action={async (formData: FormData) => {
              'use server'
              const email = (formData.get('email_magic') as string) ?? ''
              if (!email) return
              await signIn('resend', { email, redirectTo: '/school/kies' })
            }}
            className="space-y-3"
          >
            <p className="font-label text-xs text-on-surface-variant text-center">
              Instructeur of lid zonder wachtwoord? Gebruik de inloglink.
            </p>
            <div>
              <label htmlFor="email_magic" className="sr-only">E-mailadres</label>
              <input
                id="email_magic"
                name="email_magic"
                type="email"
                placeholder="jij@zeilschool.nl"
                autoComplete="email"
                className="form-input w-full px-4 py-4 rounded-2xl font-body text-base"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-full border border-primary/30 text-primary
                         font-headline font-bold
                         active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Stuur inloglink
            </button>
          </form>
        </div>

        <p className="text-center font-label text-xs text-on-surface-variant/60">
          Nog geen account?{' '}
          <a href="/school/nieuw" className="hover:underline">Meld je zeilschool aan</a>
        </p>
      </div>
    </div>
  )
}
