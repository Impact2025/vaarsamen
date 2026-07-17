import { auth } from '@/lib/auth'
import { isStaff } from '@/lib/db/schema'
import { getSchoolMembership, getSchoolLedenUitgebreid } from '@/lib/db/queries/school'

// GET /api/school/[schoolId]/crm/leden — leden met CRM-velden (eigenaar/instructeur)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const leden = await getSchoolLedenUitgebreid(schoolId)
  return Response.json({ leden })
}
