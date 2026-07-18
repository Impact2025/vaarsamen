import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolBerichtenVoorUser } from '@/lib/db/queries/school'
import { SchoolBerichtenClient } from './SchoolBerichtenClient'

export const dynamic = 'force-dynamic'

export default async function SchoolBerichtenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const berichten = await getSchoolBerichtenVoorUser(session.user.id)

  return <SchoolBerichtenClient initialBerichten={berichten} />
}
