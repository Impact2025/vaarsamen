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
    <div className="flex justify-center items-center gap-8 mt-6" role="group" aria-label="Swipe acties">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onPass}
        disabled={disabled}
        aria-label="Overslaan"
        className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center
                   text-error border border-error/20 hover:bg-error/10 transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
      >
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">close</span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onLike}
        disabled={disabled}
        aria-label="Interesse tonen"
        className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center
                   text-on-primary shadow-glow hover:scale-105 transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span
          className="material-symbols-outlined text-4xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden="true"
        >
          sailing
        </span>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onMessage}
        disabled={disabled}
        aria-label="Direct bericht sturen"
        className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center
                   text-secondary border border-secondary/20 hover:bg-secondary/10 transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        <span className="material-symbols-outlined text-3xl" aria-hidden="true">chat_bubble</span>
      </motion.button>
    </div>
  )
}
