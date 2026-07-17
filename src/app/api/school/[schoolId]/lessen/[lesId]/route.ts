import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolLessons , isStaff } from '@/lib/db/schema'
import { getSchoolMembership, getLesDetail } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const patchLesSchema = z.object({
  windRichting: z.string().max(5).nullable().optional(),
  windKracht:   z.number().int().min(0).max(12).nullable().optional(),
})

// GET /api/school/[schoolId]/lessen/[lesId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string; lesId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, lesId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const detail = await getLesDetail(lesId)
  if (!detail) return Response.json({ error: 'Les niet gevonden' }, { status: 404 })

  return Response.json({ detail })
}

// PATCH /api/school/[schoolId]/lessen/[lesId] — windkracht/richting bijwerken
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; lesId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, lesId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = patchLesSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  await db
    .update(schoolLessons)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(
      eq(schoolLessons.id, lesId),
      eq(schoolLessons.schoolId, schoolId),
      isNull(schoolLessons.deletedAt),
    ))

  return Response.json({ ok: true })
}

// DELETE /api/school/[schoolId]/lessen/[lesId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string; lesId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, lesId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  await db
    .update(schoolLessons)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(schoolLessons.id, lesId),
      eq(schoolLessons.schoolId, schoolId),
      isNull(schoolLessons.deletedAt),
    ))

  return Response.json({ ok: true })
}
