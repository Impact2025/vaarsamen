import { auth } from '@/lib/auth'
import { seedKB2Skills } from '@/lib/db/seeds/skills'

// POST /api/admin/skills/seed — seed KB2 vaardigheden (eenmalig, idempotent)
export async function POST() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Admin toegang vereist' }, { status: 403 })
  }

  const result = await seedKB2Skills()
  return Response.json({ ok: true, ...result })
}
