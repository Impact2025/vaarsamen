import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// POST /api/push/subscribe — sla push subscription op
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: 'Ongeldige subscription' }, { status: 400 })
  }

  // Upsert — verwijder eventueel oud record van dit endpoint
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
  await db.insert(pushSubscriptions).values({
    profileId: profile.id,
    endpoint,
    p256dh:    keys.p256dh,
    auth:      keys.auth,
  })

  return Response.json({ ok: true }, { status: 201 })
}

// DELETE /api/push/subscribe — verwijder subscription (bijv. bij uitloggen)
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { endpoint } = await req.json()
  if (endpoint) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
  }

  return Response.json({ ok: true })
}
