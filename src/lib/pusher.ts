import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher (voor API routes)
export const pusherServer = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu',
  useTLS:  true,
})

// Client-side Pusher (singleton)
let pusherClientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (typeof window === 'undefined') throw new Error('getPusherClient alleen client-side aanroepen')

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster:      process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu',
      channelAuthorization: {
        endpoint: '/api/pusher/auth',
        transport: 'ajax',
      },
    })
  }

  return pusherClientInstance
}

// Channel naam conventies
export const channels = {
  match:  (matchId: string) => `private-match-${matchId}`,
  user:   (userId: string)  => `private-user-${userId}`,
}

// Event namen
export const events = {
  newMessage:  'new-message',
  newMatch:    'new-match',
  matchUpdate: 'match-update',
} as const
