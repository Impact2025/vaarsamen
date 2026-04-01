import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sailingSchools } from '@/lib/db/schema'
import { schoolUpdateSchema } from '@/lib/validations'
import { getSchoolById, getSchoolMembership } from '@/lib/db/queries/school'
import { eq } from 'drizzle-orm'

// GET /api/school/[schoolId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang tot deze school' }, { status: 403 })

  const school = await getSchoolById(schoolId)
  if (!school) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

  return Response.json({ school, rol: membership.role })
}

// PUT /api/school/[schoolId] — school gegevens bijwerken (alleen eigenaar)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role !== 'eigenaar') {
    return Response.json({ error: 'Alleen de eigenaar mag school gegevens wijzigen' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schoolUpdateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [updated] = await db
    .update(sailingSchools)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(sailingSchools.id, schoolId))
    .returning()

  return Response.json({ school: updated })
}
