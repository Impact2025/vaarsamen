'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Step {
  visual:      React.ReactNode
  badge:       string
  title:       string
  description: string
}

const STEPS: Step[] = [
  {
    badge:       'Welkom aan boord',
    title:       'Vind jouw perfecte zeilpartner',
    description: 'VaarSamen verbindt zeilers in Nederland. Of je nu schipper of bemanning bent — hier vind je wie bij jou past.',
    visual:      <WelcomeVisual />,
  },
  {
    badge:       'Ontdekken',
    title:       'Swipen is simpel',
    description: 'Vind je iemand interessant? Swipe naar rechts of tik op het hartje. Niet jouw type? Swipe links of tik op het kruis.',
    visual:      <SwipeVisual />,
  },
  {
    badge:       'Matches & Crew',
    title:       'Van match naar zeilpartner',
    description: 'Jullie allebei rechts? Dan is het een match! Stuur een bericht en plan jullie eerste vaartocht samen.',
    visual:      <MatchVisual />,
  },
  {
    badge:       'Tochten',
    title:       'Plan of join een zeiltocht',
    description: 'Schippers plaatsen tochten, bemanning meldt zich aan. Vind dagjes varen, weekendtochten en zeilvakansties.',
    visual:      <TochtenVisual />,
  },
]

interface WelcomeTourProps {
  onDismiss: () => void
}

export function WelcomeTour({ onDismiss }: WelcomeTourProps) {
  const [step, setStep]       = useState(0)
  const [direction, setDirection] = useState(1)

  const isLast = step === STEPS.length - 1

  const goNext = () => {
    if (isLast) {
      onDismiss()
    } else {
      setDirection(1)
      setStep(s => s + 1)
    }
  }

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1)
      setStep(s => s - 1)
    }
  }

  const current = STEPS[step]

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Welkomstrondleiding"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-surface/98 backdrop-blur-2xl flex flex-col"
    >
      {/* Skip knop */}
      <div className="flex justify-end px-5 pt-5 shrink-0">
        <button
          onClick={onDismiss}
          aria-label="Rondleiding overslaan"
          className="font-label text-sm text-on-surface-variant hover:text-on-surface transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-outline rounded-lg px-2 py-1"
        >
          Overslaan
        </button>
      </div>

      {/* Visual area */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) goNext()
              if (info.offset.x >  60) goPrev()
            }}
            className="w-full flex flex-col items-center gap-8 cursor-grab active:cursor-grabbing select-none"
          >
            {/* Illustratie */}
            <div className="w-full max-w-xs aspect-square" aria-hidden="true">
              {current.visual}
            </div>

            {/* Tekst */}
            <div className="text-center max-w-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                              bg-primary/10 border border-primary/20 mb-4">
                <span className="font-label text-[11px] font-bold uppercase tracking-widest text-primary">
                  {current.badge}
                </span>
              </div>
              <h2 className="font-headline font-black text-3xl text-on-surface leading-tight mb-3">
                {current.title}
              </h2>
              <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                {current.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 pb-[max(2rem,_env(safe-area-inset-bottom))]">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6" aria-label="Stap vooruitgang" role="group">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > step ? 1 : -1); setStep(i) }}
              aria-label={`Ga naar stap ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 h-2 bg-primary'
                  : 'w-2 h-2 bg-on-surface/20'
              }`}
            />
          ))}
        </div>

        {/* Knoppen */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={goPrev}
              aria-label="Vorige stap"
              className="flex-none w-14 h-14 rounded-full glass-card border border-white/10
                         flex items-center justify-center text-on-surface-variant
                         hover:text-on-surface active:scale-95 transition-all
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-outline"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">arrow_back</span>
            </button>
          )}
          <button
            onClick={goNext}
            className="flex-1 gradient-primary text-on-primary font-headline font-extrabold
                       py-4 rounded-full shadow-glow active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {isLast ? 'Start met zeilen!' : 'Volgende'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  center:              () => ({ x: 0,      opacity: 1 }),
  exit:  (dir: number) => ({ x: dir * -60, opacity: 0 }),
}

// ─── Illustraties ────────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Achtergrond cirkel */}
      <circle cx="150" cy="150" r="130" fill="rgba(70,241,197,0.06)" />
      <circle cx="150" cy="150" r="95"  fill="rgba(70,241,197,0.08)" />

      {/* Golven */}
      <path d="M40 210 Q75 190 110 210 Q145 230 180 210 Q215 190 260 210" stroke="rgba(70,241,197,0.3)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M50 225 Q90 205 130 225 Q170 245 210 225 Q235 215 255 225" stroke="rgba(70,241,197,0.15)" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Zeilboot */}
      <path d="M150 210 L100 200 L150 90 Z" fill="rgba(255,255,255,0.15)" />
      <path d="M150 210 L200 200 L160 120 Z" fill="rgba(70,241,197,0.3)" />
      <line x1="150" y1="85" x2="150" y2="215" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Romp */}
      <path d="M100 210 Q150 225 200 210" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Anker badge */}
      <circle cx="150" cy="150" r="28" fill="rgba(7,19,37,0.9)" stroke="rgba(70,241,197,0.4)" strokeWidth="1.5" />
      <text x="150" y="158" textAnchor="middle" fontSize="24" fill="#46f1c5" fontFamily="Material Symbols Outlined">anchor</text>

      {/* Sterren */}
      <circle cx="70"  cy="80"  r="2" fill="rgba(255,255,255,0.6)" />
      <circle cx="235" cy="65"  r="1.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="55"  cy="140" r="1.5" fill="rgba(70,241,197,0.6)" />
      <circle cx="255" cy="130" r="2"   fill="rgba(70,241,197,0.4)" />
    </svg>
  )
}

function SwipeVisual() {
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Profiel kaart */}
      <rect x="75" y="40" width="150" height="195" rx="20" fill="rgba(20,32,50,0.9)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Foto placeholder */}
      <rect x="85" y="50" width="130" height="120" rx="14" fill="rgba(42,53,72,0.8)" />
      <circle cx="150" cy="100" r="28" fill="rgba(70,241,197,0.15)" stroke="rgba(70,241,197,0.2)" strokeWidth="1" />
      <text x="150" y="108" textAnchor="middle" fontSize="24" fill="rgba(70,241,197,0.6)" fontFamily="Material Symbols Outlined">person</text>
      {/* Naam */}
      <rect x="95"  cy="183" y="183" width="80" height="10" rx="5" fill="rgba(215,227,252,0.4)" />
      <rect x="95"  cy="200" y="200" width="55" height="7"  rx="3.5" fill="rgba(186,202,194,0.25)" />
      {/* Badge */}
      <rect x="95"  cy="215" y="215" width="50" height="7"  rx="3.5" fill="rgba(70,241,197,0.2)" />

      {/* Links pijl — PASS */}
      <g opacity="0.9">
        <circle cx="55" cy="138" r="22" fill="rgba(255,100,80,0.15)" stroke="rgba(255,100,80,0.4)" strokeWidth="1.5" />
        <text x="55" y="146" textAnchor="middle" fontSize="18" fill="rgba(255,100,80,0.9)" fontFamily="Material Symbols Outlined">close</text>
      </g>
      <text x="55" y="175" textAnchor="middle" fontSize="9" fill="rgba(255,100,80,0.6)" fontFamily="Plus Jakarta Sans" fontWeight="700">PASS</text>

      {/* Rechts pijl — LIKE */}
      <g opacity="0.9">
        <circle cx="245" cy="138" r="22" fill="rgba(70,241,197,0.15)" stroke="rgba(70,241,197,0.5)" strokeWidth="1.5" />
        <text x="245" y="146" textAnchor="middle" fontSize="18" fill="rgba(70,241,197,0.9)" fontFamily="Material Symbols Outlined">favorite</text>
      </g>
      <text x="245" y="175" textAnchor="middle" fontSize="9" fill="rgba(70,241,197,0.6)" fontFamily="Plus Jakarta Sans" fontWeight="700">LIKE</text>

      {/* Swipe pijl animatie hint */}
      <path d="M95 260 L205 260" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
      <path d="M130 255 L95 260 L130 265" stroke="rgba(255,100,80,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M170 255 L205 260 L170 265" stroke="rgba(70,241,197,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="150" y="285" textAnchor="middle" fontSize="9" fill="rgba(186,202,194,0.4)" fontFamily="Plus Jakarta Sans">sleep de kaart</text>
    </svg>
  )
}

function MatchVisual() {
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Glow */}
      <circle cx="150" cy="145" r="70" fill="rgba(70,241,197,0.07)" />

      {/* Linker avatar */}
      <g transform="translate(65, 80) rotate(-6, 52, 52)">
        <rect width="104" height="104" rx="20" fill="rgba(20,32,50,0.95)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx="52" cy="52" r="28" fill="rgba(42,53,72,0.8)" />
        <text x="52" y="60" textAnchor="middle" fontSize="24" fill="rgba(173,200,245,0.7)" fontFamily="Material Symbols Outlined">person</text>
      </g>

      {/* Rechter avatar */}
      <g transform="translate(131, 80) rotate(6, 52, 52)">
        <rect width="104" height="104" rx="20" fill="rgba(20,32,50,0.95)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx="52" cy="52" r="28" fill="rgba(42,53,72,0.8)" />
        <text x="52" y="60" textAnchor="middle" fontSize="24" fill="rgba(70,241,197,0.7)" fontFamily="Material Symbols Outlined">person</text>
      </g>

      {/* Anker badge in het midden */}
      <circle cx="150" cy="135" r="22" fill="rgba(7,19,37,1)" stroke="rgba(70,241,197,0.5)" strokeWidth="2" />
      <text x="150" y="143" textAnchor="middle" fontSize="18" fill="#46f1c5" fontFamily="Material Symbols Outlined">anchor</text>

      {/* Match tekst */}
      <text x="150" y="215" textAnchor="middle" fontSize="26" fontWeight="900" fill="white" fontFamily="Inter" letterSpacing="-0.5">Je hebt een</text>
      <text x="150" y="244" textAnchor="middle" fontSize="28" fontWeight="900" fill="#46f1c5" fontFamily="Inter" fontStyle="italic" letterSpacing="-0.5">match!</text>

      {/* Bericht knop hint */}
      <rect x="90" y="256" width="120" height="32" rx="16" fill="rgba(70,241,197,0.15)" stroke="rgba(70,241,197,0.3)" strokeWidth="1" />
      <text x="150" y="275" textAnchor="middle" fontSize="9" fill="rgba(70,241,197,0.8)" fontFamily="Plus Jakarta Sans" fontWeight="700" letterSpacing="1">BERICHT STUREN</text>
    </svg>
  )
}

function TochtenVisual() {
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Achtergrond */}
      <circle cx="150" cy="150" r="120" fill="rgba(70,241,197,0.05)" />

      {/* Kaart/map achtergrond */}
      <rect x="50" y="60" width="200" height="155" rx="18" fill="rgba(20,32,50,0.95)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

      {/* Kustlijn decoratief */}
      <path d="M65 170 Q100 155 130 165 Q160 175 185 160 Q210 148 235 158" stroke="rgba(70,241,197,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M65 185 Q95 175 120 182 Q155 192 185 178 Q210 168 235 175" stroke="rgba(70,241,197,0.12)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Grid lijnen licht */}
      <line x1="65" y1="140" x2="235" y2="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <line x1="150" y1="75"  x2="150" y2="200" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

      {/* Route lijn */}
      <path d="M90 185 Q120 145 150 130 Q180 115 210 125" stroke="rgba(70,241,197,0.35)" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" fill="none" />

      {/* Start punt */}
      <circle cx="90" cy="185" r="6" fill="rgba(70,241,197,0.3)" stroke="rgba(70,241,197,0.6)" strokeWidth="1.5" />
      <circle cx="90" cy="185" r="2.5" fill="#46f1c5" />

      {/* Eind locatie pin */}
      <circle cx="210" cy="120" r="16" fill="rgba(70,241,197,0.15)" />
      <circle cx="210" cy="120" r="8"  fill="rgba(70,241,197,0.3)" stroke="rgba(70,241,197,0.6)" strokeWidth="1.5" />
      <circle cx="210" cy="120" r="3"  fill="#46f1c5" />

      {/* Mini zeilboot op de route */}
      <g transform="translate(148, 112)">
        <path d="M0 18 L-10 15 L0 -5 Z" fill="rgba(255,255,255,0.2)" />
        <path d="M0 18 L10 15 L3 2 Z" fill="rgba(70,241,197,0.4)" />
        <line x1="0" y1="-7" x2="0" y2="20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M-10 17 Q0 22 10 17" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Tocht kaartjes onderaan */}
      <rect x="60"  y="228" width="82"  height="44" rx="10" fill="rgba(42,53,72,0.8)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <rect x="158" y="228" width="82"  height="44" rx="10" fill="rgba(42,53,72,0.8)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      <text x="101" y="247" textAnchor="middle" fontSize="8"  fill="rgba(70,241,197,0.7)" fontFamily="Plus Jakarta Sans" fontWeight="700">DAGJE VAREN</text>
      <text x="101" y="259" textAnchor="middle" fontSize="7.5" fill="rgba(186,202,194,0.5)" fontFamily="Plus Jakarta Sans">Hoorn → Enkhuizen</text>
      <text x="101" y="269" textAnchor="middle" fontSize="7"  fill="rgba(186,202,194,0.35)" fontFamily="Plus Jakarta Sans">2 plekken vrij</text>

      <text x="199" y="247" textAnchor="middle" fontSize="8"  fill="rgba(173,200,245,0.7)" fontFamily="Plus Jakarta Sans" fontWeight="700">WEEKEND</text>
      <text x="199" y="259" textAnchor="middle" fontSize="7.5" fill="rgba(186,202,194,0.5)" fontFamily="Plus Jakarta Sans">IJsselmeer tour</text>
      <text x="199" y="269" textAnchor="middle" fontSize="7"  fill="rgba(186,202,194,0.35)" fontFamily="Plus Jakarta Sans">1 plek vrij</text>
    </svg>
  )
}
