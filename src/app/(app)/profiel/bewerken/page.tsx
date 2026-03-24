import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import ProfielBewerkenClient from './ProfielBewerkenClient'

export default async function ProfielBewerkenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) redirect('/onboarding')

  return <ProfielBewerkenClient profile={profile} />
}
