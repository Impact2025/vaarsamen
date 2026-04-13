import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolBerichten, users } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, desc } from 'drizzle-orm'
import { z } from 'zod'

const berichtSchema = z.object({
  inhoud:   z.string().min(1).max(2000),
  courseId: z.string().uuid().optional(),
})

// GET /api/school/[schoolId]/berichten — toegankelijk voor alle leden (incl. cursisten)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const rows = await db
    .select({
      id:        schoolBerichten.id,
      inhoud:    schoolBerichten.inhoud,
      courseId:  schoolBerichten.courseId,
      createdAt: schoolBerichten.createdAt,
      sender: {
        id:    users.id,
        name:  users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(schoolBerichten)
    .leftJoin(users, eq(users.id, schoolBerichten.senderUserId))
    .where(eq(schoolBerichten.schoolId, schoolId))
    .orderBy(desc(schoolBerichten.createdAt))
    .limit(50)

  return Response.json({ berichten: rows })
}

// POST /api/school/[schoolId]/berichten — toegankelijk voor alle leden (incl. cursisten)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = berichtSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Ongeldig verzoek' }, { status: 400 })
  }

  const [bericht] = await db
    .insert(schoolBerichten)
    .values({
      schoolId,
      senderUserId: session.user.id,
      inhoud:       parsed.data.inhoud,
      courseId:     parsed.data.courseId,
    })
    .returning()

  return Response.json({ bericht }, { status: 201 })
}

// DELETE /api/school/[schoolId]/berichten?id=...
// Eigen berichten mag iedereen verwijderen; eigenaar mag alles
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id vereist' }, { status: 400 })

  const where = membership.role === 'eigenaar'
    ? and(eq(schoolBerichten.id, id), eq(schoolBerichten.schoolId, schoolId))
    : and(eq(schoolBerichten.id, id), eq(schoolBerichten.schoolId, schoolId), eq(schoolBerichten.senderUserId, session.user.id))

  const deleted = await db.delete(schoolBerichten).where(where).returning({ id: schoolBerichten.id })
  if (deleted.length === 0) return Response.json({ error: 'Niet gevonden of geen rechten' }, { status: 404 })

  return Response.json({ ok: true })
}
