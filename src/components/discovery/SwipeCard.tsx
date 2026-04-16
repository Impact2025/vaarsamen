'use client'

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import Image from 'next/image'
import {
  BOAT_LABELS, CWO_LABELS, ROLE_LABELS, SAILING_AREAS,
  LOOKING_FOR_LABELS,
  type Profile, type LookingFor,
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
  const likeOp = useTransform(x, [0, 80],   [0, 1])
  const passOp = useTransform(x, [-80, 0],  [1, 0])

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

  const visibleAreas = (profile.sailingAreas ?? []).slice(0, 3).map(id => AREA_LABEL[id] ?? id)
  const initials     = profile.displayName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <motion.div
      role="article"
      aria-label={`${profile.displayName}, ${ROLE_LABELS[profile.sailingRole]}, ${CWO_LABELS[profile.cwoLevel]}${profile.homePort ? `, ${profile.homePort}` : ''}`}
      tabIndex={isTop ? 0 : -1}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 cursor-grab active:cursor-grabbing focus:outline-none"
      style={{ x, rotate }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: -300, right: 300 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.005 }}
    >
      {/* Swipe-overlays */}
      <motion.div aria-hidden="true" className="absolute top-6 left-5 z-30 rotate-[-12deg]" style={{ opacity: likeOp }}>
        <div className="border-[3px] border-primary rounded-2xl px-4 py-1.5">
          <span className="font-headline font-black text-primary text-lg tracking-tight">AAN BOORD</span>
        </div>
      </motion.div>
      <motion.div aria-hidden="true" className="absolute top-6 right-5 z-30 rotate-[12deg]" style={{ opacity: passOp }}>
        <div className="border-[3px] border-error rounded-2xl px-4 py-1.5">
          <span className="font-headline font-black text-error text-lg tracking-tight">VOLGENDE</span>
        </div>
      </motion.div>

      {/* ── Kaart ─────────────────────────────────────────────── */}
      <div className="w-full h-full rounded-card overflow-hidden shadow-deep bg-surface-container flex flex-col px-5 pt-5 pb-4 gap-3">

        {/* ── Rij 1: badges ─────────────────────────────────── */}
        <div className="flex items-center justify-between flex-shrink-0">
          {profile.cwoLevel !== 'geen' ? (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1 bg-primary/10 border border-primary/20">
              <span
                className="material-symbols-outlined text-[12px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                {profile.cwoVerified ? 'verified' : 'school'}
              </span>
              <span className="font-label text-[11px] font-bold text-primary uppercase tracking-wide">
                {CWO_LABELS[profile.cwoLevel]}
              </span>
            </div>
          ) : <div />}

          <div className="flex items-center gap-1 rounded-full px-3 py-1 bg-surface-container-high border border-outline/20">
            <span className="material-symbols-outlined text-[12px] text-on-surface-variant" aria-hidden="true">
              {profile.sailingRole === 'schipper' ? 'sailing' : profile.sailingRole === 'bemanning' ? 'person' : 'group'}
            </span>
            <span className="font-label text-[11px] text-on-surface-variant">
              {ROLE_LABELS[profile.sailingRole]}
            </span>
          </div>
        </div>

        {/* ── Rij 2: avatar + naam + rating ─────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-outline/20">
            {profile.photoUrl ? (
              <Image
                src={profile.photoUrl}
                alt={`Foto van ${profile.displayName}`}
                width={56}
                height={56}
                className="object-cover object-top w-full h-full"
                priority={isTop}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #065f46 100%)' }}
              >
                <span className="font-headline font-black text-xl text-white/60 select-none">{initials}</span>
              </div>
            )}
          </div>

          {/* Naam + thuishaven */}
          <div className="flex-1 min-w-0">
            <h2 className="font-headline font-black text-xl text-on-surface leading-tight truncate">
              {profile.displayName}
            </h2>
            {profile.homePort && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[11px] text-on-surface-variant" aria-hidden="true">anchor</span>
                <span className="font-label text-xs text-on-surface-variant">{profile.homePort}</span>
              </div>
            )}
          </div>

          {/* Rating */}
          {profile.averageRating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className="material-symbols-outlined text-[14px] text-yellow-400"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >star</span>
              <span className="font-label text-sm font-bold text-on-surface">{profile.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* ── Scheidingslijn ────────────────────────────────── */}
        <div className="h-px bg-outline/10 flex-shrink-0" />

        {/* ── Rij 3: intentie + boot ────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <div
            className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1"
            aria-label={`Zoekt: ${LOOKING_FOR_LABELS[profile.lookingFor]}`}
          >
            <span
              className="material-symbols-outlined text-primary text-[12px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              {LOOKING_FOR_ICON[profile.lookingFor]}
            </span>
            <span className="font-label text-[11px] font-semibold text-primary">
              {LOOKING_FOR_LABELS[profile.lookingFor]}
            </span>
          </div>
          {profile.boats[0] && (
            <span className="font-label text-[11px] text-on-surface-variant border border-outline/20 rounded-full px-3 py-1">
              {BOAT_LABELS[profile.boats[0].type]}
            </span>
          )}
        </div>

        {/* ── Rij 4: bio ────────────────────────────────────── */}
        {profile.bio && (
          <p className="font-body text-sm text-on-surface/80 leading-relaxed line-clamp-4 flex-shrink-0">
            {profile.bio}
          </p>
        )}

        {/* ── Rij 5: vaargebieden — onderaan verankerd ─────── */}
        {visibleAreas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto flex-shrink-0">
            {visibleAreas.map(area => (
              <span
                key={area}
                className="font-label text-[11px] text-on-surface-variant border border-outline/20 rounded-full px-2.5 py-0.5"
              >
                {area}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
