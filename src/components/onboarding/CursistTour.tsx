'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardTour } from '@/hooks/useDashboardTour'

// ─── AMRB kleur definitie ─────────────────────────────────────────────────────

const AMRB = [
  { letter: 'A', label: 'Aangeboden', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30',   dot: 'bg-blue-400' },
  { letter: 'M', label: 'Matig',      color: 'bg-amber-500/20 text-amber-300 border-amber-400/30', dot: 'bg-amber-400' },
  { letter: 'R', label: 'Redelijk',   color: 'bg-orange-500/20 text-orange-300 border-orange-400/30', dot: 'bg-orange-400' },
  { letter: 'B', label: 'Beheerst',   color: 'bg-primary/15 text-primary border-primary/30',      dot: 'bg-primary' },
] as const

// ─── Stappen ──────────────────────────────────────────────────────────────────

const STEPS = [
  {
    badge:       'Welkom',
    icon:        'school',
    title:       'Jouw vorderingenstaat',
    description: 'Hier zie je per cursus welke vaardigheden je al beheerst — bijgehouden door je instructeur na elke les.',
    extra:       null,
  },
  {
    badge:       'Beoordelingsschaal',
    icon:        'data_thresholding',
    title:       'Wat betekenen de kleuren?',
    description: 'Elke vaardigheid wordt beoordeeld op vier niveaus:',
    extra:       'amrb',
  },
  {
    badge:       'Automatisch',
    icon:        'sync',
    title:       'Altijd actueel',
    description: 'Je instructeur vult na iedere lesdag jouw vorderingen in. Zodra dat klaar is, zie je hier direct de update.',
    extra:       null,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function CursistTour() {
  const { show, dismiss } = useDashboardTour('cursist')

  if (!show) return null

  return (
    <AnimatePresence>
      <CursistTourInner onDismiss={dismiss} />
    </AnimatePresence>
  )
}

function CursistTourInner({ onDismiss }: { onDismiss: () => void }) {
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)

  const step    = STEPS[idx]
  const isLast  = idx === STEPS.length - 1
  const isFirst = idx === 0

  const advance = () => {
    if (isLast) { onDismiss(); return }
    setDir(1); setIdx(i => i + 1)
  }
  const retreat = () => {
    if (isFirst) return
    setDir(-1); setIdx(i => i - 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[300] bg-[rgba(3,9,22,0.88)] backdrop-blur-xl
                 flex flex-col items-center justify-center px-6"
      role="dialog"
      aria-modal
      aria-label="Rondleiding mijn vorderingen"
      onClick={onDismiss}
    >

      {/* Voortgangsbalk */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/[0.06]" aria-hidden>
        <motion.div
          className="h-full bg-primary rounded-r-full"
          animate={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        />
      </div>

      {/* Topbalk */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between">
        <span className="font-label text-[11px] uppercase tracking-[0.14em] text-white/35">
          {idx + 1} / {STEPS.length}
        </span>
        <button
          onClick={onDismiss}
          className="w-9 h-9 rounded-full glass-card border border-white/10
                     flex items-center justify-center
                     text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
          aria-label="Rondleiding overslaan"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Kaart */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={idx}
          custom={dir}
          variants={cardV}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 330, damping: 30 }}
          className="w-full max-w-sm glass-card border border-white/[0.08] rounded-3xl p-6 shadow-deep"
          onClick={e => e.stopPropagation()}
        >
          {/* Icoon + badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/12 border border-primary/20
                            flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden>
                {step.icon}
              </span>
            </div>
            <span className="font-label text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              {step.badge}
            </span>
          </div>

          {/* Titel + tekst */}
          <h2 className="font-headline font-black text-[22px] leading-tight text-on-surface mb-2">
            {step.title}
          </h2>
          <p className="font-body text-[13.5px] text-on-surface-variant leading-relaxed">
            {step.description}
          </p>

          {/* AMRB schaal */}
          {step.extra === 'amrb' && (
            <div className="mt-4 space-y-2" role="list" aria-label="Beoordelingsniveaus">
              {AMRB.map((a, i) => (
                <motion.div
                  key={a.letter}
                  role="listitem"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 28 }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${a.color}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.dot}`} aria-hidden />
                  <span className="font-label text-[11px] font-black uppercase tracking-widest w-4">
                    {a.letter}
                  </span>
                  <span className="font-body text-[13px] font-semibold">
                    {a.label}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center mt-6 gap-3">
            {/* Dots */}
            <div className="flex gap-1.5 items-center" aria-hidden>
              {STEPS.map((_, i) => (
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

            {/* Knoppen */}
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
                           font-label text-[13px] font-bold shadow-glow active:scale-95 transition-all"
              >
                {isLast ? 'Begrepen!' : 'Volgende'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Animatie ─────────────────────────────────────────────────────────────────

const cardV = {
  enter:  (d: number) => ({ opacity: 0, y: d > 0 ? 18 : -18, scale: 0.95 }),
  center: ()          => ({ opacity: 1, y: 0,                  scale: 1    }),
  exit:   (d: number) => ({ opacity: 0, y: d > 0 ? -18 : 18,  scale: 0.96 }),
}
