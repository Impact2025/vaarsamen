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

function ProfilePlaceholder({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0c4a6e 0%, #065f46 100%)' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
          <span className="font-headline font-black text-4xl text-white/90 select-none leading-none">
            {initials}
          </span>
        </div>
        <span
          className="material-symbols-outlined text-3xl text-white/25"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          sailing
        </span>
      </div>
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

  const visibleAreas = (profile.sailingAreas ?? []).slice(0, 2).map(id => AREA_LABEL[id] ?? id)

  return (
    <motion.div
      role="article"
      aria-label={`${profile.displayName}, ${ROLE_LABELS[profile.sailingRole]}, ${CWO_LABELS[profile.cwoLevel]}${profile.homePort ? `, ${profile.homePort}` : ''}`}
      tabIndex={isTop ? 0 : -1}
      onKeyDown={handleKeyDown}
      className="absolute inset-0 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ x, rotate }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: -300, right: 300 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.01 }}
    >
      {/* Swipe-overlays */}
      <motion.div aria-hidden="true" className="absolute top-7 left-6 z-30 rotate-[-12deg]" style={{ opacity: likeOp }}>
        <div className="border-[3px] border-primary rounded-2xl px-4 py-1.5 bg-primary/10 backdrop-blur-sm">
          <span className="font-headline font-black text-primary text-lg tracking-tight">AAN BOORD ⛵</span>
        </div>
      </motion.div>
      <motion.div aria-hidden="true" className="absolute top-7 right-6 z-30 rotate-[12deg]" style={{ opacity: passOp }}>
        <div className="border-[3px] border-error rounded-2xl px-4 py-1.5 bg-error/10 backdrop-blur-sm">
          <span className="font-headline font-black text-error text-lg tracking-tight">VOLGENDE →</span>
        </div>
      </motion.div>

      {/* Kaart */}
      <div className="w-full h-full rounded-card overflow-hidden shadow-deep bg-surface-container flex flex-col">

        {/* ── FOTO (40%) — banner/masthead, niet portret ───────── */}
        <div className="relative flex-shrink-0" style={{ height: '40%' }}>
          {profile.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={`Foto van ${profile.displayName}`}
              fill
              className="object-cover object-center"
              priority={isTop}
              sizes="(max-width: 768px) 100vw, 448px"
            />
          ) : (
            <ProfilePlaceholder name={profile.displayName} />
          )}

          {/* Subtiele vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/20" aria-hidden="true" />

          {/* CWO badge links boven */}
          {profile.cwoLevel !== 'geen' && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1.5 glass-card rounded-full px-3 py-1.5 border border-primary/30">
                <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                  {profile.cwoVerified ? 'verified' : 'school'}
                </span>
                <span className="font-label text-[11px] font-bold text-primary uppercase tracking-widest">
                  {CWO_LABELS[profile.cwoLevel]}
                </span>
              </div>
            </div>
          )}

          {/* Rol badge rechts boven */}
          <div className="absolute top-3 right-3">
            <div className="glass-card rounded-full px-3 py-1.5 border border-white/20 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-on-surface" aria-hidden="true">
                {profile.sailingRole === 'schipper' ? 'sailing' : profile.sailingRole === 'bemanning' ? 'person' : 'group'}
              </span>
              <span className="font-label text-[11px] font-semibold text-on-surface">
                {ROLE_LABELS[profile.sailingRole]}
              </span>
            </div>
          </div>
        </div>

        {/* ── CONTENT (60%) — credentials first ───────────────── */}
        <div className="flex-1 flex flex-col gap-2 px-4 py-3 overflow-hidden min-h-0">

          {/* Naam + thuishaven */}
          <div className="flex items-start justify-between gap-2 flex-shrink-0">
            <div className="min-w-0">
              <h2 className="font-headline font-black text-xl text-on-surface leading-tight truncate">
                {profile.displayName}
              </h2>
              {profile.homePort && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">anchor</span>
                  <span className="font-label text-xs text-on-surface-variant">{profile.homePort}</span>
                </div>
              )}
            </div>
            {profile.averageRating && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-card border border-white/10 flex-shrink-0">
                <span className="material-symbols-outlined text-xs text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">star</span>
                <span className="font-label text-sm font-bold text-on-surface">{profile.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Zoekt — secundair, compacter */}
          <div
            className="flex items-center gap-2 gradient-primary rounded-xl px-3 py-2 shadow-glow flex-shrink-0"
            aria-label={`Zoekt: ${LOOKING_FOR_LABELS[profile.lookingFor]}`}
          >
            <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
              {LOOKING_FOR_ICON[profile.lookingFor]}
            </span>
            <span className="font-label font-bold text-on-primary text-xs tracking-wide uppercase">
              {LOOKING_FOR_LABELS[profile.lookingFor]}
            </span>
          </div>

          {/* Bio — meer ruimte in 60%-zone */}
          {profile.bio && (
            <p className="font-body text-xs text-on-surface/75 line-clamp-3 flex-shrink-0 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Boot + vaargebieden */}
          {(profile.boats[0] || visibleAreas.length > 0) && (
            <div className="flex flex-wrap gap-1.5 flex-shrink-0" role="list" aria-label="Boot en vaargebieden">
              {profile.boats[0] && (
                <div role="listitem" className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/10 glass-card">
                  <span className="material-symbols-outlined text-xs text-secondary" aria-hidden="true">sailing</span>
                  <span className="font-label text-xs font-bold text-secondary">{BOAT_LABELS[profile.boats[0].type]}</span>
                </div>
              )}
              {visibleAreas.map(area => (
                <div key={area} role="listitem" className="px-2.5 py-1 rounded-full border border-white/10 glass-card">
                  <span className="font-label text-xs text-on-surface-variant">{area}</span>
                </div>
              ))}
            </div>
          )}

          {/* Vaardigheidstags */}
          {profile.skillTags.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-auto" role="list" aria-label="Vaardigheden">
              {profile.skillTags.slice(0, 4).map(tag => (
                <div key={tag} role="listitem" className="flex-shrink-0 px-2.5 py-1 rounded-xl border border-white/5 glass-card">
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
