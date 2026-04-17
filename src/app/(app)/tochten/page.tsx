import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getTochtenVoorPagina, getMyAanmeldingen } from '@/lib/db/queries/tochten'
import { TochtenClientPage } from '@/components/tochten/TochtenClientPage'
import { TochtenPageSkeleton } from '@/components/tochten/TochtCardSkeleton'
import type { CWOLevel } from '@/types'

export default async function TochtenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userProfile = await getProfileByUserId(session.user.id)

  const [alleTochten, mijnAanmeldingen] = await Promise.all([
    getTochtenVoorPagina(),
    userProfile ? getMyAanmeldingen(userProfile.id) : Promise.resolve([]),
  ])

  return (
    <Suspense fallback={<TochtenPageSkeleton />}>
      <TochtenClientPage
        alleTochten={alleTochten}
        mijnAanmeldingen={mijnAanmeldingen}
        userCwoLevel={(userProfile?.cwoLevel as CWOLevel) ?? 'geen'}
        userSailingAreas={userProfile?.sailingAreas ?? []}
      />
    </Suspense>
  )
}
