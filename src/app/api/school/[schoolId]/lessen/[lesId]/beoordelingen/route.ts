import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { skillAssessments, lessonStudents, schoolLessons } from '@/lib/db/schema'
import { bulkAssessmentSchema } from '@/lib/validations'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

// POST /api/school/[schoolId]/lessen/[lesId]/beoordelingen
// Bulk upsert: alle AMRB scores voor één cursist in één aanroep
// Instructeur kan scores aanpassen: conflict → update

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; lesId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, lesId } = await params

  // Instructeur of eigenaar vereist
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Alleen instructeurs mogen beoordelingen invullen' }, { status: 403 })
  }

  // Les hoort bij deze school
  const [les] = await db
    .select({ id: schoolLessons.id, schoolId: schoolLessons.schoolId })
    .from(schoolLessons)
    .where(and(eq(schoolLessons.id, lesId), eq(schoolLessons.schoolId, schoolId), isNull(schoolLessons.deletedAt)))
    .limit(1)
  if (!les) return Response.json({ error: 'Les niet gevonden' }, { status: 404 })

  const body   = await req.json()

  // Accept single object or array
  const rawItems = Array.isArray(body) ? body : [body]
  const parsed   = z.array(bulkAssessmentSchema).safeParse(rawItems)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const results: { studentUserId: string; upserted: number }[] = []

  for (const item of parsed.data) {
    // Controleer dat cursist op deze les staat
    const [ls] = await db
      .select({ id: lessonStudents.id })
      .from(lessonStudents)
      .where(and(
        eq(lessonStudents.lessonId, lesId),
        eq(lessonStudents.studentUserId, item.studentUserId),
      ))
      .limit(1)

    if (!ls) {
      return Response.json({
        error: `Cursist ${item.studentUserId} staat niet op deze les`
      }, { status: 422 })
    }

    // Update boot + solo op lessonStudents
    await db
      .update(lessonStudents)
      .set({
        bootId:      item.bootId ?? null,
        soloGevaren: item.soloGevaren,
      })
      .where(and(
        eq(lessonStudents.lessonId, lesId),
        eq(lessonStudents.studentUserId, item.studentUserId),
      ))

    // Bulk upsert van AMRB scores
    if (item.scores.length > 0) {
      await db
        .insert(skillAssessments)
        .values(item.scores.map(s => ({
          lessonId:      lesId,
          studentUserId: item.studentUserId,
          skillId:       s.skillId,
          score:         s.score,
          instructeurId: session.user.id,
        })))
        .onConflictDoUpdate({
          target: [skillAssessments.lessonId, skillAssessments.studentUserId, skillAssessments.skillId],
          set: {
            score:         sql`excluded.score`,
            instructeurId: sql`excluded.instructeur_id`,
            updatedAt:     new Date(),
          },
        })
    }

    results.push({ studentUserId: item.studentUserId, upserted: item.scores.length })
  }

  return Response.json({ ok: true, results }, { status: 200 })
}
