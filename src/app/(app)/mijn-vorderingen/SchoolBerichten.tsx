'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

type Bericht = {
  id: string
  inhoud: string
  courseId: string | null
  createdAt: string | null
  sender: { id: string; name: string | null; email: string; image: string | null } | null
}

interface Props {
  schoolId:   string
  schoolNaam: string
  myUserId:   string
}

export function SchoolBerichten({ schoolId, schoolNaam, myUserId }: Props) {
  const [berichten, setBerichten] = useState<Bericht[]>([])
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(false)
  const [tekst, setTekst]         = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    fetch(`/api/school/${schoolId}/berichten`)
      .then(r => r.json())
      .then(d => { setBerichten(d.berichten ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [schoolId])

  async function handleVerzenden(e: React.FormEvent) {
    e.preventDefault()
    if (!tekst.trim()) return
    setSending(true); setError('')
    const res = await fetch(`/api/school/${schoolId}/berichten`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ inhoud: tekst.trim() }),
    })
    if (res.ok) {
      const refreshed = await fetch(`/api/school/${schoolId}/berichten`).then(r => r.json())
      setBerichten(refreshed.berichten ?? [])
      setTekst(''); setOpen(false)
    } else {
      const d = await res.json()
      setError(d.error?.toString() ?? 'Fout bij verzenden')
    }
    setSending(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/school/${schoolId}/berichten?id=${id}`, { method: 'DELETE' })
    if (res.ok) setBerichten(prev => prev.filter(b => b.id !== id))
  }

  return (
    <section aria-label={`Berichten ${schoolNaam}`}>
      <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">forum</span>
            <h3 className="font-headline font-semibold text-base text-on-surface">Berichten</h3>
            {!loading && berichten.length > 0 && (
              <span className="font-label text-xs text-on-surface-variant">({berichten.length})</span>
            )}
          </div>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-label text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
            Bericht sturen
          </button>
        </div>

        {/* Nieuw bericht formulier */}
        {open && (
          <form onSubmit={handleVerzenden} className="px-4 py-3 border-b border-white/5 space-y-2 bg-surface-container-high/30">
            <textarea
              value={tekst}
              onChange={e => setTekst(e.target.value)}
              rows={3}
              placeholder="Schrijf een bericht aan je instructeur(s)…"
              maxLength={2000}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface font-body text-sm focus:outline-none focus:border-primary/60 resize-none"
            />
            {error && <p className="font-body text-xs text-error" role="alert">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setOpen(false); setTekst(''); setError('') }}
                className="px-3 py-1.5 rounded-xl font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={sending || !tekst.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">send</span>
                {sending ? 'Verzenden…' : 'Verzenden'}
              </button>
            </div>
          </form>
        )}

        {/* Berichten lijst */}
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-surface-container-high rounded-xl animate-pulse" />)}
          </div>
        ) : berichten.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="font-body text-sm text-on-surface-variant">Nog geen berichten.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {berichten.map(b => (
              <div key={b.id} className="flex items-start gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex-shrink-0 overflow-hidden flex items-center justify-center mt-0.5">
                  {b.sender?.image
                    ? <img src={b.sender.image} alt="" className="w-full h-full object-cover" />
                    : <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">person</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-label text-sm font-semibold text-on-surface">
                      {b.sender?.name ?? b.sender?.email ?? 'Onbekend'}
                    </span>
                    {b.createdAt && (
                      <span className="font-label text-xs text-on-surface-variant">
                        {format(new Date(b.createdAt), 'd MMM · HH:mm', { locale: nl })}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-sm text-on-surface mt-0.5 whitespace-pre-wrap">{b.inhoud}</p>
                </div>
                {b.sender?.id === myUserId && (
                  <button
                    onClick={() => handleDelete(b.id)}
                    aria-label="Bericht verwijderen"
                    className="p-1.5 rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
