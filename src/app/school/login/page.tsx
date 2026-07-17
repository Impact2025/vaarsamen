import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { auth } from '@/lib/auth'
import { DEMO_ACCOUNTS, DEMO_SCHOOL_ID } from '@/lib/db/seeds/demo'
import { ZWALUW_ACCOUNTS, ZWALUW_SCHOOL_ID } from '@/lib/db/seeds/zwaluw'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Zeilschool inloggen · VaarSamen' }

export default async function SchoolLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect('/school/kies')

  const { error } = await searchParams

  const isDemoEnabled     = !!process.env.DEMO_EMAIL
  const isMultiDemoEnabled = !!process.env.ALLOW_DEMO_USERS

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Minimale header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-on-surface/8">
        <div className="max-w-sm mx-auto px-4 h-14 flex items-center gap-3">
          <a
            href="/"
            className="p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Terug naar VaarSamen"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_back</span>
          </a>
          <p className="font-label text-sm font-semibold text-on-surface-variant">VaarSamen voor zeilscholen</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">

          {/* Header */}
          <div className="text-center space-y-2">
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
              Beheer jouw school
            </h1>
            <p className="font-body text-on-surface-variant">
              Log in als eigenaar of instructeur om je zeilschool te beheren
            </p>
          </div>

          {/* Foutmelding */}
          {error && (
            <div className="rounded-2xl bg-error/10 border border-error/20 px-4 py-3">
              <p className="font-body text-sm text-error text-center">
                {error === 'demo'
                  ? 'Demo login mislukt. Probeer het opnieuw.'
                  : 'Er ging iets mis. Probeer het opnieuw.'}
              </p>
            </div>
          )}

          {/* Login opties */}
          <div className="glass-card rounded-card p-6 space-y-4">
            {/* Google */}
            <form
              action={async () => {
                'use server'
                await signIn('google', { redirectTo: '/school/kies' })
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 py-4 px-6
                           bg-white text-gray-900 rounded-full font-label font-bold
                           border border-black/8 shadow-sm
                           hover:bg-gray-50 active:scale-95 transition-all
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <GoogleIcon />
                Doorgaan met Google
              </button>
            </form>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px divider-line" />
              <span className="font-label text-xs text-on-surface-variant">of</span>
              <div className="flex-1 h-px divider-line" />
            </div>

            {/* Magic link */}
            <form
              action={async (formData: FormData) => {
                'use server'
                const email = formData.get('email') as string
                await signIn('resend', { email, redirectTo: '/school/kies' })
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
                  placeholder="jouw@email.nl"
                  autoComplete="email"
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
                Stuur inloglink
              </button>
            </form>
          </div>

          {/* Multi-demo: eigenaar + instructeur + cursist */}
          {isMultiDemoEnabled && (
            <div className="space-y-3">
              <p className="text-center font-label text-xs text-on-surface-variant uppercase tracking-wider">
                Probeer de demo
              </p>
              {DEMO_ACCOUNTS.map(account => (
                <form
                  key={account.id}
                  action={async () => {
                    'use server'
                    try {
                      const dest = account.label === 'Demo cursist'
                        ? '/mijn-vorderingen'
                        : `/school/${DEMO_SCHOOL_ID}/dashboard`
                      await signIn('demo-user', {
                        userId: account.id,
                        redirectTo: dest,
                      })
                    } catch (e: unknown) {
                      if (isRedirectError(e)) throw e
                      redirect('/school/login?error=demo')
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 py-3 px-5
                               glass-card border border-primary/20 rounded-2xl
                               text-on-surface font-label text-sm
                               hover:border-primary/40 active:scale-95 transition-all
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span
                      className="material-symbols-outlined text-primary text-xl flex-shrink-0"
                      aria-hidden="true"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {account.icon}
                    </span>
                    <div className="text-left min-w-0">
                      <p className="font-semibold truncate">{account.name}</p>
                      <p className="text-on-surface-variant text-xs">{account.label}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-base ml-auto flex-shrink-0" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                </form>
              ))}

              <div className="pt-1">
                <p className="font-label text-xs text-primary font-bold mb-2 uppercase tracking-wider text-center">
                  Zeilschool De Zwaluw
                </p>
                {ZWALUW_ACCOUNTS.map(account => (
                  <form
                    key={account.id}
                    action={async () => {
                      'use server'
                      try {
                        const dest = account.label === 'Demo cursist'
                          ? '/mijn-vorderingen'
                          : `/school/${ZWALUW_SCHOOL_ID}/dashboard`
                        await signIn('demo-user', {
                          userId: account.id,
                          redirectTo: dest,
                        })
                      } catch (e: unknown) {
                        if (isRedirectError(e)) throw e
                        redirect('/school/login?error=demo')
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 py-3 px-5 mb-2
                                 glass-card border border-primary/20 rounded-2xl
                                 text-on-surface font-label text-sm
                                 hover:border-primary/40 active:scale-95 transition-all
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span
                        className="material-symbols-outlined text-primary text-xl flex-shrink-0"
                        aria-hidden="true"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {account.icon}
                      </span>
                      <div className="text-left min-w-0">
                        <p className="font-semibold truncate">{account.name}</p>
                        <p className="text-on-surface-variant text-xs">{account.label}</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-base ml-auto flex-shrink-0" aria-hidden="true">
                        arrow_forward
                      </span>
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {/* Legacy demo (single user) */}
          {isDemoEnabled && !isMultiDemoEnabled && (
            <form
              action={async () => {
                'use server'
                try {
                  await signIn('demo-login', {
                    redirectTo: `/school/${DEMO_SCHOOL_ID}/dashboard`,
                  })
                } catch (e: unknown) {
                  if (isRedirectError(e)) throw e
                  redirect('/school/login?error=demo')
                }
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6
                           glass-card border border-primary/20 rounded-full
                           text-primary font-label font-bold text-sm
                           hover:border-primary/40 active:scale-95 transition-all
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_circle
                </span>
                Bekijk demo zeilschool
              </button>
            </form>
          )}

          {/* Nieuwe school */}
          <div className="text-center space-y-1">
            <p className="font-body text-xs text-on-surface-variant">
              Nog geen account?{' '}
              <a href="/school/nieuw" className="text-primary hover:underline font-semibold">
                Meld je zeilschool aan
              </a>
            </p>
            <p className="font-body text-xs text-on-surface-variant/60">
              Of log in als{' '}
              <a href="/login" className="hover:underline">
                cursist
              </a>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
  )
}
