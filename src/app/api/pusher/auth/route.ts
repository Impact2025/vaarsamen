import { auth } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { matches } from '@/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'

// Pusher private channel authenticatie
// Vereist voor alle 'private-' channels (chat, match notificaties)
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) {
    return new Response('Profiel niet gevonden', { status: 404 })
  }

  const body       = await req.text()
  const params     = new URLSearchParams(body)
  const socketId   = params.get('socket_id')
  const channelName = params.get('channel_name')

  if (!socketId || !channelName) {
    return new Response('Ongeldige parameters', { status: 400 })
  }

  // Controleer of gebruiker toegang heeft tot dit channel
  // private-match-{matchId} en private-user-{userId}
  const isUserChannel  = channelName === `private-user-${profile.id}`
  const isMatchChannel = channelName.startsWith('private-match-')

  if (!isUserChannel && !isMatchChannel) {
    return new Response('Geen toegang tot dit channel', { status: 403 })
  }

  // Bij match channels: verifieer dat de gebruiker deel is van de match
  if (isMatchChannel) {
    const matchId = channelName.replace('private-match-', '')
    const [match] = await db
      .select()
      .from(matches)
      .where(and(
        eq(matches.id, matchId),
        or(eq(matches.profileAId, profile.id), eq(matches.profileBId, profile.id)),
      ))
      .limit(1)

    if (!match) {
      return new Response('Geen toegang tot dit channel', { status: 403 })
    }
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName)
  return Response.json(authResponse)
}
