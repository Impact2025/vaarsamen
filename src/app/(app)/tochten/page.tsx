import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getTochtenVoorPagina } from '@/lib/db/queries/tochten'
import { TochtenClientPage } from '@/components/tochten/TochtenClientPage'
import { TochtenPageSkeleton } from '@/components/tochten/TochtCardSkeleton'
import type { CWOLevel } from '@/types'

export default async function TochtenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [alleTochten, userProfile] = await Promise.all([
    getTochtenVoorPagina(),
    getProfileByUserId(session.user.id),
  ])

  return (
    <Suspense fallback={<TochtenPageSkeleton />}>
      <TochtenClientPage
        alleTochten={alleTochten}
        userCwoLevel={(userProfile?.cwoLevel as CWOLevel) ?? 'geen'}
        userSailingAreas={userProfile?.sailingAreas ?? []}
      />
    </Suspense>
  )
}
