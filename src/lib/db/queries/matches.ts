import { and, eq, or, isNull, desc, not, exists } from 'drizzle-orm'
import { db } from '@/lib/db'
import { matches, messages, profiles, boats, swipes } from '@/lib/db/schema'

export async function getMatchesForProfile(profileId: string) {
  const result = await db
    .select()
    .from(matches)
    .where(and(
      or(eq(matches.profileAId, profileId), eq(matches.profileBId, profileId)),
      eq(matches.status, 'active'),
    ))
    .orderBy(desc(matches.matchedAt))

  // Verrijk met het profiel van de andere partij + laatste bericht
  return Promise.all(result.map(async (match) => {
    const otherId = match.profileAId === profileId ? match.profileBId : match.profileAId

    const [otherProfile] = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.id, otherId), isNull(profiles.deletedAt)))
      .limit(1)

    const [lastMessage] = await db
      .select()
      .from(messages)
      .where(and(eq(messages.matchId, match.id), isNull(messages.deletedAt)))
      .orderBy(desc(messages.createdAt))
      .limit(1)

    const unreadCount = await db.$count(
      messages,
      and(
        eq(messages.matchId, match.id),
        eq(messages.isRead, false),
        isNull(messages.deletedAt),
      )
    )

    const profileBoats = await db.select().from(boats).where(eq(boats.profileId, otherId))

    return {
      id:           match.id,
      profile:      { ...otherProfile, boats: profileBoats },
      lastMessage:  lastMessage ?? null,
      unreadCount,
      matchedAt:    match.matchedAt,
      hasSailed:    match.hasSailed,
    }
  }))
}

// Profielen waar jij "like" op hebt gezwipt maar nog geen match is (wacht op reactie)
export async function getOutgoingLikes(profileId: string) {
  const matchExists = db
    .select({ one: matches.id })
    .from(matches)
    .where(or(
      and(eq(matches.profileAId, profileId), eq(matches.profileBId, swipes.swipedId)),
      and(eq(matches.profileBId, profileId), eq(matches.profileAId, swipes.swipedId)),
    ))

  const rows = await db
    .select({ profile: profiles, swipedAt: swipes.createdAt })
    .from(swipes)
    .innerJoin(profiles, and(eq(profiles.id, swipes.swipedId), isNull(profiles.deletedAt)))
    .where(and(
      eq(swipes.swiperId, profileId),
      eq(swipes.action, 'like'),
      not(exists(matchExists)),
    ))
    .orderBy(desc(swipes.createdAt))

  return rows
}

export async function getMatchMessages(matchId: string, limit = 50, cursor?: string) {
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.matchId, matchId), isNull(messages.deletedAt)))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
}

export async function markMessagesAsRead(matchId: string, readerProfileId: string) {
  await db
    .update(messages)
    .set({ isRead: true })
    .where(and(
      eq(messages.matchId, matchId),
      eq(messages.isRead, false),
    ))
}
