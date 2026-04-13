import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'De Boet · Instructeurs inloggen' }

export default async function BoetLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const cookieStore = await cookies()
  if (cookieStore.get('boet_access')?.value === 'ok') {
    redirect('/boet/kies')
  }

  const { error } = await searchParams

  return (
    <main className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-[1.5rem] gradient-primary shadow-glow flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                anchor
              </span>
            </div>
          </div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Zeilschool De Boet</h1>
          <p className="font-body text-sm text-on-surface-variant">
            Voer de pincode in om door te gaan
          </p>
        </div>

        {/* Foutmelding */}
        {error && (
          <div className="rounded-2xl bg-error/10 border border-error/20 px-4 py-3">
            <p className="font-body text-sm text-error text-center">
              Verkeerde pincode. Probeer het opnieuw.
            </p>
          </div>
        )}

        {/* PIN formulier */}
        <form
          action={async (formData: FormData) => {
            'use server'
            const pin = formData.get('pin') as string
            const correct = process.env.BOET_PIN?.trim()
            if (!correct || pin.trim() !== correct) {
              redirect('/boet?error=1')
            }
            const store = await cookies()
            store.set('boet_access', 'ok', {
              httpOnly: true,
              sameSite: 'lax',
              maxAge:   60 * 60 * 10, // 10 uur
              path:     '/',
            })
            redirect('/boet/kies')
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="pin" className="sr-only">Pincode</label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              required
              placeholder="••••"
              className="w-full px-5 py-5 text-center text-3xl tracking-[0.6em]
                         bg-surface-container-high rounded-2xl
                         text-on-surface placeholder:text-on-surface-variant/30
                         border border-white/10 focus:border-primary/50
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
            Inloggen
          </button>
        </form>

      </div>
    </main>
  )
}
