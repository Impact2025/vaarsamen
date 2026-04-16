'use client'

import { useState } from 'react'
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

function ProfilePlaceholder({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #065f46 100%)' }}
    >
      <span className="font-headline font-black text-6xl text-white/20 select-none">{initials}</span>
    </div>
  )
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
  const [bioExpanded, setBioExpanded] = useState(false)

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
      <motion.div aria-hidden="true" className="absolute top-7 left-5 z-30 rotate-[-12deg]" style={{ opacity: likeOp }}>
        <div className="border-[3px] border-primary rounded-2xl px-4 py-1.5 bg-black/30 backdrop-blur-md">
          <span className="font-headline font-black text-primary text-lg tracking-tight">AAN BOORD ⛵</span>
        </div>
      </motion.div>
      <motion.div aria-hidden="true" className="absolute top-7 right-5 z-30 rotate-[12deg]" style={{ opacity: passOp }}>
        <div className="border-[3px] border-error rounded-2xl px-4 py-1.5 bg-black/30 backdrop-blur-md">
          <span className="font-headline font-black text-error text-lg tracking-tight">VOLGENDE →</span>
        </div>
      </motion.div>

      {/* ── Kaart ───────────────────────────────────────────────── */}
      <div className="w-full h-full rounded-card overflow-hidden shadow-deep bg-surface-container flex flex-col">

        {/* ── FOTO (58%) — met naam-overlay onderaan ──────────── */}
        <div className="relative flex-shrink-0" style={{ height: '58%' }}>
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
            <ProfilePlaceholder name={profile.displayName} />
          )}

          {/* Gradient: donker onderaan voor naam-leesbaarheid */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 35%, transparent 45%, rgba(0,0,0,0.75) 100%)' }}
            aria-hidden="true"
          />

          {/* CWO badge — links boven */}
          {profile.cwoLevel !== 'geen' && (
            <div className="absolute top-3 left-3 z-10">
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md bg-black/30 border border-white/20">
                <span
                  className="material-symbols-outlined text-[13px] text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {profile.cwoVerified ? 'verified' : 'school'}
                </span>
                <span className="font-label text-[11px] font-bold text-white uppercase tracking-widest">
                  {CWO_LABELS[profile.cwoLevel]}
                </span>
              </div>
            </div>
          )}

          {/* Rol badge — rechts boven */}
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1 rounded-full px-2.5 py-1.5 backdrop-blur-md bg-black/30 border border-white/20">
              <span className="material-symbols-outlined text-[13px] text-white/90" aria-hidden="true">
                {profile.sailingRole === 'schipper' ? 'sailing' : profile.sailingRole === 'bemanning' ? 'person' : 'group'}
              </span>
              <span className="font-label text-[10px] font-semibold text-white/90">
                {ROLE_LABELS[profile.sailingRole]}
              </span>
            </div>
          </div>

          {/* Naam + thuishaven + rating — onderaan foto (Tinder/Airbnb-stijl) */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-10">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-headline font-black text-[26px] text-white leading-tight drop-shadow-sm truncate">
                  {profile.displayName}
                </h2>
                {profile.homePort && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[12px] text-white/70" aria-hidden="true">anchor</span>
                    <span className="font-label text-xs text-white/70">{profile.homePort}</span>
                  </div>
                )}
              </div>
              {profile.averageRating && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full backdrop-blur-md bg-black/30 border border-white/20 flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-[13px] text-yellow-400"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >star</span>
                  <span className="font-label text-sm font-bold text-white">{profile.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT (42%) ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col px-4 pt-3 pb-3 gap-2.5 min-h-0 overflow-hidden">

          {/* Intentie + boot — compacte pill-rij */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <div
              className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1"
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
              <div className="flex items-center gap-1 bg-surface-container-high border border-outline/20 rounded-full px-2.5 py-1">
                <span className="material-symbols-outlined text-[12px] text-on-surface-variant" aria-hidden="true">sailing</span>
                <span className="font-label text-[11px] text-on-surface-variant">
                  {BOAT_LABELS[profile.boats[0].type]}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="font-body text-[13px] text-on-surface/75 leading-relaxed line-clamp-2 flex-shrink-0">
              {profile.bio}
            </p>
          )}

          {/* Vaargebieden + vaardigheidstags — onderaan verankerd */}
          <div className="flex flex-wrap gap-1.5 mt-auto flex-shrink-0" role="list" aria-label="Vaargebieden">
            {visibleAreas.map(area => (
              <span
                key={area}
                role="listitem"
                className="px-2.5 py-0.5 rounded-full border border-outline/20 bg-surface-container-high font-label text-[11px] text-on-surface-variant"
              >
                {area}
              </span>
            ))}
            {profile.skillTags.slice(0, 2).map(tag => (
              <span
                key={tag}
                role="listitem"
                className="px-2.5 py-0.5 rounded-full border border-outline/15 font-label text-[11px] text-on-surface-variant/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
