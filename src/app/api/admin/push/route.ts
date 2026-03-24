import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import webpush from 'web-push'

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? 'mailto:info@vaarsamen.nl'

// POST /api/admin/push — broadcast push naar alle subscribers
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return Response.json({ error: 'VAPID keys niet geconfigureerd' }, { status: 500 })
  }

  const { title, body, url } = await req.json()
  if (!title || !body) return Response.json({ error: 'title en body zijn verplicht' }, { status: 400 })

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

  const subs = await db.select().from(pushSubscriptions)
  const payload = JSON.stringify({ title, body, url: url ?? '/' })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
    )
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return Response.json({ sent, failed, total: subs.length })
}
