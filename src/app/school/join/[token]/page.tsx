import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { schoolInvites, sailingSchools } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { JoinClient } from './JoinClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uitnodiging zeilschool · VaarSamen',
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Haal invite + school op (server-side, vóór auth check)
  const [row] = await db
    .select({
      invite: schoolInvites,
      school: sailingSchools,
    })
    .from(schoolInvites)
    .innerJoin(sailingSchools, eq(schoolInvites.schoolId, sailingSchools.id))
    .where(and(
      eq(schoolInvites.token, token),
      isNull(schoolInvites.deletedAt),
      isNull(sailingSchools.deletedAt),
    ))
    .limit(1)

  const invalid =
    !row ||
    (row.invite.expiresAt !== null && row.invite.expiresAt < new Date()) ||
    (row.invite.maxUses !== null && row.invite.usedCount >= row.invite.maxUses)

  const session = await auth()

  // Niet ingelogd → stuur naar login met redirect param
  if (!session?.user?.id && !invalid) {
    redirect(`/school/login?callbackUrl=/school/join/${token}`)
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <a
            href="/"
            className="p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Naar VaarSamen"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">sailing</span>
          </a>
          <p className="font-headline font-bold text-on-surface">VaarSamen</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {invalid ? (
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40" aria-hidden="true">
                link_off
              </span>
              <div>
                <h1 className="font-headline font-bold text-xl text-on-surface">Link niet geldig</h1>
                <p className="font-body text-sm text-on-surface-variant mt-2">
                  Deze uitnodigingslink is verlopen, al vol of bestaat niet.
                  Vraag je instructeur om een nieuwe link.
                </p>
              </div>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface-container border border-white/10 font-label font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Naar VaarSamen
              </a>
            </div>
          ) : (
            <JoinClient
              token={token}
              schoolName={row!.school.name}
              schoolCity={row!.school.city}
              role={row!.invite.role}
              label={row!.invite.label}
              isLoggedIn={!!session?.user?.id}
            />
          )}
        </div>
      </main>
    </div>
  )
}
