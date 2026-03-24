import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// PATCH /api/admin/cwo/[id] — goedkeuren of afwijzen
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { id } = await params
  const { actie } = await req.json()

  if (!['goedkeuren', 'afwijzen'].includes(actie)) {
    return Response.json({ error: 'Ongeldige actie' }, { status: 400 })
  }

  const updates =
    actie === 'goedkeuren'
      ? { cwoVerified: true, cwoVerifiedAt: new Date(), cwoVerifiedBy: session.user.id }
      : { cwoDocumentUrl: null as unknown as string, cwoVerified: false }

  const [updated] = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning()
  return Response.json({ profile: updated })
}
