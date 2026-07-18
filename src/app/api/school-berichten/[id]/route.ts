import { auth } from '@/lib/auth'
import { getSchoolBerichtMetReplies } from '@/lib/db/queries/school'

// ─── GET /api/school-berichten/[id] ─────────────────────────────────────────
// Zeiler haalt één bericht op mét reacties.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const bericht = await getSchoolBerichtMetReplies(id, session.user.id)
  if (!bericht) return Response.json({ error: 'Niet gevonden' }, { status: 404 })

  return Response.json({ ...bericht })
}
