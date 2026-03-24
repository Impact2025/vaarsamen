'use client'

import { useState } from 'react'

export default function AdminPushPage() {
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [url, setUrl]       = useState('/')
  const [sending, setSending] = useState(false)
  const [result, setResult]   = useState<{ sent?: number; failed?: number; total?: number; error?: string } | null>(null)

  const send = async () => {
    if (!title.trim() || !body.trim()) return
    if (!confirm(`Broadcast versturen naar ALLE subscribers?\n\n"${title}"\n${body}`)) return
    setSending(true)
    setResult(null)
    const res = await fetch('/api/admin/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), body: body.trim(), url }),
    })
    const data = await res.json()
    setResult(data)
    setSending(false)
    if (res.ok) { setTitle(''); setBody(''); setUrl('/') }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="font-headline font-black text-2xl text-on-surface">Broadcast Push</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Stuur een push notificatie naar alle gebruikers met push ingeschakeld.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
        <div>
          <label className="font-label text-xs text-on-surface-variant mb-1.5 block">Titel *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="⛵ Nieuws van VaarSamen!"
            maxLength={100}
            className="w-full px-4 py-3 bg-surface-container border border-white/10 rounded-xl text-on-surface
                       placeholder:text-on-surface-variant/40 font-body text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="font-label text-xs text-on-surface-variant mb-1.5 block">Bericht *</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Schrijf hier je bericht…"
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 bg-surface-container border border-white/10 rounded-xl text-on-surface
                       placeholder:text-on-surface-variant/40 font-body text-sm focus:outline-none focus:border-primary/50 resize-none"
          />
          <p className="text-right font-label text-xs text-on-surface-variant mt-1">{body.length}/300</p>
        </div>
        <div>
          <label className="font-label text-xs text-on-surface-variant mb-1.5 block">URL (bij klik)</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="/tochten"
            className="w-full px-4 py-3 bg-surface-container border border-white/10 rounded-xl text-on-surface
                       placeholder:text-on-surface-variant/40 font-body text-sm focus:outline-none focus:border-primary/50"
          />
        </div>

        {result && (
          <div className={`p-4 rounded-xl border ${result.error ? 'bg-error/10 border-error/20' : 'bg-primary/10 border-primary/20'}`} role="alert">
            {result.error ? (
              <p className="font-label text-sm text-error">{result.error}</p>
            ) : (
              <p className="font-label text-sm text-primary font-bold">
                ✓ {result.sent} van {result.total} subscribers bereikt
                {(result.failed ?? 0) > 0 && ` (${result.failed} mislukt)`}
              </p>
            )}
          </div>
        )}

        <button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full py-4 rounded-xl gradient-primary text-on-primary font-label font-bold text-base
                     shadow-glow disabled:opacity-40 active:scale-95 transition-all"
        >
          {sending ? 'Versturen…' : '📣 Verstuur broadcast'}
        </button>
      </div>

      {/* Waarschuwing */}
      <div className="mt-4 p-4 rounded-xl border border-amber-400/20 bg-amber-400/5">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-400 text-base mt-0.5" aria-hidden="true">warning</span>
          <p className="font-label text-xs text-amber-400">
            Dit verstuurt een push notificatie naar <strong>alle</strong> ingeschreven gebruikers.
            Gebruik spaarzaam.
          </p>
        </div>
      </div>
    </div>
  )
}
