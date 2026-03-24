import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tochten } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// DELETE /api/admin/tochten/[id] — soft-delete tocht
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { id } = await params
  await db.update(tochten).set({ deletedAt: new Date() }).where(eq(tochten.id, id))
  return Response.json({ ok: true })
}
