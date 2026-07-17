import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletterCampaigns } from '@/lib/db/schema'
import { getSchoolMembership, getCampaigns, getSchoolById } from '@/lib/db/queries/school'
import { campaignSchema } from '@/lib/validations'
import { eq, and } from 'drizzle-orm'

// GET /api/school/[schoolId]/newsletter/campaigns — lijst campagnes
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const campaigns = await getCampaigns(schoolId)
  return Response.json({ campaigns })
}

// POST /api/school/[schoolId]/newsletter/campaigns — nieuwe campagne (concept)
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
  const parsed = campaignSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [created] = await db.insert(newsletterCampaigns).values({
    schoolId,
    titel: parsed.data.titel,
    subject: parsed.data.subject,
    inhoud: parsed.data.inhoud,
    status: 'concept',
  }).returning()

  return Response.json({ campaign: created }, { status: 201 })
}

// PATCH /api/school/[schoolId]/newsletter/campaigns — campagne bijwerken (concept)
// Body: { id, titel?, subject?, inhoud? }
export async function PATCH(
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
  const id = body?.id
  if (!id) return Response.json({ error: 'id vereist' }, { status: 400 })

  const parsed = campaignSchema.partial().safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  await db.update(newsletterCampaigns).set({
    ...(parsed.data.titel !== undefined ? { titel: parsed.data.titel } : {}),
    ...(parsed.data.subject !== undefined ? { subject: parsed.data.subject } : {}),
    ...(parsed.data.inhoud !== undefined ? { inhoud: parsed.data.inhoud } : {}),
    updatedAt: new Date(),
  }).where(and(eq(newsletterCampaigns.id, id), eq(newsletterCampaigns.schoolId, schoolId)))

  return Response.json({ ok: true })
}

// DELETE /api/school/[schoolId]/newsletter/campaigns?id=...
export async function DELETE(
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

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id vereist' }, { status: 400 })

  await db.delete(newsletterCampaigns)
    .where(and(eq(newsletterCampaigns.id, id), eq(newsletterCampaigns.schoolId, schoolId)))

  return Response.json({ ok: true })
}
