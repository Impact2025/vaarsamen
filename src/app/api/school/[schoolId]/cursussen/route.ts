import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolCourses , isStaff } from '@/lib/db/schema'
import { schoolCourseSchema } from '@/lib/validations'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull, desc } from 'drizzle-orm'

// GET /api/school/[schoolId]/cursussen
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const cursussen = await db
    .select()
    .from(schoolCourses)
    .where(and(eq(schoolCourses.schoolId, schoolId), isNull(schoolCourses.deletedAt)))
    .orderBy(desc(schoolCourses.createdAt))

  return Response.json({ cursussen })
}

// POST /api/school/[schoolId]/cursussen — nieuwe cursus aanmaken
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schoolCourseSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [cursus] = await db
    .insert(schoolCourses)
    .values({
      schoolId,
      name:        parsed.data.name,
      cwoLevel:    parsed.data.cwoLevel,
      description: parsed.data.description,
      startDate:   parsed.data.startDate,
      endDate:     parsed.data.endDate,
    })
    .returning()

  return Response.json({ cursus }, { status: 201 })
}
