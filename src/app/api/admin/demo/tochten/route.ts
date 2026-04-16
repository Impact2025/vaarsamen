import { auth } from '@/lib/auth'
import { seedDemoTochten } from '@/lib/db/seeds/demo-profiles'
import { logger } from '@/lib/logger'

// POST /api/admin/demo/tochten — seed demo tochten (oproepen) voor de tochten-pagina
// Idempotent: vaste UUIDs, datum wordt ververst zodat tochten altijd in de toekomst liggen
export async function POST() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Admin toegang vereist' }, { status: 403 })
  }

  try {
    const result = await seedDemoTochten()
    return Response.json({ ok: true, ...result })
  } catch (err) {
    logger.error('Demo tochten seed mislukt', { err: String(err) })
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
