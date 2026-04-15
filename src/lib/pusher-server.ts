import Pusher from 'pusher'

// Lazy init — don't crash at import time when env vars are missing
let _instance: Pusher | null = null

function getInstance(): Pusher | null {
  if (_instance) return _instance
  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET || !process.env.NEXT_PUBLIC_PUSHER_KEY) {
    return null
  }
  _instance = new Pusher({
    appId:   process.env.PUSHER_APP_ID,
    key:     process.env.NEXT_PUBLIC_PUSHER_KEY,
    secret:  process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu',
    useTLS:  true,
  })
  return _instance
}

/** Stuur een event naar een Pusher channel. No-op als Pusher niet geconfigureerd is. */
export async function pusherTrigger(channel: string, event: string, data: unknown): Promise<void> {
  const pusher = getInstance()
  if (!pusher) return
  await pusher.trigger(channel, event, data)
}

export const channels = {
  match: (matchId: string) => `private-match-${matchId}`,
  user:  (userId: string)  => `private-user-${userId}`,
}

export const events = {
  newMessage:  'new-message',
  newMatch:    'new-match',
  matchUpdate: 'match-update',
} as const

/** Voor Pusher auth endpoint — kan null zijn als niet geconfigureerd */
export function getPusherServerInstance(): Pusher | null {
  return getInstance()
}
