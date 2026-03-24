import { auth } from '@/lib/auth'
import { messageSchema } from '@/lib/validations'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getMatchMessages, markMessagesAsRead } from '@/lib/db/queries/matches'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { pusherServer, channels, events } from '@/lib/pusher'
import { db } from '@/lib/db'
import { messages, matches } from '@/lib/db/schema'
import { and, eq, or } from 'drizzle-orm'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { matchId } = await params
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  // Verifieer dat gebruiker deel is van deze match
  const [match] = await db
    .select()
    .from(matches)
    .where(and(
      eq(matches.id, matchId),
      or(eq(matches.profileAId, profile.id), eq(matches.profileBId, profile.id))
    ))
    .limit(1)

  if (!match) return Response.json({ error: 'Match niet gevonden' }, { status: 404 })

  const messageList = await getMatchMessages(matchId)
  await markMessagesAsRead(matchId, profile.id)

  return Response.json({ messages: messageList })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  // Rate limiting per gebruiker
  const { allowed } = checkRateLimit(
    `message:${session.user.id}`,
    RATE_LIMITS.message.max,
    RATE_LIMITS.message.windowMs
  )
  if (!allowed) return Response.json({ error: 'Te veel berichten' }, { status: 429 })

  const { matchId } = await params
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  // Verifieer match lidmaatschap
  const [match] = await db
    .select()
    .from(matches)
    .where(and(
      eq(matches.id, matchId),
      or(eq(matches.profileAId, profile.id), eq(matches.profileBId, profile.id))
    ))
    .limit(1)

  if (!match) return Response.json({ error: 'Match niet gevonden' }, { status: 404 })

  const body   = await req.json()
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [message] = await db
    .insert(messages)
    .values({ matchId, senderId: profile.id, content: parsed.data.content })
    .returning()

  // Realtime: stuur naar match channel
  await pusherServer.trigger(
    channels.match(matchId),
    events.newMessage,
    { message }
  )

  return Response.json({ message }, { status: 201 })
}
