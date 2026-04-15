'use client'

import PusherClient from 'pusher-js'

let pusherClientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') return null
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) return null

  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu',
      channelAuthorization: {
        endpoint:  '/api/pusher/auth',
        transport: 'ajax',
      },
    })
  }
  return pusherClientInstance
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
