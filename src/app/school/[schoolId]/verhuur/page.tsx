import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { db } from '@/lib/db'
import { sailingSchools, schoolFleet } from '@/lib/db/schema'
import { and, eq, isNull, asc } from 'drizzle-orm'
import { VerhuurClient } from './VerhuurClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Bootverhuur · VaarSamen' }

export default async function VerhuurPage({
  params,
}: {
  params: Promise<{ schoolId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params

  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) redirect('/')

  const [school] = await db
    .select()
    .from(sailingSchools)
    .where(and(eq(sailingSchools.id, schoolId), isNull(sailingSchools.deletedAt)))
    .limit(1)
  if (!school) redirect('/')

  const vloot = await db
    .select()
    .from(schoolFleet)
    .where(and(eq(schoolFleet.schoolId, schoolId), isNull(schoolFleet.deletedAt)))
    .orderBy(asc(schoolFleet.bootNummer))

  const isStaff = ['eigenaar', 'instructeur'].includes(membership.role)

  return (
    <VerhuurClient
      schoolId={schoolId}
      schoolNaam={school.name}
      vloot={vloot.map(b => ({ id: b.id, bootNummer: b.bootNummer, naam: b.naam }))}
      isStaff={isStaff}
      tarieven={school.verhuurTarieven as import('./VerhuurClient').VerhuurTarieven | null}
    />
  )
}
