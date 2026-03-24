import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getMatchMessages } from '@/lib/db/queries/matches'
import { db } from '@/lib/db'
import { matches, profiles, boats } from '@/lib/db/schema'
import { and, eq, or, isNull } from 'drizzle-orm'
import { ChatClient } from './ChatClient'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { matchId } = await params
  const myProfile = await getProfileByUserId(session.user.id)
  if (!myProfile) redirect('/onboarding')

  // Haal match op + verifieer toegang
  const [match] = await db
    .select()
    .from(matches)
    .where(and(
      eq(matches.id, matchId),
      or(eq(matches.profileAId, myProfile.id), eq(matches.profileBId, myProfile.id))
    ))
    .limit(1)

  if (!match) redirect('/matches')

  const otherId = match.profileAId === myProfile.id ? match.profileBId : match.profileAId

  const [otherProfile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, otherId), isNull(profiles.deletedAt)))
    .limit(1)

  const otherBoats = await db.select().from(boats).where(eq(boats.profileId, otherId))
  const initialMessages = await getMatchMessages(matchId)

  return (
    <ChatClient
      matchId={matchId}
      myProfileId={myProfile.id}
      otherProfile={{ ...otherProfile!, boats: otherBoats } as any}
      hasSailed={match.hasSailed ?? false}
      initialMessages={initialMessages as any}
    />
  )
}
