import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchoolById, getSchoolMembership } from '@/lib/db/queries/school'
import { getSchoolOverzicht } from '@/lib/db/queries/school-overzicht'
import type { Metadata } from 'next'
import Link from 'next/link'
import { OverzichtClient } from './OverzichtClient'

interface Props {
  params: Promise<{ schoolId: string }>
}

export const metadata: Metadata = { title: 'Overzicht · VaarSamen' }

const MAG_LEZEN = ['eigenaar', 'instructeur', 'klusser', 'lid'] as const
function magOverzicht(role: string | undefined): boolean {
  return !!role && (MAG_LEZEN as readonly string[]).includes(role)
}

export default async function OverzichtPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId } = await params
  const [school, membership] = await Promise.all([
    getSchoolById(schoolId),
    getSchoolMembership(schoolId, session.user.id),
  ])

  if (!school || !membership) redirect('/')

  // Cursisten (zonder leesrol op het overzicht) sturen we naar hun vorderingen.
  if (!magOverzicht(membership.role)) redirect('/mijn-vorderingen')

  const data = await getSchoolOverzicht(schoolId, membership.role)
  if (!data) redirect('/')

  const isStaff = membership.role === 'eigenaar' || membership.role === 'instructeur'

  return (
    <OverzichtClient
      schoolId={schoolId}
      schoolNaam={data.schoolNaam}
      data={data}
      myRole={membership.role}
      isStaff={isStaff}
    />
  )
}
