import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/ontdekken')

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
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
          <h1 className="font-headline font-black text-3xl text-on-surface">
            Welkom terug
          </h1>
          <p className="font-body text-on-surface-variant">
            Log in om verder te gaan met VaarSamen
          </p>
        </div>

        {/* Login opties */}
        <div className="glass-card rounded-card p-6 space-y-4">
          {/* Google */}
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/ontdekken' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-4 px-6
                         bg-white text-gray-900 rounded-full font-label font-bold
                         hover:bg-gray-50 active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <GoogleIcon />
              Doorgaan met Google
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-label text-xs text-on-surface-variant">of</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Magic link */}
          <form
            action={async (formData: FormData) => {
              'use server'
              const email = formData.get('email') as string
              await signIn('resend', { email, redirectTo: '/ontdekken' })
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
                className="w-full px-4 py-4 bg-surface-container-high rounded-2xl
                           text-on-surface placeholder:text-on-surface-variant/50
                           border border-white/10 focus:border-primary/50
                           font-body text-base
                           focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
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

        <p className="text-center font-label text-xs text-on-surface-variant">
          Door in te loggen ga je akkoord met onze{' '}
          <a href="/privacy" className="text-primary hover:underline">privacyverklaring</a>
          {' '}en{' '}
          <a href="/voorwaarden" className="text-primary hover:underline">gebruiksvoorwaarden</a>.
          Minimale leeftijd: 16 jaar.
        </p>

        {/* Dev-only: directe login zonder email */}
        {isDev && (
          <div className="glass-card rounded-2xl p-4 border border-primary/20">
            <p className="font-label text-xs text-primary font-bold mb-3 uppercase tracking-wider">
              Dev login
            </p>
            <form
              action={async (formData: FormData) => {
                'use server'
                const email = formData.get('email') as string
                await signIn('dev-login', { email, redirectTo: '/ontdekken' })
              }}
              className="flex gap-2"
            >
              <label htmlFor="dev-email" className="sr-only">Email dev login</label>
              <input
                id="dev-email"
                name="email"
                type="email"
                defaultValue="v.munster@weareimpact.nl"
                className="flex-1 px-3 py-2.5 bg-surface-container-high rounded-xl
                           text-on-surface text-sm font-body border border-white/10
                           focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl gradient-primary text-on-primary
                           font-label text-sm font-bold shadow-glow
                           active:scale-95 transition-all"
              >
                Login
              </button>
            </form>
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
