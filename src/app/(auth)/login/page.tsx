import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'
import { DEMO_ACCOUNTS, DEMO_SCHOOL_ID } from '@/lib/db/seeds/demo'

// Drie demo-rollen: zeilschool, instructeur en zeiler — elk met eigen dashboard
const [DEMO_EIGENAAR, DEMO_INSTRUCTEUR, DEMO_CURSIST] = DEMO_ACCOUNTS
const DEMO_ROLES = [
  { userId: DEMO_EIGENAAR.id,    label: 'zeilschool',  icon: DEMO_EIGENAAR.icon,    dest: `/school/${DEMO_SCHOOL_ID}/dashboard` },
  { userId: DEMO_INSTRUCTEUR.id, label: 'instructeur', icon: DEMO_INSTRUCTEUR.icon, dest: `/school/${DEMO_SCHOOL_ID}/dashboard` },
  { userId: DEMO_CURSIST.id,     label: 'zeiler',      icon: DEMO_CURSIST.icon,     dest: '/mijn-vorderingen' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  let session: { user?: { id?: string } } | null = null
  try {
    session = await auth()
  } catch {
    // Corrupt/verlopen sessie-cookie mag de login-pagina niet laten crashen
    session = null
  }
  if (session?.user?.id) redirect('/ontdekken')

  const { callbackUrl, error } = await searchParams
  const redirectTo    = callbackUrl ?? '/ontdekken'
  const isRegistering = callbackUrl === '/onboarding'

  const isMultiDemoEnabled = !!process.env.ALLOW_DEMO_USERS

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo + header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-[1.5rem] gradient-primary shadow-glow flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                sailing
              </span>
            </div>
          </div>
          <h1 className="font-headline font-black text-3xl text-on-surface tracking-tight">
            {isRegistering ? 'Maak een account' : 'Welkom terug'}
          </h1>
          <p className="font-body text-on-surface-variant">
            {isRegistering
              ? 'Vind jouw zeilmaatje in een paar minuten'
              : 'Log in om verder te gaan met VaarSamen'}
          </p>
        </div>

        {/* Foutmelding */}
        {error && (
          <div className="rounded-2xl bg-error/10 border border-error/20 px-4 py-3">
            <p className="font-body text-sm text-error text-center">
              {error === 'demo'
                ? 'Demo login mislukt. Probeer het opnieuw.'
                : error === 'google'
                  ? 'Inloggen met Google is momenteel niet beschikbaar. Gebruik de magic-link of een demo-account.'
                  : error === 'pw'
                    ? 'Onjuist e-mailadres of wachtwoord.'
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
              try {
                await signIn('google', { redirectTo })
              } catch (e: unknown) {
                if (isRedirectError(e)) throw e
                // OAuth-mislukt (bv. redirect_uri mismatch / geblokkeerd door Google):
                // terug naar login met een leesbare fout i.p.v. dode error-pagina.
                redirect('/login?error=google')
              }
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
              const cookieStore = await cookies()
              cookieStore.set('vs_pending_email', email, { maxAge: 600, sameSite: 'lax', path: '/' })
              await signIn('resend', { email, redirectTo })
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
              {isRegistering ? 'Stuur registratielink' : 'Stuur inloglink'}
            </button>
          </form>

          {/* Admin / zeilschool met wachtwoord? aparte loginpagina's */}
          <div className="pt-2 text-center space-y-1">
            <p className="font-body text-xs text-on-surface-variant/70">
              Beheerder?{' '}
              <a href="/admin/login" className="text-amber-400 hover:underline font-semibold">Admin login</a>
            </p>
            <p className="font-body text-xs text-on-surface-variant/70">
              Zeilschool-eigenaar?{' '}
              <a href="/pro/login" className="text-primary hover:underline font-semibold">School login</a>
            </p>
          </div>
        </div>

        <p className="text-center font-label text-xs text-on-surface-variant">
          Door in te loggen ga je akkoord met onze{' '}
          <a href="/privacy" className="text-primary hover:underline">privacyverklaring</a>
          {' '}en{' '}
          <a href="/voorwaarden" className="text-primary hover:underline">gebruiksvoorwaarden</a>.
          Minimale leeftijd: 16 jaar.
        </p>

        {/* Demo: één knop per rol, elk naar het eigen dashboard */}
        {isMultiDemoEnabled && (
          <div className="space-y-2">
            {DEMO_ROLES.map((role) => (
              <form
                key={role.userId}
                action={async () => {
                  'use server'
                  try {
                    await signIn('demo-user', { userId: role.userId, redirectTo: role.dest })
                  } catch (e: unknown) {
                    if (isRedirectError(e)) throw e
                    redirect('/login?error=demo')
                  }
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6
                             glass-card border card-border rounded-full
                             text-primary font-label font-bold text-sm
                             hover:shadow-sm active:scale-95 transition-all
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                    {role.icon}
                  </span>
                  Inloggen als {role.label}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </main>
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
