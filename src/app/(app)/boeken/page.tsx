import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSailorSchool, getFleetVoorSchool, getMijnBootreserveringen } from '@/lib/db/queries/school'
import { BoekenClient } from './BoekenClient'

export const dynamic = 'force-dynamic'

export default async function BoekenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const school = await getSailorSchool(session.user.id)
  if (!school) {
    return (
      <div className="px-4 pt-6 pb-28">
        <h1 className="font-headline font-black text-2xl text-on-surface">Boot reserveren</h1>
        <p className="mt-4 text-on-surface-variant">
          Je zit nog bij geen zeilschool. Meld je aan bij een school om een boot te reserveren.
        </p>
      </div>
    )
  }

  const [vloot, mijn] = await Promise.all([
    getFleetVoorSchool(school.schoolId),
    getMijnBootreserveringen(session.user.id, school.schoolId),
  ])

  return (
    <BoekenClient
      schoolId={school.schoolId}
      schoolNaam={school.schoolNaam}
      magReserveren={school.status === 'goedgekeurd'}
      status={school.status}
      vloot={vloot}
      mijnReserveringen={mijn}
    />
  )
}
