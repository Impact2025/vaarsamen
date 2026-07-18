import { auth } from '@/lib/auth'
import { getSchoolMembership, markeerSchoolReactieGelezen } from '@/lib/db/queries/school'
import { isStaff } from '@/lib/db/schema'

// ─── PATCH /api/school/[schoolId]/berichten/[id]/reactie/[rid] ───────────────
// Staff markeert een zeiler-reactie als gelezen door de school.

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string; id: string; rid: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId, rid } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const ok = await markeerSchoolReactieGelezen(rid, schoolId)
  if (!ok) return Response.json({ error: 'Reactie niet gevonden' }, { status: 404 })

  return Response.json({ ok: true })
}
