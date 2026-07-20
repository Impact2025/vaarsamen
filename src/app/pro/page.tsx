import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMySchools } from '@/lib/db/queries/school'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mijn zeilscholen · VaarSamen' }

export default async function ProDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/pro/login')

  const scholen = await getMySchools(session.user.id)
  const staffScholen = scholen.filter(s => s.role === 'eigenaar' || s.role === 'instructeur')

  if (staffScholen.length === 0) {
    // Ingelogd maar geen staff-lidmaatschap → mag niet op /pro
    redirect('/school/kies')
  }

  // Één school → direct door naar de school-beheer
  if (staffScholen.length === 1) {
    redirect(`/school/${staffScholen[0].id}/dashboard`)
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-[1.25rem] gradient-primary shadow-glow flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                school
              </span>
            </div>
          </div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Mijn zeilscholen</h1>
          <p className="font-body text-sm text-on-surface-variant">
            Kies een school om te beheren
          </p>
        </div>

        <div className="space-y-2">
          {staffScholen.map(school => (
            <Link
              key={school.id}
              href={`/school/${school.id}/dashboard`}
              className="flex items-center gap-3 p-4 glass-card rounded-2xl border border-white/8
                         hover:border-primary/30 hover:bg-surface-container-high/60 transition-all"
            >
              <div className="w-10 h-10 rounded-xl gradient-primary/20 border border-primary/20
                              flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">
                  sailing
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-headline font-bold text-on-surface text-sm truncate">{school.name}</p>
                <p className="font-label text-xs text-on-surface-variant capitalize">{school.role}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/50 text-xl" aria-hidden="true">
                chevron_right
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/school/nieuw"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full
                     border border-white/10 text-on-surface-variant font-label text-sm
                     hover:border-primary/30 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">add</span>
          Nieuwe school aanmelden
        </Link>
      </div>
    </div>
  )
}
