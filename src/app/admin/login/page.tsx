import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin login · VaarSamen' }

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await auth()
  if (session?.user?.isAdmin) redirect('/admin')

  const { callbackUrl, error } = await searchParams
  const redirectTo = callbackUrl ?? '/admin'

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-amber-400 text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                shield_person
              </span>
            </div>
          </div>
          <h1 className="font-headline font-black text-3xl text-on-surface">
            Platform Admin
          </h1>
          <p className="font-body text-on-surface-variant">
            Alleen voor beheerders met een admin-account
          </p>
        </div>

        {/* Foutmelding */}
        {error && (
          <div className="rounded-2xl bg-error/10 border border-error/20 px-4 py-3">
            <p className="font-body text-sm text-error text-center">
              {error === 'pw'
                ? 'Onjuist e-mailadres of wachtwoord, of geen admin-rechten.'
                : 'Er ging iets mis. Probeer het opnieuw.'}
            </p>
          </div>
        )}

        {/* Wachtwoord-formulier (admin-password provider) */}
        <div className="glass-card rounded-card p-6 space-y-4">
          <form
            action={async (formData: FormData) => {
              'use server'
              const email = (formData.get('email') as string) ?? ''
              const password = (formData.get('password') as string) ?? ''
              try {
                await signIn('admin-password', { email, password, redirectTo })
              } catch (e: unknown) {
                if (isRedirectError(e)) throw e
                redirect('/admin/login?error=pw')
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
                placeholder="admin@vaarsamen.nl"
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
              className="w-full py-4 rounded-full bg-amber-500 text-on-primary
                         font-headline font-bold shadow-glow
                         active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Inloggen als admin
            </button>
          </form>
        </div>

        <p className="text-center font-label text-xs text-on-surface-variant/60">
          Geen admin-account?{' '}
          <a href="/login" className="hover:underline">Naar de leden-login</a>
        </p>
      </div>
    </div>
  )
}
