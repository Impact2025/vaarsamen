import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletterCampaigns, newsletterSubscribers, newsletterSends } from '@/lib/db/schema'
import { getSchoolMembership, getSchoolById, getActiveSubscribers } from '@/lib/db/queries/school'
import { sendEmail } from '@/lib/email'
import { newsletterCampaignEmail } from '@/emails/templates'
import { eq, and, inArray } from 'drizzle-orm'
import { randomBytes } from 'crypto'

const BASE = process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'

// POST /api/school/[schoolId]/newsletter/send — verstuur campagne naar actieve abonnees
// Body: { campaignId }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body = await req.json()
  const campaignId = body?.campaignId
  if (!campaignId) return Response.json({ error: 'campaignId vereist' }, { status: 400 })

  const campaign = await db
    .select()
    .from(newsletterCampaigns)
    .where(and(eq(newsletterCampaigns.id, campaignId), eq(newsletterCampaigns.schoolId, schoolId)))
    .limit(1)
    .then(r => r[0] ?? null)

  if (!campaign) return Response.json({ error: 'Campagne niet gevonden' }, { status: 404 })
  if (campaign.status === 'verzonden') {
    return Response.json({ error: 'Deze campagne is al verzonden' }, { status: 409 })
  }

  const school = await getSchoolById(schoolId)
  if (!school) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

  const subscribers = await getActiveSubscribers(schoolId)
  if (subscribers.length === 0) {
    return Response.json({ error: 'Geen actieve abonnees om naar te verzenden' }, { status: 400 })
  }

  // Per ontvanger: uniek uitschrijf-token + send-record (voor tracking)
  const sends = subscribers.map(s => ({
    subscriberId: s.id,
    token: randomBytes(20).toString('hex'),
  }))

  // Upsert uitschrijf-token op subscriber + maak send-records
  await db.transaction(async (tx) => {
    for (const send of sends) {
      await tx.update(newsletterSubscribers)
        .set({ token: send.token })
        .where(eq(newsletterSubscribers.id, send.subscriberId))
      await tx.insert(newsletterSends).values({
        campaignId,
        subscriberId: send.subscriberId,
        status: 'verzonden',
      })
    }
  })

  // Verzend via Resend (parallel, maar met begrenzing)
  let verzonden = 0
  const BATCH = 20
  for (let i = 0; i < subscribers.length; i += BATCH) {
    const chunk = subscribers.slice(i, i + BATCH)
    await Promise.all(chunk.map(async (sub, idx) => {
      const token = sends[i + idx].token
      const unsubUrl = `${BASE}/api/school/${schoolId}/newsletter/unsubscribe?token=${token}`
      const webUrl = `${BASE}/school/${schoolId}`
      const res = await sendEmail({
        to: sub.email,
        subject: campaign.subject,
        html: newsletterCampaignEmail({
          schoolName: school.name,
          subject: campaign.subject,
          bodyHtml: campaign.inhoud,
          unsubscribeUrl: unsubUrl,
          webUrl,
        }),
      })
      if (res.ok) verzonden++
      else {
        // markeer als bounce bij harde fout
        await db.update(newsletterSubscribers)
          .set({ status: 'gebounced' })
          .where(eq(newsletterSubscribers.id, sub.id))
      }
    }))
  }

  // Markeer campagne als verzonden
  await db.update(newsletterCampaigns).set({
    status: 'verzonden',
    verzondenAt: new Date(),
    ontvangers: verzonden,
    updatedAt: new Date(),
  }).where(eq(newsletterCampaigns.id, campaignId))

  return Response.json({ ok: true, verzonden, totaal: subscribers.length })
}
