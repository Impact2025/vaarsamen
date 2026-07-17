import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolFleet , isStaff } from '@/lib/db/schema'
import { vlootBootSchema } from '@/lib/validations'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'

// PUT /api/school/[schoolId]/vloot/[bootId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; bootId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, bootId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = vlootBootSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [updated] = await db
    .update(schoolFleet)
    .set({
      bootNummer: parsed.data.bootNummer,
      bootType:   parsed.data.bootType,
      naam:       parsed.data.naam ?? null,
    })
    .where(and(
      eq(schoolFleet.id, bootId),
      eq(schoolFleet.schoolId, schoolId),
      isNull(schoolFleet.deletedAt),
    ))
    .returning()

  if (!updated) return Response.json({ error: 'Boot niet gevonden' }, { status: 404 })
  return Response.json({ boot: updated })
}

// DELETE /api/school/[schoolId]/vloot/[bootId] — soft delete
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string; bootId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, bootId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  await db
    .update(schoolFleet)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(schoolFleet.id, bootId),
      eq(schoolFleet.schoolId, schoolId),
      isNull(schoolFleet.deletedAt),
    ))

  return Response.json({ ok: true })
}
