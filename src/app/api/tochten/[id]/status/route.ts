import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { tochten } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

const GELDIGE_STATUSSEN = ['open', 'vol', 'geannuleerd'] as const

// PATCH /api/tochten/[id]/status — poster wijzigt status van zijn tocht
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const [tocht] = await db.select().from(tochten).where(eq(tochten.id, id)).limit(1)
  if (!tocht || tocht.profileId !== profile.id) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { status } = await req.json()
  if (!GELDIGE_STATUSSEN.includes(status)) {
    return Response.json({ error: 'Ongeldige status' }, { status: 400 })
  }

  const [updated] = await db
    .update(tochten)
    .set({ status, updatedAt: new Date() })
    .where(eq(tochten.id, id))
    .returning()

  return Response.json({ tocht: updated })
}
