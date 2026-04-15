'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role      = 'eigenaar' | 'instructeur'
type Placement = 'bottom' | 'top' | 'center'

interface TourStep {
  selector:    string | null  // data-tour="…" selector, null = centered welcome
  badge:       string
  icon:        string
  title:       string
  description: string
  placement:   Placement
  onEnter?:    () => void     // side-effect when step activates (e.g. switch tab)
}

// ─── Steps per rol ────────────────────────────────────────────────────────────

function buildSteps(role: Role, setTab: (t: string) => void): TourStep[] {
  const shared: TourStep[] = [
    {
      selector:    null,
      badge:       'Welkom aan boord',
      icon:        'anchor',
      title:       'Je schooldashboard',
      description: 'Lessen registreren, vorderingen bijhouden en je vloot beheren — alles op één plek.',
      placement:   'center',
    },
    {
      selector:    '[data-tour="stats"]',
      badge:       'Overzicht',
      icon:        'insights',
      title:       'Alles in één oogopslag',
      description: 'Zie direct hoeveel cursisten, instructeurs, lessen en cursussen je school telt — altijd up-to-date.',
      placement:   'bottom',
    },
    {
      selector:    '[data-tour="tabs"]',
      badge:       'Navigatie',
      icon:        'apps',
      title:       'Alle modules hier',
      description: 'Schakel eenvoudig tussen Lessen, Cursisten, Vloot, Verhuur en meer via de tabbalk.',
      placement:   'bottom',
    },
    {
      selector:    '[data-tour="tabs"]',
      badge:       'Lessen',
      icon:        'calendar_today',
      title:       'Lesdag vastleggen',
      description: 'Open "Lessen" → kies een datum → registreer wie er was, op welke boot, en geef vorderingen in per cursist.',
      placement:   'bottom',
      onEnter:     () => setTab('lessen'),
    },
  ]

  if (role === 'eigenaar') {
    shared.push({
      selector:    '[data-tour="tabs"]',
      badge:       'Eigenaar',
      icon:        'manage_accounts',
      title:       'Volledige controle',
      description: 'Als eigenaar heb je bovendien toegang tot Team, Verhuur, Meldingen en Instellingen — inclusief tarieven en uitnodigingslinks.',
      placement:   'bottom',
      onEnter:     () => setTab('lessen'),
    })
  }

  return shared
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  role:      Role
  onDismiss: () => void
  onSetTab:  (tab: string) => void
}

export function DashboardTour({ role, onDismiss, onSetTab }: Props) {
  const steps = buildSteps(role, onSetTab)

  const [idx,  setIdx]  = useState(0)
  const [dir,  setDir]  = useState(1)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [win,  setWin]  = useState({ w: 0, h: 0 })

  const step    = steps[idx]
  const isLast  = idx === steps.length - 1
  const isFirst = idx === 0
  const PAD     = 14

  // Venstergrootte bijhouden
  useEffect(() => {
    const update = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Doelelement zoeken en positioneren
  useLayoutEffect(() => {
    if (!step.selector) { setRect(null); return }
    const el = document.querySelector(step.selector)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [idx, step.selector, win.w])

  // Toetsenbordnavigatie
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { onDismiss(); return }
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft')  retreat()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  })

  const advance = () => {
    if (isLast) { onDismiss(); return }
    steps[idx + 1]?.onEnter?.()
    setDir(1); setIdx(i => i + 1)
  }
  const retreat = () => {
    if (isFirst) return
    steps[idx - 1]?.onEnter?.()
    setDir(-1); setIdx(i => i - 1)
  }

  // Spotlight rechthoek (met padding)
  const sr = rect ? {
    x: rect.left  - PAD,
    y: rect.top   - PAD,
    w: rect.width  + PAD * 2,
    h: rect.height + PAD * 2,
  } : null

  const tooltipStyle = computeTooltipPos(rect, step.placement, win)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[300]"
      role="dialog"
      aria-modal
      aria-label="Rondleiding schooldashboard"
    >

      {/* ── SVG spotlight overlay ─────────────────────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block', pointerEvents: 'none' }}
        aria-hidden
      >
        <defs>
          <mask id="dt-spotlight-mask">
            {/* Wit = donker; zwart = doorzichtig gat */}
            <rect width="100%" height="100%" fill="white" />
            {sr && (
              <rect
                x={sr.x} y={sr.y}
                width={sr.w} height={sr.h}
                rx="20"
                fill="black"
                style={{
                  transition: [
                    'x 0.38s cubic-bezier(.34,1.15,.64,1)',
                    'y 0.38s cubic-bezier(.34,1.15,.64,1)',
                    'width 0.38s cubic-bezier(.34,1.15,.64,1)',
                    'height 0.38s cubic-bezier(.34,1.15,.64,1)',
                  ].join(', '),
                }}
              />
            )}
          </mask>
        </defs>

        {/* Donkere overlay met gat */}
        <rect
          width="100%" height="100%"
          fill="rgba(3, 9, 22, 0.86)"
          mask="url(#dt-spotlight-mask)"
        />
      </svg>

      {/* Klikbaar achtergrondgebied (buiten tooltip) */}
      <div className="absolute inset-0" onClick={onDismiss} />

      {/* ── Glow ring rondom spotlight ────────────────────────────────────── */}
      <AnimatePresence>
        {sr && (
          <motion.div
            key={`glow-${idx}`}
            className="absolute pointer-events-none"
            style={{
              left:         sr.x,
              top:          sr.y,
              width:        sr.w,
              height:       sr.h,
              borderRadius: 20,
              boxShadow: [
                '0 0 0 2px rgba(70,241,197,0.55)',
                '0 0 0 6px rgba(70,241,197,0.06)',
                '0 0 28px 8px rgba(70,241,197,0.12)',
              ].join(', '),
            }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, delay: 0.08 }}
          />
        )}
      </AnimatePresence>

      {/* ── Voortgangsbalk (boven) ────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] bg-white/[0.06] pointer-events-none"
        aria-hidden
      >
        <motion.div
          className="h-full bg-primary rounded-r-full"
          animate={{ width: `${((idx + 1) / steps.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 190, damping: 26 }}
        />
      </div>

      {/* ── Topbalk: stapteller + sluiten ─────────────────────────────────── */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
        <span className="font-label text-[11px] uppercase tracking-[0.14em] text-white/35">
          {idx + 1} / {steps.length}
        </span>
        <button
          onClick={onDismiss}
          className="w-9 h-9 rounded-full glass-card border border-white/10
                     flex items-center justify-center
                     text-on-surface-variant hover:text-on-surface
                     active:scale-95 transition-all pointer-events-auto"
          aria-label="Rondleiding overslaan"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* ── Tooltip kaart ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={idx}
          custom={dir}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          style={tooltipStyle}
          className="absolute z-10 w-[min(320px,_calc(100vw-32px))]
                     glass-card border border-white/[0.08] rounded-3xl p-5
                     shadow-deep pointer-events-auto"
          onClick={e => e.stopPropagation()}
          role="region"
          aria-live="polite"
        >

          {/* Icoon + badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-primary/12 border border-primary/20
                            flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-[22px] text-primary"
                aria-hidden
              >
                {step.icon}
              </span>
            </div>
            <span className="font-label text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              {step.badge}
            </span>
          </div>

          {/* Tekst */}
          <h3 className="font-headline font-black text-[21px] leading-tight text-on-surface mb-2">
            {step.title}
          </h3>
          <p className="font-body text-[13.5px] text-on-surface-variant leading-relaxed">
            {step.description}
          </p>

          {/* Footer: dots + knoppen */}
          <div className="flex items-center mt-5 gap-3">

            {/* Voortgangsdots */}
            <div className="flex gap-1.5 items-center" aria-hidden>
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === idx
                      ? 'w-5 h-[6px] bg-primary'
                      : i < idx
                        ? 'w-[6px] h-[6px] bg-primary/40'
                        : 'w-[6px] h-[6px] bg-white/12'
                  }`}
                />
              ))}
            </div>

            {/* Navigatieknoppen */}
            <div className="flex gap-2 ml-auto">
              {!isFirst && (
                <button
                  onClick={retreat}
                  aria-label="Vorige stap"
                  className="w-10 h-10 rounded-full border border-white/12
                             flex items-center justify-center
                             text-on-surface-variant hover:text-on-surface
                             active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
              )}
              <button
                onClick={advance}
                aria-label={isLast ? 'Rondleiding afsluiten' : 'Volgende stap'}
                className="h-10 px-5 rounded-full gradient-primary text-on-primary
                           font-label text-[13px] font-bold shadow-glow
                           active:scale-95 transition-all"
              >
                {isLast ? 'Klaar!' : 'Volgende'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Tooltip positionering ────────────────────────────────────────────────────

function computeTooltipPos(
  rect:      DOMRect | null,
  placement: Placement,
  win:       { w: number; h: number },
): React.CSSProperties {
  const MAX_W = 320
  const H_PAD = 16
  const GAP   = 18
  const EST_H = 210

  if (!rect || placement === 'center' || !win.w) {
    // Gebruik exacte pixelwaarden — Framer Motion overschrijft 'transform',
    // waardoor translate(-50%,-50%) niet betrouwbaar werkt voor centering.
    const w    = Math.min(MAX_W, win.w - H_PAD * 2)
    const left = (win.w - w) / 2
    return { top: win.h / 2 - EST_H / 2, left, width: w }
  }

  const w    = Math.min(MAX_W, win.w - H_PAD * 2)
  const left = Math.max(H_PAD, Math.min(rect.left, win.w - w - H_PAD))

  if (placement === 'bottom') {
    const topVal = rect.bottom + GAP
    if (topVal + EST_H > win.h - H_PAD) {
      // Niet genoeg ruimte onderaan → boven het element
      return { bottom: win.h - rect.top + GAP, left, width: w }
    }
    return { top: topVal, left, width: w }
  }

  if (placement === 'top') {
    return { bottom: win.h - rect.top + GAP, left, width: w }
  }

  return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
}

// ─── Animatie varianten ───────────────────────────────────────────────────────

const cardVariants = {
  enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 16 : -16, scale: 0.95 }),
  center: ()          => ({ opacity: 1, y: 0,                  scale: 1    }),
  exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -16 : 16,  scale: 0.96 }),
}
