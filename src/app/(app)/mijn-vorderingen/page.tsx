import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMijnVorderingen } from '@/lib/db/queries/school'
import { VorderingenGrid } from './VorderingenGrid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mijn vorderingen · VaarSamen',
  description: 'Bekijk je vorderingenstaat per cursus',
}

export default async function MijnVorderingenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const vorderingen = await getMijnVorderingen(session.user.id)

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">

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
        vorderingen.map(v => (
          <VorderingenGrid key={v.course.id} vorderingen={v} schoolId={v.school.id} />
        ))
      )}
    </div>
  )
}
