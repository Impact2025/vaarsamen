import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const BASE = process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'

// GET /api/school/[schoolId]/newsletter/unsubscribe?token=...  (publiek)
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
    .where(eq(newsletterSubscribers.token, token))
    .limit(1)

  if (!sub) return new Response('Onbekende link', { status: 404 })

  await db.update(newsletterSubscribers).set({
    status: 'afgemeld',
    afgemeldAt: new Date(),
    token: null,
  }).where(eq(newsletterSubscribers.id, sub.id))

  // Ook het lid uitschrijven voor de school-nieuwsbrief
  if (sub.membershipId) {
    const { schoolMemberships } = await import('@/lib/db/schema')
    await db.update(schoolMemberships)
      .set({ nieuwsbrief: false })
      .where(eq(schoolMemberships.id, sub.membershipId))
  }

  return Response.redirect(`${BASE}/school/${schoolId}?newsletter=afgemeld`, 302)
}
