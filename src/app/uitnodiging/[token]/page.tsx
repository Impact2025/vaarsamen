import { auth, signIn } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, schoolMemberships } from '@/lib/db/schema'
import { getGeldigeUitnodiging } from '@/lib/db/queries/uitnodiging'
import { and, eq, isNull } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import OnboardingForm from './OnboardingForm'

export const metadata: Metadata = { title: 'Uitnodiging · VaarSamen' }

const ROL_LABEL: Record<string, string> = {
  lid:         'lid',
  cursist:     'cursist',
  instructeur: 'instructeur',
  klusser:     'klusser',
  eigenaar:    'eigenaar',
}

export default async function UitnodigingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invite = await getGeldigeUitnodiging(token)

  if (!invite) return <Kaart titel="Uitnodiging niet geldig">
    <p className="font-body text-on-surface-variant">
      Deze uitnodiging bestaat niet, is verlopen of is al gebruikt. Vraag de school om een nieuwe.
    </p>
  </Kaart>

  const session = await auth()

  // Nog niet ingelogd: inloglink sturen naar het uitgenodigde adres. Daarmee is
  // meteen bewezen dat de ontvanger bij dat adres kan, en komt hij terug op deze pagina.
  if (!session?.user?.id) {
    return (
      <Kaart titel={`Uitnodiging van ${invite.schoolNaam}`}>
        <p className="font-body text-on-surface-variant mb-6">
          Je bent uitgenodigd als {ROL_LABEL[invite.role] ?? 'lid'}. Log in met{' '}
          <strong className="text-on-surface">{invite.email}</strong> om je aanmelding af te ronden.
        </p>
        <form
          action={async () => {
            'use server'
            const cookieStore = await cookies()
            cookieStore.set('vs_pending_email', invite.email!, { maxAge: 600, sameSite: 'lax', path: '/' })
            await signIn('resend', { email: invite.email!, redirectTo: `/uitnodiging/${token}` })
          }}
        >
          <button
            type="submit"
            className="w-full py-4 rounded-full gradient-primary text-on-primary
                       font-headline font-bold shadow-glow active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Stuur mij een inloglink
          </button>
        </form>
      </Kaart>
    )
  }

  const [ik] = await db
    .select({ email: users.email, name: users.name })
    .from(users).where(eq(users.id, session.user.id)).limit(1)

  // Ingelogd op een ander account dan waarvoor de uitnodiging bedoeld is
  if (!ik || ik.email.toLowerCase() !== invite.email!.toLowerCase()) {
    return (
      <Kaart titel="Verkeerd account">
        <p className="font-body text-on-surface-variant">
          Deze uitnodiging is bedoeld voor <strong className="text-on-surface">{invite.email}</strong>,
          maar je bent ingelogd als <strong className="text-on-surface">{ik?.email}</strong>.
        </p>
        <p className="font-body text-on-surface-variant mt-3">
          Log uit en open de link opnieuw, of vraag de school om een uitnodiging voor dit adres.
        </p>
      </Kaart>
    )
  }

  // Al eerder aangemeld bij deze school
  const [bestaand] = await db
    .select({ status: schoolMemberships.status })
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, invite.schoolId),
      eq(schoolMemberships.userId, session.user.id),
      isNull(schoolMemberships.deletedAt),
    ))
    .limit(1)

  if (bestaand && bestaand.status !== 'afgewezen') {
    redirect(`/uitnodiging/${token}/bedankt`)
  }

  return (
    <Kaart titel={`Welkom bij ${invite.schoolNaam}`}>
      <p className="font-body text-on-surface-variant mb-6">
        Je bent uitgenodigd als {ROL_LABEL[invite.role] ?? 'lid'}. Vul je gegevens in;
        de school beoordeelt daarna je aanmelding.
      </p>
      <OnboardingForm token={token} standaardNaam={ik.name ?? invite.naam ?? ''} />
    </Kaart>
  )
}

function Kaart({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-[1.25rem] gradient-primary shadow-glow flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
              sailing
            </span>
          </div>
        </div>
        <div className="glass-card rounded-card p-6">
          <h1 className="font-headline font-black text-2xl text-on-surface tracking-tight mb-4">
            {titel}
          </h1>
          {children}
        </div>
      </div>
    </main>
  )
}
