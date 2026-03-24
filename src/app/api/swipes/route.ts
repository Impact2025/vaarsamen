import { auth } from '@/lib/auth'
import { swipeSchema } from '@/lib/validations'
import { recordSwipeAtomic } from '@/lib/db/queries/swipes'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { pusherServer, channels, events } from '@/lib/pusher'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  // Rate limiting op IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = checkRateLimit(`swipe:${ip}`, RATE_LIMITS.swipe.max, RATE_LIMITS.swipe.windowMs)
  if (!allowed) {
    return Response.json({ error: 'Te veel verzoeken, probeer het later opnieuw' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Input validatie
  const body   = await req.json()
  const parsed = swipeSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { swipedId, action } = parsed.data

  // Haal huidig profiel op
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) {
    return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })
  }

  // Voorkom swipen op zichzelf
  if (profile.id === swipedId) {
    return Response.json({ error: 'Je kunt niet op jezelf swipen' }, { status: 400 })
  }

  const isPremium = profile.subscriptionTier !== 'free'

  try {
    const result = await recordSwipeAtomic(profile.id, swipedId, action, isPremium)

    // Als het een match is: Pusher notificatie naar beide gebruikers
    if (result.matchId) {
      const [swipedProfile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.id, swipedId))
        .limit(1)

      await Promise.all([
        pusherServer.trigger(
          channels.user(profile.id),
          events.newMatch,
          { matchId: result.matchId }
        ),
        pusherServer.trigger(
          channels.user(swipedId),
          events.newMatch,
          { matchId: result.matchId }
        ),
      ])
    }

    return Response.json({
      success:         true,
      isMatch:         !!result.matchId,
      matchId:         result.matchId,
      swipesRemaining: result.swipesRemaining,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'SWIPE_LIMIT_REACHED') {
      return Response.json({
        error:    'Je dagelijkse limiet van swipes is bereikt. Upgrade naar premium voor meer!',
        limitReached: true,
      }, { status: 429 })
    }
    console.error('Swipe error:', err)
    return Response.json({ error: 'Er ging iets mis' }, { status: 500 })
  }
}
