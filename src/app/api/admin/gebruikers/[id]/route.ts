import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// PATCH /api/admin/gebruikers/[id] — toggle isVisible, isFeatured, subscriptionTier, cwoVerified
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const ALLOWED = ['isVisible', 'isFeatured', 'subscriptionTier', 'cwoVerified'] as const
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 1) {
    return Response.json({ error: 'Geen geldige velden' }, { status: 400 })
  }

  const [updated] = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning()
  return Response.json({ profile: updated })
}

// DELETE /api/admin/gebruikers/[id] — soft-delete (AVG)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { id } = await params
  await db.update(profiles).set({ deletedAt: new Date(), deletedBy: session.user.id }).where(eq(profiles.id, id))
  return Response.json({ ok: true })
}
