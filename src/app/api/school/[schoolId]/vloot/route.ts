import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolFleet } from '@/lib/db/schema'
import { vlootBootSchema } from '@/lib/validations'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'

// GET /api/school/[schoolId]/vloot
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const vloot = await db
    .select()
    .from(schoolFleet)
    .where(and(eq(schoolFleet.schoolId, schoolId), isNull(schoolFleet.deletedAt)))
    .orderBy(schoolFleet.bootNummer)

  return Response.json({ vloot })
}

// POST /api/school/[schoolId]/vloot — boot toevoegen
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
  const parsed = vlootBootSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [boot] = await db
    .insert(schoolFleet)
    .values({
      schoolId,
      bootNummer: parsed.data.bootNummer,
      bootType:   parsed.data.bootType,
      naam:       parsed.data.naam,
    })
    .returning()

  return Response.json({ boot }, { status: 201 })
}
