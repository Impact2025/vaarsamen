import { signIn, signOut, auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DEMO_ACCOUNTS, DEMO_SCHOOL_ID, DEMO_CURSIST_LISA } from '@/lib/db/seeds/demo'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Demo · VaarSamen Zeilschool' }

export default async function DemoPage() {
  const session = await auth()

  return (
    <main className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-[1.25rem] gradient-primary shadow-glow flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                school
              </span>
            </div>
          </div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Demo zeilschool</h1>
          <p className="font-body text-sm text-on-surface-variant">
            Kies een account om de demo te verkennen
          </p>
        </div>

        {/* Huidig ingelogd */}
        {session?.user && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-label text-sm font-semibold text-on-surface truncate">
                {session.user.name ?? session.user.email}
              </p>
              <p className="font-label text-xs text-on-surface-variant">Huidig ingelogd</p>
            </div>
            <form action={async () => {
              'use server'
              await signOut({ redirectTo: '/demo' })
            }}>
              <button type="submit"
                className="px-3 py-1.5 rounded-xl bg-surface-container font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                Uitloggen
              </button>
            </form>
          </div>
        )}

        {/* Demo accounts */}
        <div className="space-y-3">
          {/* Instructeur */}
          <form action={async () => {
            'use server'
            await signIn('demo-user', {
              userId:     DEMO_ACCOUNTS[0].id,
              redirectTo: `/school/${DEMO_SCHOOL_ID}/dashboard`,
            })
          }}>
            <button type="submit"
              className="w-full flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/8
                         hover:border-primary/30 active:scale-[0.98] transition-all text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                  person_check
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-on-surface text-sm">Petra Smit</p>
                <p className="font-label text-xs text-primary font-semibold">Instructeur</p>
                <p className="font-label text-[11px] text-on-surface-variant mt-0.5">
                  Beoordelingen invullen · Lessen beheren
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 flex-shrink-0" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </form>

          {/* Cursist */}
          <form action={async () => {
            'use server'
            await signIn('demo-user', {
              userId:     DEMO_ACCOUNTS[1].id,
              redirectTo: `/school/${DEMO_SCHOOL_ID}/cursist/${DEMO_CURSIST_LISA}/vorderingen`,
            })
          }}>
            <button type="submit"
              className="w-full flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/8
                         hover:border-primary/30 active:scale-[0.98] transition-all text-left">
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl" aria-hidden="true"
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-on-surface text-sm">Lisa van der Berg</p>
                <p className="font-label text-xs text-on-surface-variant font-semibold">Cursist</p>
                <p className="font-label text-[11px] text-on-surface-variant mt-0.5">
                  Eigen vorderingenstaat bekijken
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/40 flex-shrink-0" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </form>
        </div>

        <p className="text-center font-label text-[11px] text-on-surface-variant/50">
          Demo data · Zeilschool De Boet · Loosdrecht
        </p>
      </div>
    </main>
  )
}
