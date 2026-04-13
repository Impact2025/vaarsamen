import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'De Boet · Instructeurs inloggen' }

const FEATURES = [
  {
    icon: 'assignment_turned_in',
    title: 'Beoordeel lessen',
    body:  'Registreer AMRB-scores per cursist direct op de telefoon, ook op het water.',
  },
  {
    icon: 'group',
    title: 'Volg voortgang',
    body:  'Zie in één oogopslag hoe ver elke cursist is en wie er aanwezig was.',
  },
  {
    icon: 'directions_boat',
    title: 'Beheer de vloot',
    body:  'Pas de beschikbaarheid van boten aan en bekijk verhuurboekingen.',
  },
  {
    icon: 'flag',
    title: 'Meld schade',
    body:  'Dien een onderhoudsmelding in zodat de eigenaar direct op de hoogte is.',
  },
] as const

const STAPPEN = [
  { nr: '1', label: 'Ga naar vaarsamen.nl/boet' },
  { nr: '2', label: 'Voer de gedeelde pincode in' },
  { nr: '3', label: 'Kies jouw naam uit de lijst' },
  { nr: '4', label: 'Open de les van vandaag' },
] as const

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
    <main className="min-h-dvh bg-surface">
      <div className="max-w-lg mx-auto px-5 pt-10 pb-16 space-y-10">

        {/* Logo + titel */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-[1.5rem] gradient-primary shadow-glow flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                anchor
              </span>
            </div>
          </div>
          <div>
            <h1 className="font-headline font-black text-2xl text-on-surface">Zeilschool De Boet</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Instructeursportaal · VaarSamen
            </p>
          </div>
        </div>

        {/* Wat kun je doen? */}
        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="font-headline font-bold text-base text-on-surface mb-3">
            Wat kun je doen?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.icon} className="glass-card rounded-2xl p-4 space-y-2">
                <span
                  className="material-symbols-outlined text-primary text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {f.icon}
                </span>
                <div>
                  <p className="font-label font-semibold text-on-surface text-sm">{f.title}</p>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Hoe werkt het? */}
        <section aria-labelledby="stappen-heading">
          <h2 id="stappen-heading" className="font-headline font-bold text-base text-on-surface mb-3">
            Hoe werkt het?
          </h2>
          <ol className="space-y-2">
            {STAPPEN.map(s => (
              <li key={s.nr} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-full gradient-primary text-on-primary
                             font-headline font-bold text-xs flex items-center justify-center
                             flex-shrink-0 shadow-glow"
                  aria-hidden="true"
                >
                  {s.nr}
                </span>
                <span className="font-body text-sm text-on-surface">{s.label}</span>
              </li>
            ))}
          </ol>
          <p className="font-body text-xs text-on-surface-variant mt-3 pl-10">
            De pincode is gedeeld door de eigenaar van de school. Kwijt? Vraag Bob Hogervorst.
          </p>
        </section>

        {/* Foutmelding */}
        {error && (
          <div className="rounded-2xl bg-error/10 border border-error/20 px-4 py-3" role="alert">
            <p className="font-body text-sm text-error text-center">
              Verkeerde pincode. Probeer het opnieuw.
            </p>
          </div>
        )}

        {/* PIN formulier */}
        <section aria-labelledby="pin-heading">
          <h2 id="pin-heading" className="font-headline font-bold text-base text-on-surface mb-3">
            Inloggen
          </h2>
          <form
            action={async (formData: FormData) => {
              'use server'
              const pin     = formData.get('pin') as string
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
              Doorgaan
            </button>
          </form>
        </section>

      </div>
    </main>
  )
}
