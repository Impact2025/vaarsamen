'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPusherClient, channels, events } from '@/lib/pusher'
import type { Message } from '@/types'

export function useMessages(matchId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(channels.match(matchId))

    channel.bind(events.newMessage, (data: { message: Message }) => {
      setMessages(prev => {
        // Voorkom duplicaten
        if (prev.some(m => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channels.match(matchId))
    }
  }, [matchId])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) throw new Error('Bericht sturen mislukt')

      const data = await res.json()
      setMessages(prev => {
        if (prev.some(m => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
    } catch (err) {
      console.error('Bericht fout:', err)
    } finally {
      setSending(false)
    }
  }, [matchId, sending])

  return { messages, sendMessage, sending }
}
