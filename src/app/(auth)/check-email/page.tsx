import { cookies } from 'next/headers'
import { signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import Link from 'next/link'

export default async function CheckEmailPage() {
  const cookieStore = await cookies()
  const email = cookieStore.get('vs_pending_email')?.value ?? null

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
                mark_email_read
              </span>
            </div>
          </div>
          <h1 className="font-headline font-black text-3xl text-on-surface">
            Check je inbox!
          </h1>
          <p className="font-body text-on-surface-variant">
            {email ? (
              <>
                We hebben een link gestuurd naar{' '}
                <strong className="text-on-surface break-all">{email}</strong>.
              </>
            ) : (
              'We hebben een inloglink naar je e-mailadres gestuurd.'
            )}
          </p>
        </div>

        {/* Info */}
        <div className="glass-card rounded-card p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              touch_app
            </span>
            <p className="font-body text-sm text-on-surface-variant leading-snug">
              Klik op de link in de mail om direct in te loggen — geen wachtwoord nodig.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              folder_open
            </span>
            <p className="font-body text-sm text-on-surface-variant leading-snug">
              Geen mail? Check je <strong className="text-on-surface">spam</strong> of ongewenste mail.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              schedule
            </span>
            <p className="font-body text-sm text-on-surface-variant leading-snug">
              Mail kan <strong className="text-on-surface">1–2 minuten</strong> onderweg zijn. De link is 24 uur geldig.
            </p>
          </div>
        </div>

        {/* Opnieuw versturen — alleen als e-mail bekend */}
        {email && (
          <form
            action={async () => {
              'use server'
              try {
                const cookieStore = await cookies()
                cookieStore.set('vs_pending_email', email, { maxAge: 600, sameSite: 'lax', path: '/' })
                await signIn('resend', { email, redirectTo: '/onboarding' })
              } catch (e) {
                if (isRedirectError(e)) throw e
                redirect('/login?error=resend')
              }
            }}
          >
            <button
              type="submit"
              className="w-full py-4 rounded-full glass-card border card-border
                         text-on-surface font-headline font-bold text-base text-center
                         active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              Opnieuw versturen
            </button>
          </form>
        )}

        {/* Terug */}
        <p className="text-center font-label text-sm text-on-surface-variant">
          Verkeerd e-mailadres?{' '}
          <Link href="/registreer" className="text-primary font-semibold hover:underline">
            Probeer opnieuw
          </Link>
        </p>

      </div>
    </main>
  )
}
