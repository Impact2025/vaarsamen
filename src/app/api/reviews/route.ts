import { auth } from '@/lib/auth'
import { reviewSchema } from '@/lib/validations'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { reviews, profiles, matches } from '@/lib/db/schema'
import { and, eq, or, avg, count } from 'drizzle-orm'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const body   = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { matchId, revieweeId, rating, text, sailedDate } = parsed.data

  // Voorkom zelf-review
  if (revieweeId === profile.id) {
    return Response.json({ error: 'Je kunt jezelf niet reviewen' }, { status: 400 })
  }

  // Verifieer dat match bestaat en gebruiker er deel van is
  const [match] = await db
    .select()
    .from(matches)
    .where(and(
      eq(matches.id, matchId),
      or(eq(matches.profileAId, profile.id), eq(matches.profileBId, profile.id))
    ))
    .limit(1)

  if (!match) return Response.json({ error: 'Match niet gevonden' }, { status: 404 })

  // Controleer op duplicate review
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.matchId, matchId), eq(reviews.reviewerId, profile.id)))
    .limit(1)

  if (existing) return Response.json({ error: 'Je hebt al een review achtergelaten voor deze tocht' }, { status: 409 })

  const [review] = await db
    .insert(reviews)
    .values({ matchId, reviewerId: profile.id, revieweeId, rating, text, sailedDate })
    .returning()

  // Update gemiddelde rating van reviewee
  const [stats] = await db
    .select({
      avg:   avg(reviews.rating),
      total: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.revieweeId, revieweeId))

  await db
    .update(profiles)
    .set({
      averageRating: stats.avg ? parseFloat(stats.avg) : null,
      reviewCount:   Number(stats.total),
    })
    .where(eq(profiles.id, revieweeId))

  // Markeer match als 'gevaren'
  await db.update(matches).set({ hasSailed: true }).where(eq(matches.id, matchId))

  return Response.json({ review }, { status: 201 })
}
