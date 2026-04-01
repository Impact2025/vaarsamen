import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolLessons, lessonStudents, schoolCourses } from '@/lib/db/schema'
import { schoolLesSchema } from '@/lib/validations'
import { getSchoolMembership, getLessenVoorCursus } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'

// GET /api/school/[schoolId]/lessen?courseId=...
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  if (!courseId) return Response.json({ error: 'courseId vereist' }, { status: 400 })

  const lessen = await getLessenVoorCursus(courseId)
  return Response.json({ lessen })
}

// POST /api/school/[schoolId]/lessen — nieuwe les aanmaken
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schoolLesSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  // Cursus hoort bij deze school
  const [course] = await db
    .select({ id: schoolCourses.id })
    .from(schoolCourses)
    .where(and(
      eq(schoolCourses.id, parsed.data.courseId),
      eq(schoolCourses.schoolId, schoolId),
      isNull(schoolCourses.deletedAt),
    ))
    .limit(1)

  if (!course) return Response.json({ error: 'Cursus niet gevonden' }, { status: 404 })

  // Les aanmaken
  const [les] = await db
    .insert(schoolLessons)
    .values({
      courseId:      parsed.data.courseId,
      schoolId,
      datum:         parsed.data.datum,
      windRichting:  parsed.data.windRichting,
      windKracht:    parsed.data.windKracht,
      instructeurId: session.user.id,
    })
    .returning()

  // Cursisten koppelen
  if (parsed.data.studentIds.length > 0) {
    await db.insert(lessonStudents).values(
      parsed.data.studentIds.map(id => ({
        lessonId:      les.id,
        studentUserId: id,
      }))
    ).onConflictDoNothing()
  }

  return Response.json({ les }, { status: 201 })
}
