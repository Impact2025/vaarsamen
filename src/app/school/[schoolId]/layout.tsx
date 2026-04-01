import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolById, getSchoolMembership } from '@/lib/db/queries/school'
import Link from 'next/link'

interface Props {
  children:  React.ReactNode
  params:    Promise<{ schoolId: string }>
}

export default async function SchoolLayout({ children, params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params
  const [school, membership] = await Promise.all([
    getSchoolById(schoolId),
    getSchoolMembership(schoolId, session.user.id),
  ])

  if (!school || !membership) redirect('/')

  const isInstructeur = membership.role === 'eigenaar' || membership.role === 'instructeur'

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Terug naar VaarSamen"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_back</span>
          </Link>

          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-on-surface text-sm truncate">{school.name}</p>
            <p className="font-label text-[11px] text-primary capitalize">{membership.role}</p>
          </div>

          <nav className="flex items-center gap-1" aria-label="School navigatie">
            {isInstructeur && (
              <Link
                href={`/school/${schoolId}/dashboard`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
                <span className="hidden sm:inline">Overzicht</span>
              </Link>
            )}
            {process.env.ALLOW_DEMO_USERS && (
              <Link
                href="/demo"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label text-xs text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Wissel demo account"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">swap_horiz</span>
                <span className="hidden sm:inline">Demo</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content — full width voor tablet UI */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
