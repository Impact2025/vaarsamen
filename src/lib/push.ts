import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const VAPID_PUBLIC  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY             ?? ''
const VAPID_EMAIL   = process.env.VAPID_EMAIL                   ?? 'mailto:info@vaarsamen.nl'

let configured = false
function ensureConfigured() {
  if (configured || !VAPID_PUBLIC || !VAPID_PRIVATE) return
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
  configured = true
}

export interface PushPayload {
  title: string
  body:  string
  url?:  string
  icon?: string
}

/**
 * Stuur een push notificatie naar één profiel.
 * Verwijdert verlopen subscriptions automatisch.
 */
export async function sendPushToProfile(profileId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return  // env vars niet geconfigureerd
  ensureConfigured()

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.profileId, profileId))

  const data = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    url:   payload.url  ?? '/',
    icon:  payload.icon ?? '/icons/192',
  })

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data
        )
      } catch (err: any) {
        // 404/410 = verlopen subscription — verwijder uit DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id))
        }
      }
    })
  )
}
