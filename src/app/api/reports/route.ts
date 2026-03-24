import { auth } from '@/lib/auth'
import { reportSchema } from '@/lib/validations'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { db } from '@/lib/db'
import { reports } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@vaarsamen.nl'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  // Rate limiting: max 5 rapportages per 5 minuten
  const { allowed } = checkRateLimit(
    `report:${session.user.id}`,
    RATE_LIMITS.report.max,
    RATE_LIMITS.report.windowMs
  )
  if (!allowed) return Response.json({ error: 'Te veel rapportages' }, { status: 429 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const body   = await req.json()
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { reportedId, reason, description } = parsed.data

  if (reportedId === profile.id) {
    return Response.json({ error: 'Je kunt jezelf niet rapporteren' }, { status: 400 })
  }

  await db.insert(reports).values({
    reporterId:  profile.id,
    reportedId,
    reason,
    description,
  })

  // Check of drempel bereikt is (3+ rapportages → email admin)
  const [{ total }] = await db
    .select({ total: count(reports.id) })
    .from(reports)
    .where(eq(reports.reportedId, reportedId))

  if (Number(total) >= 3 && process.env.RESEND_API_KEY) {
    // Fire-and-forget: stuur email naar admin
    fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    process.env.EMAIL_FROM ?? 'noreply@vaarsamen.nl',
        to:      ADMIN_EMAIL,
        subject: `[VaarSamen] Profiel ${reportedId} heeft ${total} rapportages`,
        text:    `Profiel ${reportedId} heeft ${total} rapportages ontvangen. Controleer via het admin dashboard.`,
      }),
    }).catch(console.error)
  }

  return Response.json({ success: true }, { status: 201 })
}
