import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lessonNotes, schoolLessons , isStaff } from '@/lib/db/schema'
import { lessonNoteSchema } from '@/lib/validations'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull, sql } from 'drizzle-orm'

// POST /api/school/[schoolId]/lessen/[lesId]/nota
// Upsert opmerking voor één cursist op één les

export async function POST(
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

  const [les] = await db
    .select({ id: schoolLessons.id })
    .from(schoolLessons)
    .where(and(eq(schoolLessons.id, lesId), eq(schoolLessons.schoolId, schoolId), isNull(schoolLessons.deletedAt)))
    .limit(1)
  if (!les) return Response.json({ error: 'Les niet gevonden' }, { status: 404 })

  const body   = await req.json()
  const parsed = lessonNoteSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  await db
    .insert(lessonNotes)
    .values({
      lessonId:      lesId,
      studentUserId: parsed.data.studentUserId,
      note:          parsed.data.note,
      instructeurId: session.user.id,
    })
    .onConflictDoUpdate({
      target: [lessonNotes.lessonId, lessonNotes.studentUserId],
      set: {
        note:          sql`excluded.note`,
        instructeurId: sql`excluded.instructeur_id`,
        updatedAt:     new Date(),
      },
    })

  return Response.json({ ok: true })
}
