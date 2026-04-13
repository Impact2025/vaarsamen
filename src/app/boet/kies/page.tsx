import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { signIn } from '@/lib/auth'
import { BOET_INSTRUCTEURS, DEMO_SCHOOL_ID } from '@/lib/db/seeds/demo'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'De Boet · Kies instructeur' }

async function kiesInstructeur(formData: FormData) {
  'use server'
  const userId = formData.get('userId') as string | null
  if (!userId) redirect('/boet')

  try {
    await signIn('demo-user', {
      userId,
      redirectTo: `/school/${DEMO_SCHOOL_ID}/dashboard`,
    })
  } catch (e: unknown) {
    if (isRedirectError(e)) throw e
    redirect('/boet?error=1')
  }
}

async function uitloggen() {
  'use server'
  const store = await cookies()
  store.delete('boet_access')
  redirect('/boet')
}

export default async function BoetKiesPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('boet_access')?.value !== 'ok') {
    redirect('/boet')
  }

  return (
    <main className="min-h-dvh bg-surface p-6">
      <div className="max-w-lg mx-auto space-y-6 pb-10">

        {/* Header */}
        <div className="text-center space-y-1 pt-6">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
            Zeilschool De Boet
          </p>
          <h1 className="font-headline font-black text-2xl text-on-surface">Wie ben jij?</h1>
          <p className="font-body text-sm text-on-surface-variant">
            Kies jouw naam om door te gaan naar de beoordeling
          </p>
        </div>

        {/* Instructeursraster */}
        <div className="grid grid-cols-2 gap-3">
          {BOET_INSTRUCTEURS.map(instr => (
            <form key={instr.id} action={kiesInstructeur}>
              <input type="hidden" name="userId" value={instr.id} />
              <button
                type="submit"
                className="w-full px-4 py-4 glass-card rounded-2xl border border-white/8
                           hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                aria-label={`Inloggen als ${instr.name}`}
              >
                <p className="font-label font-semibold text-on-surface text-sm leading-snug">
                  {instr.name}
                </p>
                <p className="font-label text-xs text-primary mt-0.5">Instructeur</p>
              </button>
            </form>
          ))}
        </div>

        {/* Terug */}
        <form action={uitloggen}>
          <button
            type="submit"
            className="w-full py-3 text-center font-label text-sm text-on-surface-variant
                       hover:text-on-surface transition-colors"
          >
            ← Andere pincode invoeren
          </button>
        </form>

      </div>
    </main>
  )
}
