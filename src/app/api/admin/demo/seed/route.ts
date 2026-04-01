import { auth } from '@/lib/auth'
import { seedDemo } from '@/lib/db/seeds/demo'
import { logger } from '@/lib/logger'

// POST /api/admin/demo/seed — seed demo-school met cursisten, lessen en beoordelingen
// Idempotent: veilig om meerdere keren uit te voeren
export async function POST() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Admin toegang vereist' }, { status: 403 })
  }

  try {
    const result = await seedDemo()
    return Response.json({ ok: true, ...result })
  } catch (err) {
    logger.error('Demo seed mislukt', { err: String(err) })
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
