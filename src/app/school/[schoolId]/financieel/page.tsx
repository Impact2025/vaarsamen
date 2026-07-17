import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolById, getSchoolMembership } from '@/lib/db/queries/school'
import { getSchoolFinancieel, periodeVanLabel } from '@/lib/db/queries/school-financieel'
import type { Metadata } from 'next'
import { FinancieelClient } from './FinancieelClient'

interface Props {
  params: Promise<{ schoolId: string }>
}

export const metadata: Metadata = { title: 'Financieel · VaarSamen' }

const MAG_ROLLEN = ['eigenaar', 'instructeur'] as const
function magBekijken(role: string | undefined): boolean {
  return !!role && (MAG_ROLLEN as readonly string[]).includes(role)
}

export default async function FinancieelPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params
  const [school, membership] = await Promise.all([
    getSchoolById(schoolId),
    getSchoolMembership(schoolId, session.user.id),
  ])

  if (!school || !membership) redirect('/')

  // Cursisten (zonder financiele rol) sturen we naar hun vorderingen.
  if (!magBekijken(membership.role)) redirect('/mijn-vorderingen')

  const data = await getSchoolFinancieel(schoolId, periodeVanLabel('dit_jaar'))
  if (!data) redirect('/')

  return (
    <FinancieelClient
      schoolId={schoolId}
      schoolNaam={data.schoolNaam}
      data={data}
    />
  )
}
