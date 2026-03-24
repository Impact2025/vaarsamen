import { auth } from '@/lib/auth'
import { getTochtenCountNieuw } from '@/lib/db/queries/tochten'

// GET /api/tochten/count?since=ISO-timestamp
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sinceParam = searchParams.get('since')
  const since      = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const nieuw = await getTochtenCountNieuw(since)
  return Response.json({ nieuw })
}
