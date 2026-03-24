import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'

// GET /api/profiles/me — Eigen profiel ophalen
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  return Response.json({ profile })
}
