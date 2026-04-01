import { auth } from '@/lib/auth'
import { getMijnVorderingen } from '@/lib/db/queries/school'

// GET /api/mijn-vorderingen?schoolId=...
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get('schoolId') ?? undefined

  const vorderingen = await getMijnVorderingen(session.user.id, schoolId)
  return Response.json({ vorderingen })
}
