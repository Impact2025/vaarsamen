'use client'

import { motion } from 'framer-motion'

interface SwipeActionsProps {
  onPass:    () => void
  onLike:    () => void
  onMessage: () => void
  disabled?: boolean
}

export function SwipeActions({ onPass, onLike, onMessage, disabled }: SwipeActionsProps) {
  return (
    <div className="flex justify-center items-center gap-6 mt-4" role="group" aria-label="Acties">

      {/* Overslaan */}
      <div className="flex flex-col items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onPass}
          disabled={disabled}
          aria-label="Overslaan"
          className="w-14 h-14 rounded-full bg-surface-container border border-white/10
                     flex items-center justify-center text-on-surface/50
                     hover:border-error/40 hover:text-error
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
        >
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
        </motion.button>
        <span className="font-label text-[10px] text-on-surface/40 select-none">Sla over</span>
      </div>

      {/* Interesse — primaire CTA */}
      <div className="flex flex-col items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          onClick={onLike}
          disabled={disabled}
          aria-label="Aan boord — interesse tonen"
          className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center
                     text-on-primary shadow-glow
                     disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span
            className="material-symbols-outlined text-[36px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            sailing
          </span>
        </motion.button>
        <span className="font-label text-[11px] font-semibold text-primary select-none">Aan boord</span>
      </div>

      {/* Bericht sturen */}
      <div className="flex flex-col items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onMessage}
          disabled={disabled}
          aria-label="Bericht sturen en interesse tonen"
          className="w-14 h-14 rounded-full bg-surface-container border border-white/10
                     flex items-center justify-center text-on-surface/50
                     hover:border-primary/40 hover:text-primary
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined text-2xl" aria-hidden="true">send</span>
        </motion.button>
        <span className="font-label text-[10px] text-on-surface/40 select-none">Bericht</span>
      </div>

    </div>
  )
}
