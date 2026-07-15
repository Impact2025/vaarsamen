import { db } from '@/lib/db'
import { newsletterSubscribers, schoolMemberships, sailingSchools } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const BASE = process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'

// GET /api/school/[schoolId]/newsletter/confirm?token=...  (publiek, double-opt-in bevestiging)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const { schoolId } = await params
  const url = new URL(_req.url)
  const token = url.searchParams.get('token')
  if (!token) return new Response('Ongeldige link', { status: 400 })

  const [sub] = await db
    .select()
    .from(newsletterSubscribers)
    .where(and(
      eq(newsletterSubscribers.schoolId, schoolId),
      eq(newsletterSubscribers.token, token),
    ))
    .limit(1)

  if (!sub) return new Response('Onbekende of verlopen link', { status: 404 })

  if (sub.status === 'actief') {
    return Response.redirect(`${BASE}/school/${schoolId}?newsletter=al_actief`, 302)
  }

  // Ook het bijbehorende lid (indien gekoppeld) op nieuwsbrief aan zetten
  if (sub.membershipId) {
    await db.update(schoolMemberships)
      .set({ nieuwsbrief: true })
      .where(eq(schoolMemberships.id, sub.membershipId))
  }

  await db.update(newsletterSubscribers).set({
    status: 'actief',
    confirmedAt: new Date(),
    token: null,
  }).where(eq(newsletterSubscribers.id, sub.id))

  return Response.redirect(`${BASE}/school/${schoolId}?newsletter=bevestigd`, 302)
}
