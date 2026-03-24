'use client'

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import Image from 'next/image'
import {
  BOAT_LABELS, CWO_LABELS, ROLE_LABELS, SAILING_AREAS,
  LOOKING_FOR_LABELS, type Profile, type LookingFor,
} from '@/types'

const AREA_LABEL = Object.fromEntries(SAILING_AREAS.map(a => [a.id, a.label]))

const LOOKING_FOR_ICON: Record<LookingFor, string> = {
  dagje_varen:  'wb_sunny',
  weekend:      'calendar_month',
  regatta:      'emoji_events',
  zeilvakantie: 'anchor',
  alles:        'all_inclusive',
}

interface SwipeCardProps {
  profile: Profile
  onSwipe: (direction: 'left' | 'right') => void
  isTop:   boolean
}

export function SwipeCard({ profile, onSwipe, isTop }: SwipeCardProps) {
  const x      = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-12, 12])
  const likeOp = useTransform(x, [0, 100],   [0, 1])
  const passOp = useTransform(x, [-100, 0],  [1, 0])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 120) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isTop) return
    if (e.key === 'ArrowRight') onSwipe('right')
    if (e.key === 'ArrowLeft')  onSwipe('left')
  }

  const visibleAreas = (profile.sailingAreas ?? [])
    .slice(0, 2)
    .map(id => AREA_LABEL[id] ?? id)

  return (
    <motion.div
      role="article"
      aria-label={`${profile.displayName}, ${ROLE_LABELS[profile.sailingRole]}, zoekt ${LOOKING_FOR_LABELS[profile.lookingFor]}${profile.homePort ? `, thuishaven ${profile.homePort}` : ''}`}
      tabIndex={isTop ? 0 : -1}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ x, rotate }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: -300, right: 300 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.01 }}
    >
      {/* Swipe-overlay: AAN BOORD */}
      <motion.div
        aria-hidden="true"
        className="absolute top-6 left-6 z-30 rotate-[-15deg] border-[3px] border-primary rounded-2xl px-4 py-1.5"
        style={{ opacity: likeOp }}
      >
        <span className="font-headline font-black text-primary text-lg tracking-tight">AAN BOORD ⛵</span>
      </motion.div>

      {/* Swipe-overlay: VOLGENDE */}
      <motion.div
        aria-hidden="true"
        className="absolute top-6 right-6 z-30 rotate-[15deg] border-[3px] border-error/80 rounded-2xl px-4 py-1.5"
        style={{ opacity: passOp }}
      >
        <span className="font-headline font-black text-error text-lg tracking-tight">VOLGENDE →</span>
      </motion.div>

      {/* Kaart: foto bovenin, activiteitsinfo onderaan */}
      <div className="w-full h-full rounded-card overflow-hidden shadow-deep bg-surface-container flex flex-col">

        {/* ── FOTO (43% hoogte) ─────────────────────────── */}
        <div className="relative flex-shrink-0" style={{ height: '43%' }}>
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={`Foto van ${profile.displayName}`}
              fill
              className="object-cover object-top"
              priority={isTop}
              sizes="(max-width: 768px) 100vw, 448px"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-7xl text-on-surface-variant" aria-hidden="true">
                account_circle
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" aria-hidden="true" />

          {/* CWO badge */}
          {profile.cwoLevel !== 'geen' && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1.5 glass-card rounded-full px-3 py-1.5 border border-primary/30">
                <span
                  className="material-symbols-outlined text-sm text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {profile.cwoVerified ? 'verified' : 'school'}
                </span>
                <span className="font-label text-[11px] font-bold text-primary uppercase tracking-widest">
                  {CWO_LABELS[profile.cwoLevel]}
                </span>
                {!profile.cwoVerified && <span className="sr-only">(niet geverifieerd)</span>}
              </div>
            </div>
          )}

          {/* Rol badge */}
          <div className="absolute top-3 right-3">
            <div className="glass-card rounded-full px-3 py-1.5 border border-white/20 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-on-surface" aria-hidden="true">
                {profile.sailingRole === 'schipper' ? 'sailing'
                  : profile.sailingRole === 'bemanning' ? 'person'
                  : 'group'}
              </span>
              <span className="font-label text-[11px] font-semibold text-on-surface">
                {ROLE_LABELS[profile.sailingRole]}
              </span>
            </div>
          </div>
        </div>

        {/* ── ACTIVITEITSINFO (rest) ────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">

          {/* Naam + thuishaven + rating */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-headline font-extrabold text-xl text-on-surface leading-tight">
                {profile.displayName}
              </h2>
              {profile.homePort && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">anchor</span>
                  <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
                    {profile.homePort}
                  </span>
                </div>
              )}
            </div>
            {profile.averageRating && (
              <div className="flex items-center gap-1 px-2.5 py-1 glass-card rounded-full border border-white/10 flex-shrink-0 ml-2">
                <span
                  className="material-symbols-outlined text-xs text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >star</span>
                <span className="font-label text-xs font-bold text-primary">{profile.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Wat zoekt deze zeiler — de primaire CTA */}
          <div
            className="flex items-center gap-2.5 gradient-primary rounded-2xl px-4 py-2.5 shadow-glow"
            aria-label={`Zoekt: ${LOOKING_FOR_LABELS[profile.lookingFor]}`}
          >
            <span
              className="material-symbols-outlined text-on-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              {LOOKING_FOR_ICON[profile.lookingFor]}
            </span>
            <span className="font-headline font-black text-on-primary text-sm tracking-tight">
              {LOOKING_FOR_LABELS[profile.lookingFor]}
            </span>
          </div>

          {/* Boot + vaargebieden */}
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Boot en vaargebieden">
            {profile.boats[0] && (
              <div role="listitem" className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/10 glass-card">
                <span className="material-symbols-outlined text-xs text-secondary" aria-hidden="true">sailing</span>
                <span className="font-label text-xs font-bold text-secondary">
                  {BOAT_LABELS[profile.boats[0].type]}
                </span>
              </div>
            )}
            {visibleAreas.map(area => (
              <div key={area} role="listitem" className="px-3 py-1.5 rounded-full border border-white/10 glass-card">
                <span className="font-label text-xs text-on-surface-variant">{area}</span>
              </div>
            ))}
          </div>

          {/* Vaardigheden */}
          {profile.skillTags.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-auto" role="list" aria-label="Vaardigheden">
              {profile.skillTags.slice(0, 3).map(tag => (
                <div key={tag} role="listitem" className="flex-shrink-0 px-3 py-1 rounded-xl border border-white/5 glass-card">
                  <span className="font-label text-xs text-on-surface/70">{tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
