import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reports } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// PATCH /api/admin/meldingen/[id] — update status: reviewed | resolved | dismissed
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json()

  if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
    return Response.json({ error: 'Ongeldige status' }, { status: 400 })
  }

  const [updated] = await db
    .update(reports)
    .set({ status, reviewedAt: new Date(), reviewedBy: session.user.id })
    .where(eq(reports.id, id))
    .returning()

  return Response.json({ report: updated })
}
