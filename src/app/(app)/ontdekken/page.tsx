import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getDiscoveryFeed } from '@/lib/db/queries/profiles'
import { getSwipesRemainingToday } from '@/lib/db/queries/swipes'
import { OntdekkenClient } from './OntdekkenClient'

export default async function OntdekkenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const myProfile = await getProfileByUserId(session.user.id)
  if (!myProfile) redirect('/onboarding')
  if (!myProfile.isOnboarded) redirect('/onboarding')

  const [feed, swipesRemaining] = await Promise.all([
    getDiscoveryFeed(myProfile.id, {
      sailingAreas: myProfile.sailingAreas?.length ? myProfile.sailingAreas : undefined,
      myLat:        myProfile.lat    ?? null,
      myLng:        myProfile.lng    ?? null,
      radiusKm:     myProfile.searchRadiusKm ?? 50,
    }),
    getSwipesRemainingToday(myProfile.id, myProfile.subscriptionTier !== 'free'),
  ])

  const myProfileForClient = {
    id:              myProfile.id,
    displayName:     myProfile.displayName,
    photoUrl:        myProfile.photoUrl ?? undefined,
    cwoLevel:        myProfile.cwoLevel ?? 'geen',
    cwoVerified:     myProfile.cwoVerified ?? false,
    sailingRole:     myProfile.sailingRole ?? 'beide',
    lookingFor:      myProfile.lookingFor ?? 'alles',
    skillTags:       myProfile.skillTags ?? [],
    sailingAreas:    myProfile.sailingAreas ?? [],
    reviewCount:     myProfile.reviewCount ?? 0,
    boats:           [],
    subscriptionTier: myProfile.subscriptionTier ?? 'free',
    isFeatured:      myProfile.isFeatured ?? false,
  } as const

  return (
    <OntdekkenClient
      initialProfiles={feed as any}
      myProfile={myProfileForClient as any}
      initialSwipesRemaining={swipesRemaining}
    />
  )
}
