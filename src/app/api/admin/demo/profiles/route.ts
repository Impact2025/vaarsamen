import { auth } from '@/lib/auth'
import { seedDemoProfiles } from '@/lib/db/seeds/demo-profiles'
import { logger } from '@/lib/logger'

// POST /api/admin/demo/profiles — seed demo zeiler-profielen voor de discovery feed
// Idempotent: veilig om meerdere keren uit te voeren
export async function POST() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Admin toegang vereist' }, { status: 403 })
  }

  try {
    const result = await seedDemoProfiles()
    return Response.json({ ok: true, ...result })
  } catch (err) {
    logger.error('Demo profiles seed mislukt', { err: String(err) })
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
