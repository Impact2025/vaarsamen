import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolCourses } from '@/lib/db/schema'
import { schoolCourseSchema } from '@/lib/validations'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'

// PUT /api/school/[schoolId]/cursussen/[id] — cursus bewerken
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, id } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schoolCourseSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [cursus] = await db
    .update(schoolCourses)
    .set({
      name:        parsed.data.name,
      cwoLevel:    parsed.data.cwoLevel,
      description: parsed.data.description,
      startDate:   parsed.data.startDate ?? null,
      endDate:     parsed.data.endDate   ?? null,
      updatedAt:   new Date(),
    })
    .where(and(
      eq(schoolCourses.id,       id),
      eq(schoolCourses.schoolId, schoolId),
      isNull(schoolCourses.deletedAt),
    ))
    .returning()

  if (!cursus) return Response.json({ error: 'Cursus niet gevonden' }, { status: 404 })
  return Response.json({ cursus })
}

// DELETE /api/school/[schoolId]/cursussen/[id] — cursus soft-deleten
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, id } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role !== 'eigenaar') {
    return Response.json({ error: 'Alleen eigenaar mag cursussen verwijderen' }, { status: 403 })
  }

  const [cursus] = await db
    .update(schoolCourses)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(schoolCourses.id,       id),
      eq(schoolCourses.schoolId, schoolId),
      isNull(schoolCourses.deletedAt),
    ))
    .returning()

  if (!cursus) return Response.json({ error: 'Cursus niet gevonden' }, { status: 404 })
  return Response.json({ ok: true })
}
