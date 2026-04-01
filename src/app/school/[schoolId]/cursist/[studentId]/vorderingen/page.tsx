import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolMembership, getMijnVorderingen } from '@/lib/db/queries/school'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PrintVorderingen } from './PrintVorderingen'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Vorderingenstaat · VaarSamen' }

export default async function CursistVorderingenPage({
  params,
}: {
  params: Promise<{ schoolId: string; studentId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId, studentId } = await params

  // Alleen eigenaar/instructeur of de cursist zelf
  const membership = await getSchoolMembership(schoolId, session.user.id)
  const isSelf     = session.user.id === studentId
  const isStaff    = membership && ['eigenaar', 'instructeur'].includes(membership.role)

  if (!isSelf && !isStaff) redirect(`/school/${schoolId}/dashboard`)

  // Haal cursist op
  const [cursist] = await db.select().from(users).where(eq(users.id, studentId)).limit(1)
  if (!cursist) redirect(`/school/${schoolId}/dashboard`)

  const vorderingen = await getMijnVorderingen(studentId, schoolId)

  return <PrintVorderingen vorderingen={vorderingen} cursistNaam={cursist.name ?? cursist.email ?? 'Cursist'} />
}
