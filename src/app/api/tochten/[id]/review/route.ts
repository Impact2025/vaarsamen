import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { tochten, tochtAanmeldingen, tochtReviews, profiles } from '@/lib/db/schema'
import { and, eq, or } from 'drizzle-orm'
import { sendPushToProfile } from '@/lib/push'

// POST /api/tochten/[id]/review — review achterlaten na tocht
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const [tocht] = await db.select().from(tochten).where(eq(tochten.id, id)).limit(1)
  if (!tocht) return Response.json({ error: 'Tocht niet gevonden' }, { status: 404 })

  // Controleer of vaartdatum voorbij is
  const vandaag = new Date().toISOString().slice(0, 10)
  if ((tocht.datum as string) >= vandaag) {
    return Response.json({ error: 'Tocht is nog niet geweest' }, { status: 400 })
  }

  // Vind wie reviewd mag worden: poster reviewt aanmelders, aanmelders reviewen poster
  const isPoster = tocht.profileId === profile.id
  const { revieweeId, rating, text } = await req.json()

  if (!revieweeId || !rating || rating < 1 || rating > 5) {
    return Response.json({ error: 'Ongeldig rating of reviewee' }, { status: 400 })
  }

  if (isPoster) {
    // Poster mag geaccepteerde aanmelders reviewen
    const [aanmelding] = await db.select().from(tochtAanmeldingen)
      .where(and(
        eq(tochtAanmeldingen.tochtId, id),
        eq(tochtAanmeldingen.profileId, revieweeId),
        eq(tochtAanmeldingen.status, 'geaccepteerd'),
      )).limit(1)
    if (!aanmelding) return Response.json({ error: 'Aanmelding niet gevonden' }, { status: 404 })
  } else {
    // Aanmelder mag alleen poster reviewen, als ze geaccepteerd zijn
    if (revieweeId !== tocht.profileId) {
      return Response.json({ error: 'Je kunt alleen de organisator reviewen' }, { status: 400 })
    }
    const [mijnAanmelding] = await db.select().from(tochtAanmeldingen)
      .where(and(
        eq(tochtAanmeldingen.tochtId, id),
        eq(tochtAanmeldingen.profileId, profile.id),
        eq(tochtAanmeldingen.status, 'geaccepteerd'),
      )).limit(1)
    if (!mijnAanmelding) return Response.json({ error: 'Geen geaccepteerde aanmelding gevonden' }, { status: 403 })
  }

  // Voorkom dubbele review
  const [bestaand] = await db.select().from(tochtReviews)
    .where(and(
      eq(tochtReviews.tochtId, id),
      eq(tochtReviews.reviewerId, profile.id),
      eq(tochtReviews.revieweeId, revieweeId),
    )).limit(1)
  if (bestaand) return Response.json({ error: 'Je hebt al een review achtergelaten' }, { status: 409 })

  const [review] = await db.insert(tochtReviews).values({
    tochtId: id, reviewerId: profile.id, revieweeId, rating, text,
  }).returning()

  // Update gemiddelde rating van de beoordeelde
  const alleReviews = await db.select({ rating: tochtReviews.rating })
    .from(tochtReviews).where(eq(tochtReviews.revieweeId, revieweeId))
  const avg = alleReviews.reduce((s, r) => s + r.rating, 0) / alleReviews.length
  await db.update(profiles).set({
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: alleReviews.length,
  }).where(eq(profiles.id, revieweeId))

  // Push notificatie
  await sendPushToProfile(revieweeId, {
    title: '⭐ Nieuwe review',
    body:  `${profile.displayName} heeft je ${rating} ster${rating === 1 ? '' : 'ren'} gegeven!`,
    url:   '/profiel',
  })

  return Response.json({ review }, { status: 201 })
}
