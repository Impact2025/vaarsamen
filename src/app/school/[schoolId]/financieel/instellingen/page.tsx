import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolById, getSchoolMembership } from '@/lib/db/queries/school'
import type { SchoolFinancieelConfig } from '@/lib/db/queries/school-financieel'
import type { Metadata } from 'next'
import { FinInstellingenClient } from './FinInstellingenClient'

interface Props {
  params: Promise<{ schoolId: string }>
}

export const metadata: Metadata = { title: 'Financiele instellingen · VaarSamen' }

export default async function FinInstellingenPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params
  const [school, membership] = await Promise.all([
    getSchoolById(schoolId),
    getSchoolMembership(schoolId, session.user.id),
  ])
  if (!school || !membership) redirect('/')
  // Alleen de eigenaar mag crediteur-gegevens wijzigen
  if (membership.role !== 'eigenaar') redirect(`/school/${schoolId}/financieel`)

  const fin = (school.financieel ?? null) as SchoolFinancieelConfig | null

  return (
    <FinInstellingenClient
      schoolId={schoolId}
      schoolNaam={school.name}
      initial={fin}
    />
  )
}
