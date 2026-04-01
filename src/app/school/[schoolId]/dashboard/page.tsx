import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolDashboard, getSchoolMembership } from '@/lib/db/queries/school'
import { SchoolDashboardClient } from './SchoolDashboardClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ schoolId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { schoolId } = await params
  return { title: `School Dashboard · VaarSamen` }
}

export default async function SchoolDashboardPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params
  const [dashboard, membership] = await Promise.all([
    getSchoolDashboard(schoolId),
    getSchoolMembership(schoolId, session.user.id),
  ])

  if (!dashboard || !membership) redirect('/')
  if (membership.role === 'cursist') redirect(`/mijn-vorderingen`)

  return (
    <SchoolDashboardClient
      dashboard={dashboard}
      schoolId={schoolId}
      myUserId={session.user.id}
      myRole={membership.role}
    />
  )
}
