import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMijnVorderingen } from '@/lib/db/queries/school'
import { VorderingenGrid } from './VorderingenGrid'
import { SchoolBerichten } from './SchoolBerichten'
import { CursistTour } from '@/components/onboarding/CursistTour'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mijn vorderingen · VaarSamen',
  description: 'Bekijk je vorderingenstaat per cursus',
}

export default async function MijnVorderingenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const vorderingen = await getMijnVorderingen(session.user.id)

  // Groepeer cursussen per school zodat berichten slechts één keer per school getoond worden
  const schoolMap = new Map<string, { naam: string; cursussen: typeof vorderingen }>()
  for (const v of vorderingen) {
    const sid = v.school.id
    if (!schoolMap.has(sid)) schoolMap.set(sid, { naam: v.school.name, cursussen: [] })
    schoolMap.get(sid)!.cursussen.push(v)
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">

      {/* Welkomstour cursist — eenmalig */}
      <CursistTour />

      {/* Header */}
      <div>
        <h1 className="font-headline font-black text-2xl text-on-surface">Mijn vorderingen</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Jouw voortgang per cursus, bijgehouden door je instructeurs
        </p>
      </div>

      {vorderingen.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40" aria-hidden="true">
            school
          </span>
          <div>
            <p className="font-headline font-semibold text-on-surface">Nog geen lessen gevolgd</p>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Zodra je instructeur een les registreert, zie je hier je vorderingen.
            </p>
          </div>
        </div>
      ) : (
        [...schoolMap.entries()].map(([schoolId, { naam, cursussen }]) => (
          <div key={schoolId} className="space-y-4">
            {cursussen.map(v => (
              <VorderingenGrid key={v.course.id} vorderingen={v} schoolId={schoolId} />
            ))}
            <SchoolBerichten
              schoolId={schoolId}
              schoolNaam={naam}
              myUserId={session.user.id}
            />
          </div>
        ))
      )}
    </div>
  )
}
