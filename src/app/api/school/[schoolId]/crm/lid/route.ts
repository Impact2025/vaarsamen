import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolMemberships , isStaff } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { crmUpdateSchema } from '@/lib/validations'
import { eq, and, isNull } from 'drizzle-orm'

// PATCH /api/school/[schoolId]/crm/lid — CRM-velden van een lid bijwerken
// Body: { userId, lifecycleStatus?, tags?, geboortedatum? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const myMembership = await getSchoolMembership(schoolId, session.user.id)
  if (!myMembership || !isStaff(myMembership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body = await req.json()
  const userId = body?.userId
  if (!userId) return Response.json({ error: 'userId vereist' }, { status: 400 })

  const parsed = crmUpdateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [m] = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, userId), isNull(schoolMemberships.deletedAt)))
    .limit(1)
  if (!m) return Response.json({ error: 'Lid niet gevonden' }, { status: 404 })

  await db.update(schoolMemberships).set({
    ...(parsed.data.lifecycleStatus !== undefined ? { lifecycleStatus: parsed.data.lifecycleStatus } : {}),
    ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
    ...(parsed.data.geboortedatum !== undefined ? { geboortedatum: parsed.data.geboortedatum } : {}),
  }).where(eq(schoolMemberships.id, m.id))

  return Response.json({ ok: true })
}
