'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

type Bericht = {
  id: string; schoolId: string; schoolNaam: string; fromRole: string
  titel: string; bericht: string; gelezenOp: Date | null; createdAt: Date | null
}

type Reactie = { id: string; bericht: string; createdAt: Date | null; vanNaam: string | null }

const ROL_LABEL: Record<string, string> = {
  eigenaar: 'Eigenaar', instructeur: 'Instructeur', cursist: 'Cursist', lid: 'Lid', klusser: 'Klusser',
}

export function SchoolBerichtenClient({ initialBerichten }: { initialBerichten: Bericht[] }) {
  const [berichten, setBerichten] = useState<Bericht[]>(initialBerichten)
  const [openId, setOpenId]     = useState<string | null>(null)
  const [replies, setReplies]   = useState<Record<string, Reactie[]>>({})
  const [draft, setDraft]       = useState('')
  const [busy, setBusy]         = useState(false)

  // Markeer als gelezen bij openen.
  useEffect(() => {
    if (initialBerichten.some(b => !b.gelezenOp)) {
      fetch('/api/school-berichten?markRead=1').catch(() => {})
      setBerichten(prev => prev.map(b => ({ ...b, gelezenOp: b.gelezenOp ?? new Date() })))
    }
  }, [initialBerichten])

  async function openBericht(b: Bericht) {
    setOpenId(b.id)
    if (!replies[b.id]) {
      const res = await fetch(`/api/school-berichten/${b.id}`)
      if (res.ok) {
        const data = await res.json()
        setReplies(prev => ({ ...prev, [b.id]: data.replies ?? [] }))
      }
    }
  }

  async function stuurReactie(berichtId: string) {
    if (!draft.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/school-berichten/${berichtId}/reactie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bericht: draft }),
      })
      if (res.ok) {
        const data = await res.json()
        setReplies(prev => ({
          ...prev,
          [berichtId]: [...(prev[berichtId] ?? []), { id: data.id, bericht: draft, createdAt: new Date(), vanNaam: 'Jij' }],
        }))
        setDraft('')
      }
    } finally {
      setBusy(false)
    }
  }

  if (berichten.length === 0) {
    return (
      <div className="px-4 pt-6 pb-28">
        <h1 className="font-headline font-black text-2xl text-on-surface">Berichten van je school</h1>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <motion.span
            className="material-symbols-outlined text-6xl text-on-surface-variant mb-4"
            aria-hidden="true"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            campaign
          </motion.span>
          <h2 className="font-headline font-bold text-xl text-on-surface mb-2">Nog geen berichten</h2>
          <p className="font-body text-sm text-on-surface-variant max-w-xs">
            Je zeilschool kan je hier rechtstreeks berichten sturen. Handig voor lesroosters,
            afgelastingen of andere mededelingen.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-28">
      <header className="mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Berichten van je school</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">{berichten.length} berichten</p>
      </header>

      <ul className="space-y-3">
        {berichten.map((b, i) => (
          <motion.li
            key={b.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
          >
            <button
              onClick={() => openBericht(b)}
              className="w-full text-left rounded-2xl glass-card border border-white/5 p-4
                         hover:border-primary/20 transition-colors focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-label font-bold text-on-surface">{b.titel}</span>
                {!b.gelezenOp && (
                  <span className="w-2.5 h-2.5 rounded-full gradient-primary flex-shrink-0" aria-label="Ongelezen" />
                )}
              </div>
              <p className="font-body text-sm text-on-surface mt-2">{b.bericht}</p>
              <p className="font-label text-[10px] text-on-surface-variant mt-3 uppercase tracking-wider">
                {b.schoolNaam} · {ROL_LABEL[b.fromRole] ?? b.fromRole}
                {b.createdAt ? ` · ${formatDistanceToNow(new Date(b.createdAt), { addSuffix: true, locale: nl })}` : ''}
              </p>
            </button>

            <AnimatePresence>
              {openId === b.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-2xl bg-surface-container-high/60 p-4 space-y-3">
                    {(replies[b.id] ?? []).map(r => (
                      <div key={r.id} className="rounded-xl bg-primary/10 p-3">
                        <p className="font-body text-sm text-on-surface">{r.bericht}</p>
                        <p className="font-label text-[10px] text-on-surface-variant mt-1 uppercase">
                          {r.vanNaam ?? 'Jij'}
                          {r.createdAt ? ` · ${formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: nl })}` : ''}
                        </p>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1">
                      <input
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') stuurReactie(b.id) }}
                        placeholder="Reageer naar je zeilschool…"
                        className="flex-1 rounded-full bg-surface-container px-4 py-2 text-sm text-on-surface
                                   outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <button
                        onClick={() => stuurReactie(b.id)}
                        disabled={busy || !draft.trim()}
                        className="px-4 rounded-full gradient-primary text-on-primary font-label text-sm font-bold
                                   disabled:opacity-50 active:scale-95 transition-all"
                      >
                        Verstuur
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
