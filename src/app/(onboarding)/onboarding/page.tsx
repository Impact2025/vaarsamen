import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { OnboardingChat } from '@/components/onboarding/OnboardingChat'

export default async function OnboardingPage() {
  const session = await auth()
  if (session?.user?.id) {
    const profile = await getProfileByUserId(session.user.id)
    if (profile?.isOnboarded) redirect('/ontdekken')
  }
  return <OnboardingChat />
}
