import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getLesDetail, getSchoolMembership } from '@/lib/db/queries/school'
import { LesBeoordelingClient } from './LesBeoordelingClient'
import type { Metadata } from 'next'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'

interface Props {
  params: Promise<{ schoolId: string; lesId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lesId } = await params
  const detail = await getLesDetail(lesId)
  if (!detail) return { title: 'Les niet gevonden' }
  return {
    title: `Les ${format(parseISO(detail.les.datum), 'd MMM', { locale: nl })} · ${detail.les.course.name}`,
  }
}

export default async function LesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/school/login')

  const { schoolId, lesId } = await params
  const [detail, membership] = await Promise.all([
    getLesDetail(lesId),
    getSchoolMembership(schoolId, session.user.id),
  ])

  if (!membership) redirect('/')
  if (!detail) notFound()

  // Cursisten mogen hun eigen les NIET invullen
  if (membership.role === 'cursist') redirect('/mijn-vorderingen')

  return (
    <LesBeoordelingClient
      detail={detail}
      schoolId={schoolId}
      myUserId={session.user.id}
    />
  )
}
