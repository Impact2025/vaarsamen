'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { SAILING_AREAS, BOAT_LABELS, CWO_LABELS, GEBIED_COLOR_HEX } from '@/types'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { TochtDetail } from '@/lib/db/queries/tochten'

interface Props extends TochtDetail {
  myProfileId: string | null
  isPoster:    boolean
}

export function TochtDetailClient({ tocht, poster, aanmeldingen, myProfileId, isPoster }: Props) {
  const router = useRouter()
  const [bericht, setBericht]       = useState('')
  const [aanmelden, setAanmelden]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)
  const [localAanmeldingen, setLocalAanmeldingen] = useState(aanmeldingen)
  const [copied, setCopied]         = useState(false)
  const [tochtStatus, setTochtStatus]   = useState(tocht.status)
  const [statusSaving, setStatusSaving] = useState(false)
  const [revieweeId, setRevieweeId]     = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText]     = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewedIds, setReviewedIds]   = useState<Set<string>>(new Set())

  const vandaag  = new Date().toISOString().slice(0, 10)
  const isVoorbij = (tocht.datum as string) < vandaag

  const datum       = parseISO(tocht.datum as string)
  const datumLabel  = isToday(datum) ? 'Vandaag' : isTomorrow(datum) ? 'Morgen'
    : format(datum, 'EEEE d MMMM yyyy', { locale: nl })
  const gebiedLabel = SAILING_AREAS.find(a => a.id === tocht.vaargebied)?.label ?? tocht.vaargebied
  const kleur       = GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5'

  const myAanmelding  = localAanmeldingen.find(a => a.profiel.id === myProfileId)
  const canAanmelden  = !isPoster && !myAanmelding && tocht.status === 'open'
  const wachtend      = localAanmeldingen.filter(a => a.aanmelding.status === 'wacht')
  const geaccepteerd  = localAanmeldingen.filter(a => a.aanmelding.status === 'geaccepteerd')
  const afgewezen     = localAanmeldingen.filter(a => a.aanmelding.status === 'afgewezen')

  const handleAanmelden = async () => {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/tochten/${tocht.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bericht }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Er ging iets mis')
      setSuccess(true); setAanmelden(false)
      const updated = await fetch(`/api/tochten/${tocht.id}`).then(r => r.json())
      setLocalAanmeldingen(updated.aanmeldingen ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis')
    } finally { setSaving(false) }
  }

  const handleStatus = async (aanmeldingId: string, status: 'geaccepteerd' | 'afgewezen') => {
    const res = await fetch(`/api/tochten/${tocht.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aanmeldingId, status }),
    })
    if (res.ok) {
      const updated = await fetch(`/api/tochten/${tocht.id}`).then(r => r.json())
      setLocalAanmeldingen(updated.aanmeldingen ?? [])
    }
  }

  const handleTochtStatus = async (nieuwStatus: string) => {
    setStatusSaving(true)
    const res = await fetch(`/api/tochten/${tocht.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nieuwStatus }),
    })
    if (res.ok) setTochtStatus(nieuwStatus as typeof tocht.status)
    setStatusSaving(false)
  }

  const handleReview = async () => {
    if (!revieweeId) return
    setReviewSaving(true)
    const res = await fetch(`/api/tochten/${tocht.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revieweeId, rating: reviewRating, text: reviewText }),
    })
    if (res.ok) {
      setReviewedIds(prev => new Set([...prev, revieweeId]))
      setRevieweeId(null)
      setReviewText('')
      setReviewRating(5)
    }
    setReviewSaving(false)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: tocht.titel, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const mapsUrl = tocht.locatie
    ? `https://maps.google.com/?q=${encodeURIComponent(tocht.locatie)}`
    : null

  return (
    <main className="px-4 pt-6 pb-28">
      {/* Header */}
      <header className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          aria-label="Terug"
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors flex-shrink-0
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">arrow_back</span>
        </button>
        <h1 className="font-headline font-black text-xl text-on-surface leading-tight flex-1 line-clamp-2">
          {tocht.titel}
        </h1>
        <button
          onClick={handleShare}
          aria-label="Tocht delen"
          className="p-2 rounded-full hover:bg-surface-container-high transition-colors flex-shrink-0 relative
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
            {copied ? 'check' : 'share'}
          </span>
          {copied && (
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-label text-[10px] text-primary">
              Gekopieerd!
            </span>
          )}
        </button>
      </header>

      {/* Kleur hero balk */}
      <div className="h-1.5 w-full rounded-full mb-5" style={{ background: `linear-gradient(90deg, ${kleur}, ${kleur}66)` }} />

      {/* Datum + tijd + gebied */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: kleur + '22', border: `1px solid ${kleur}44` }}
        >
          <span className="material-symbols-outlined text-xs" style={{ color: kleur }} aria-hidden="true">calendar_today</span>
          <span className="font-label text-xs font-black capitalize" style={{ color: kleur }}>{datumLabel}</span>
        </div>
        {tocht.vertrekTijd && (
          <span className="px-3 py-1.5 rounded-full bg-surface-container border border-white/10 font-label text-xs text-on-surface-variant">
            ⚓ {tocht.vertrekTijd} vertrek
          </span>
        )}
        <span className="px-3 py-1.5 rounded-full bg-surface-container border border-white/10 font-label text-xs text-on-surface-variant">
          {gebiedLabel}
        </span>
      </div>

      {/* Locatie met Google Maps link */}
      {tocht.locatie && (
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: kleur }} aria-hidden="true">location_on</span>
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label text-sm text-on-surface underline-offset-2 hover:underline"
            >
              {tocht.locatie}
              <span className="material-symbols-outlined text-xs text-on-surface-variant ml-1 align-middle" aria-hidden="true">open_in_new</span>
            </a>
          ) : (
            <span className="font-label text-sm text-on-surface">{tocht.locatie}</span>
          )}
        </div>
      )}

      {/* Tags rij */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tocht.bootType && (
          <span className="px-3 py-1 rounded-full bg-surface-container-high border border-white/10 font-label text-xs text-on-surface-variant">
            {BOAT_LABELS[tocht.bootType as keyof typeof BOAT_LABELS]}
          </span>
        )}
        {tocht.cwoMinimum && tocht.cwoMinimum !== 'geen' && (
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-xs text-primary">
            min. {CWO_LABELS[tocht.cwoMinimum as keyof typeof CWO_LABELS]}
          </span>
        )}
        <span className="px-3 py-1 rounded-full bg-surface-container-high border border-white/10 font-label text-xs text-on-surface-variant">
          {tocht.aantalPlaatsen} {tocht.aantalPlaatsen === 1 ? 'plek' : 'plekken'}
        </span>
        {localAanmeldingen.length > 0 && (
          <span className="px-3 py-1 rounded-full border font-label text-xs font-bold"
            style={{ backgroundColor: kleur + '22', borderColor: kleur + '44', color: kleur }}>
            {localAanmeldingen.length} {localAanmeldingen.length === 1 ? 'aanmelding' : 'aanmeldingen'}
          </span>
        )}
      </div>

      {/* Omschrijving */}
      {tocht.beschrijving && (
        <div className="glass-card rounded-2xl p-5 border border-white/5 mb-5">
          <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
            {tocht.beschrijving}
          </p>
        </div>
      )}

      {/* Poster card */}
      <div className="glass-card rounded-2xl p-4 border border-white/5 mb-5">
        <p className="font-label text-xs text-on-surface-variant mb-3 uppercase tracking-widest">Geplaatst door</p>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container-high flex-shrink-0">
            {poster.photoUrl ? (
              <Image src={poster.photoUrl} alt={poster.displayName} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl" aria-hidden="true">person</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-headline font-bold text-base text-on-surface">{poster.displayName}</span>
              {poster.cwoVerified && (
                <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-label="CWO geverifieerd">verified</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {poster.cwoLevel && poster.cwoLevel !== 'geen' && (
                <span className="font-label text-xs text-on-surface-variant">
                  {CWO_LABELS[poster.cwoLevel as keyof typeof CWO_LABELS]}
                </span>
              )}
              {poster.averageRating && (poster.reviewCount ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">star</span>
                  <span className="font-label text-xs text-primary font-bold">{poster.averageRating.toFixed(1)}</span>
                  <span className="font-label text-xs text-on-surface-variant">({poster.reviewCount})</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {poster.bio && (
          <p className="font-body text-sm text-on-surface-variant mt-3 line-clamp-3">{poster.bio}</p>
        )}
      </div>

      {/* Poster: tocht status beheren */}
      {isPoster && !isVoorbij && (
        <div className="glass-card rounded-2xl p-4 border border-white/5 mb-5">
          <p className="font-label text-xs text-on-surface-variant mb-3 uppercase tracking-widest">Tocht beheren</p>
          <div className="flex gap-2 flex-wrap">
            {(['open', 'vol', 'geannuleerd'] as const).map(s => (
              <button
                key={s}
                onClick={() => s !== tochtStatus && handleTochtStatus(s)}
                disabled={statusSaving || s === tochtStatus}
                className={`flex-1 py-2.5 rounded-xl font-label text-sm font-bold transition-all active:scale-95
                  ${s === tochtStatus
                    ? s === 'open'        ? 'bg-primary/20 text-primary border border-primary/30'
                    : s === 'vol'         ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                    :                       'bg-error/20 text-error border border-error/30'
                    : 'border border-white/10 text-on-surface-variant hover:border-white/20 disabled:opacity-50'
                  }`}
              >
                {s === 'open' ? '🟢 Open' : s === 'vol' ? '🟡 Vol' : '🔴 Geannuleerd'}
              </button>
            ))}
          </div>
          {statusSaving && (
            <p className="font-label text-xs text-on-surface-variant mt-2 text-center">Opslaan…</p>
          )}
        </div>
      )}

      {/* Status eigen aanmelding */}
      {myAanmelding && (
        <div className={`p-4 rounded-2xl border mb-5 ${
          myAanmelding.aanmelding.status === 'geaccepteerd' ? 'bg-primary/10 border-primary/20' :
          myAanmelding.aanmelding.status === 'afgewezen'   ? 'bg-error/10 border-error/20' :
          'bg-surface-container border-white/10'}`}
        >
          {myAanmelding.aanmelding.status === 'geaccepteerd' && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <div>
                <p className="font-label text-sm font-bold text-primary">Geaccepteerd!</p>
                <p className="font-label text-xs text-on-surface-variant">Veel wind en plezier. Neem contact op met de poster.</p>
              </div>
            </div>
          )}
          {myAanmelding.aanmelding.status === 'afgewezen' && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-xl">cancel</span>
              <p className="font-label text-sm text-error">Je aanmelding is helaas afgewezen.</p>
            </div>
          )}
          {myAanmelding.aanmelding.status === 'wacht' && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">hourglass_empty</span>
              <div>
                <p className="font-label text-sm font-bold text-on-surface">Aanmelding verstuurd</p>
                <p className="font-label text-xs text-on-surface-variant">Wacht op goedkeuring van {poster.displayName}.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Succes */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-5"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <div>
              <p className="font-label text-sm font-bold text-primary">Aanmelding verstuurd!</p>
              <p className="font-label text-xs text-on-surface-variant">{poster.displayName} beoordeelt je aanvraag.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Aanmeldingen voor de poster */}
      {isPoster && (
        <section className="mb-6" aria-label="Aanmeldingen beheren">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-bold text-lg text-on-surface">Aanmeldingen</h2>
            {localAanmeldingen.length > 0 && (
              <div className="flex gap-2">
                {geaccepteerd.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 font-label text-xs text-primary font-bold">
                    {geaccepteerd.length} geaccepteerd
                  </span>
                )}
                {wachtend.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-high font-label text-xs text-on-surface-variant">
                    {wachtend.length} wachtend
                  </span>
                )}
              </div>
            )}
          </div>

          {localAanmeldingen.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 border border-white/5 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block" aria-hidden="true">group</span>
              <p className="font-body text-sm text-on-surface-variant">Nog geen aanmeldingen. Deel de link om meer zeilers te bereiken!</p>
              <button
                onClick={handleShare}
                className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-full border border-white/10 font-label text-xs text-on-surface-variant hover:border-primary/30 transition-all"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">share</span>
                Tocht delen
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {[...wachtend, ...geaccepteerd, ...afgewezen].map(({ aanmelding, profiel }) => (
                <li key={aanmelding.id} className="glass-card rounded-2xl p-4 border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                      {profiel.photoUrl ? (
                        <Image src={profiel.photoUrl} alt={profiel.displayName} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">person</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-label text-sm font-bold text-on-surface">{profiel.displayName}</span>
                        {profiel.cwoVerified && (
                          <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        )}
                        <span className={`ml-auto px-2 py-0.5 rounded-full font-label text-xs font-bold ${
                          aanmelding.status === 'geaccepteerd' ? 'bg-primary/10 text-primary' :
                          aanmelding.status === 'afgewezen'   ? 'bg-error/10 text-error' :
                          'bg-surface-container-high text-on-surface-variant'}`}
                        >
                          {aanmelding.status === 'geaccepteerd' ? '✓ Geaccepteerd' :
                           aanmelding.status === 'afgewezen'   ? '✕ Afgewezen' : '⏳ Wachtend'}
                        </span>
                      </div>
                      {profiel.cwoLevel && profiel.cwoLevel !== 'geen' && (
                        <p className="font-label text-xs text-on-surface-variant mb-1">
                          {CWO_LABELS[profiel.cwoLevel as keyof typeof CWO_LABELS]}
                        </p>
                      )}
                      {aanmelding.bericht && (
                        <p className="font-body text-sm text-on-surface-variant italic">"{aanmelding.bericht}"</p>
                      )}
                      {aanmelding.status === 'wacht' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleStatus(aanmelding.id, 'geaccepteerd')}
                            className="flex-1 py-2.5 rounded-xl gradient-primary text-on-primary font-label text-sm font-bold shadow-glow active:scale-95 transition-all"
                          >
                            Accepteren
                          </button>
                          <button
                            onClick={() => handleStatus(aanmelding.id, 'afgewezen')}
                            className="flex-1 py-2.5 rounded-xl border border-error/30 text-error font-label text-sm font-bold active:scale-95 transition-all"
                          >
                            Afwijzen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Reviews na de tocht */}
      {isVoorbij && (() => {
        const reviewTargets: { id: string; name: string; photo: string | null }[] = []
        if (isPoster) {
          geaccepteerd.forEach(({ aanmelding, profiel }) => {
            if (!reviewedIds.has(profiel.id)) {
              reviewTargets.push({ id: profiel.id, name: profiel.displayName, photo: profiel.photoUrl ?? null })
            }
          })
        } else if (myAanmelding?.aanmelding.status === 'geaccepteerd' && !reviewedIds.has(poster.id)) {
          reviewTargets.push({ id: poster.id, name: poster.displayName, photo: poster.photoUrl ?? null })
        }
        if (reviewTargets.length === 0 && reviewedIds.size === 0) return null
        return (
          <section className="mb-6" aria-label="Reviews schrijven">
            <h2 className="font-headline font-bold text-lg text-on-surface mb-3">
              {reviewedIds.size > 0 && reviewTargets.length === 0 ? '⭐ Reviews verstuurd!' : '⭐ Hoe was de tocht?'}
            </h2>
            {reviewTargets.length > 0 && (
              <p className="font-body text-sm text-on-surface-variant mb-4">
                Laat een review achter voor je medezeilers.
              </p>
            )}
            <div className="space-y-3">
              {reviewTargets.map(target => (
                <div key={target.id} className="glass-card rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                      {target.photo ? (
                        <Image src={target.photo} alt={target.name} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">person</span>
                        </div>
                      )}
                    </div>
                    <span className="font-label text-sm font-bold text-on-surface">{target.name}</span>
                  </div>
                  {revieweeId === target.id ? (
                    <div className="space-y-3">
                      {/* Sterren */}
                      <div className="flex gap-1 justify-center" role="group" aria-label="Beoordeling">
                        {[1,2,3,4,5].map(star => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            aria-label={`${star} ster${star > 1 ? 'ren' : ''}`}
                            className="text-3xl transition-transform active:scale-90"
                          >
                            <span
                              className="material-symbols-outlined text-3xl"
                              style={{
                                color: star <= reviewRating ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                                fontVariationSettings: star <= reviewRating ? "'FILL' 1" : "'FILL' 0",
                              }}
                              aria-hidden="true"
                            >star</span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        placeholder="Optioneel: schrijf iets over de tocht…"
                        rows={2}
                        maxLength={500}
                        className="w-full px-4 py-3 bg-surface-container-high rounded-2xl
                                   text-on-surface placeholder:text-on-surface-variant/40
                                   border border-white/10 focus:border-primary/50 font-body text-sm
                                   focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRevieweeId(null)}
                          className="flex-1 py-2.5 rounded-xl border border-white/10 font-label text-sm text-on-surface-variant"
                        >Annuleren</button>
                        <button
                          onClick={handleReview}
                          disabled={reviewSaving}
                          className="flex-1 py-2.5 rounded-xl gradient-primary text-on-primary font-label text-sm font-bold shadow-glow disabled:opacity-50 active:scale-95 transition-all"
                        >{reviewSaving ? 'Versturen…' : 'Versturen'}</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRevieweeId(target.id)}
                      className="w-full py-2.5 rounded-xl border border-primary/30 text-primary font-label text-sm font-bold active:scale-95 transition-all"
                    >
                      ⭐ Review schrijven
                    </button>
                  )}
                </div>
              ))}
              {reviewedIds.size > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                  <p className="font-label text-xs text-primary">{reviewedIds.size} review{reviewedIds.size > 1 ? 's' : ''} verstuurd. Bedankt!</p>
                </div>
              )}
            </div>
          </section>
        )
      })()}

      {/* Aanmeld CTA */}
      {canAanmelden && !success && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-30">
          <AnimatePresence mode="wait">
            {!aanmelden ? (
              <motion.button
                key="cta"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                onClick={() => setAanmelden(true)}
                className="w-full py-5 rounded-full gradient-primary text-on-primary
                           font-headline font-extrabold text-lg shadow-glow
                           active:scale-95 transition-all
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                ⛵ Aanmelden voor deze tocht
              </motion.button>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="glass-card rounded-3xl p-4 border border-white/10 space-y-3
                           shadow-[0_-20px_60px_rgba(3,14,32,0.8)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-bold text-base text-on-surface">Jouw bericht</h3>
                  <button onClick={() => { setAanmelden(false); setError(null) }} aria-label="Annuleren">
                    <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
                  </button>
                </div>
                <textarea
                  value={bericht}
                  onChange={e => setBericht(e.target.value)}
                  placeholder={`Stel jezelf even voor aan ${poster.displayName}…`}
                  rows={3}
                  maxLength={300}
                  autoFocus
                  className="w-full px-4 py-3 bg-surface-container-high rounded-2xl
                             text-on-surface placeholder:text-on-surface-variant/40
                             border border-white/10 focus:border-primary/50 font-body text-sm
                             focus:outline-none resize-none"
                />
                <p className="text-right font-label text-xs text-on-surface-variant">{bericht.length}/300</p>
                {error && (
                  <div role="alert" className="p-3 rounded-xl bg-error/10 border border-error/20">
                    <p className="font-label text-sm text-error">{error}</p>
                  </div>
                )}
                <button
                  onClick={handleAanmelden}
                  disabled={saving}
                  className="w-full py-3.5 rounded-full gradient-primary text-on-primary font-label font-bold shadow-glow
                             disabled:opacity-40 active:scale-95 transition-all"
                >
                  {saving ? 'Versturen…' : 'Versturen'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  )
}
