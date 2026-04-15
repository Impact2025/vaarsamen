import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { OnboardingChat } from '@/components/onboarding/OnboardingChat'

export default async function OnboardingPage() {
  const session = await auth()
  if (session?.user?.id) {
    const profile = await getProfileByUserId(session.user.id)
    // Redirect via API route zodat de vs_onboarded cookie gezet kan worden
    // (Server Components mogen geen cookies setten — Route Handlers wel)
    if (profile?.isOnboarded) redirect('/api/onboarding/herstel')
  }
  return <OnboardingChat />
}
