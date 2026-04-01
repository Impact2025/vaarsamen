import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NieuweSchoolClient } from './NieuweSchoolClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Zeilschool aanmelden · VaarSamen',
}

export default async function NieuweSchoolPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Minimale header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <a
            href="/"
            className="p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Terug naar VaarSamen"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_back</span>
          </a>
          <p className="font-headline font-bold text-on-surface">Zeilschool aanmelden</p>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <NieuweSchoolClient />
      </main>
    </div>
  )
}
