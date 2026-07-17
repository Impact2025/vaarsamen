import { auth } from '@/lib/auth'
import { getSchoolMembership, getNewsletterStats } from '@/lib/db/queries/school'

// GET /api/school/[schoolId]/newsletter/stats — abonnee-statistieken
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const stats = await getNewsletterStats(schoolId)
  return Response.json({ stats })
}
