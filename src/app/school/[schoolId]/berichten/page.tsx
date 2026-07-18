import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolMembership, getSchoolLedenMetMembershipId } from '@/lib/db/queries/school'
import { isStaff } from '@/lib/db/schema'
import { SchoolBerichtVersturenClient } from './SchoolBerichtVersturenClient'

export const dynamic = 'force-dynamic'

export default async function SchoolBerichtenPage({
  params,
}: { params: Promise<{ schoolId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) redirect('/')
  if (!isStaff(membership.role)) redirect(`/school/${schoolId}/dashboard`)

  const leden = await getSchoolLedenMetMembershipId(schoolId)

  return <SchoolBerichtVersturenClient schoolId={schoolId} leden={leden} />
}
