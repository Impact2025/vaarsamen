import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { matches } from '@/lib/db/schema'
import { and, eq, or } from 'drizzle-orm'

// PATCH /api/matches/[matchId] — update match (bijv. hasSailed)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { matchId } = await params
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const [match] = await db
    .select()
    .from(matches)
    .where(and(
      eq(matches.id, matchId),
      or(eq(matches.profileAId, profile.id), eq(matches.profileBId, profile.id))
    ))
    .limit(1)

  if (!match) return Response.json({ error: 'Match niet gevonden' }, { status: 404 })

  const body = await req.json()

  // Alleen veilige velden updaten
  const allowed: Record<string, unknown> = {}
  if (typeof body.hasSailed === 'boolean') allowed.hasSailed = body.hasSailed
  if (body.status === 'archived' || body.status === 'blocked') allowed.status = body.status

  if (Object.keys(allowed).length === 0) {
    return Response.json({ error: 'Geen geldige velden' }, { status: 400 })
  }

  const [updated] = await db
    .update(matches)
    .set({ ...allowed, updatedAt: new Date() })
    .where(eq(matches.id, matchId))
    .returning()

  return Response.json({ match: updated })
}
