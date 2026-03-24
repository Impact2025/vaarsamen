'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useMessages } from '@/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Profile, Message } from '@/types'

interface ChatClientProps {
  matchId:        string
  myProfileId:    string
  otherProfile:   Profile
  hasSailed:      boolean
  initialMessages: Message[]
}

export function ChatClient({ matchId, myProfileId, otherProfile, hasSailed, initialMessages }: ChatClientProps) {
  const router  = useRouter()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, sending } = useMessages(matchId, initialMessages)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 glass-card border-b border-white/5 z-10">
        <button
          onClick={() => router.back()}
          aria-label="Terug naar matches"
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">arrow_back</span>
        </button>

        <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
          {otherProfile.photoUrl ? (
            <Image
              src={otherProfile.photoUrl}
              alt={`Foto van ${otherProfile.displayName}`}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-xl" aria-hidden="true">person</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-label font-bold text-sm text-on-surface truncate">{otherProfile.displayName}</p>
          <p className="font-label text-[10px] text-on-surface-variant">{otherProfile.homePort ?? 'Zeiler'}</p>
        </div>

        {!hasSailed && (
          <button
            onClick={async () => {
              await fetch(`/api/matches/${matchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hasSailed: true }),
              })
              router.push(`/matches/${matchId}/review`)
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full gradient-primary text-on-primary
                       font-label text-xs font-bold shadow-glow active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Markeer als gevaren en schrijf een review"
          >
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">sailing</span>
            Gevaren!
          </button>
        )}
      </header>

      {/* Berichten */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        aria-label="Berichten"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="font-body text-sm text-on-surface-variant">
              Nog geen berichten. Zeg hoi! 👋
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === myProfileId
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl ${
                  isMine
                    ? 'gradient-primary text-on-primary rounded-br-sm'
                    : 'glass-card text-on-surface rounded-bl-sm border border-white/5'
                }`}
              >
                {msg.deletedAt ? (
                  <p className="font-body text-xs italic opacity-60">Bericht verwijderd</p>
                ) : (
                  <p className="font-body text-sm leading-relaxed">{msg.content}</p>
                )}
                <p className={`font-label text-[10px] mt-1 ${isMine ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: nl })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="px-4 pt-4 pb-[max(1rem,_env(safe-area-inset-bottom))] glass-card border-t border-white/5">
        <div className="flex items-end gap-3 max-w-md mx-auto">
          <label htmlFor="message-input" className="sr-only">Bericht typen</label>
          <textarea
            id="message-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Typ een bericht..."
            rows={1}
            maxLength={1000}
            className="flex-1 px-4 py-3 bg-surface-container-high rounded-2xl
                       text-on-surface placeholder:text-on-surface-variant/40
                       border border-white/10 focus:border-primary/50
                       font-body text-base resize-none max-h-32
                       focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            aria-label="Bericht versturen"
            className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center
                       shadow-glow disabled:opacity-40 disabled:cursor-not-allowed
                       active:scale-90 transition-all flex-shrink-0
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
              send
            </span>
          </button>
        </div>
      </footer>
    </div>
  )
}
