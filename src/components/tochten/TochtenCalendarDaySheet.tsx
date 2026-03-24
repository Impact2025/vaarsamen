'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import { TochtCard } from './TochtCard'
import type { TochtMetPoster } from '@/lib/db/queries/tochten'

interface Props {
  datum:    string | null   // YYYY-MM-DD
  tochten:  TochtMetPoster[]
  onClose:  () => void
}

export function TochtenCalendarDaySheet({ datum, tochten, onClose }: Props) {
  const label = datum ? format(parseISO(datum), 'EEEE d MMMM', { locale: nl }) : ''

  return (
    <AnimatePresence>
      {datum && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            role="dialog"
            aria-label={`Tochten op ${label}`}
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem]
                       bg-surface border-t border-white/10
                       shadow-[0_-20px_60px_rgba(3,14,32,0.9)]
                       max-h-[78vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/5">
              <div>
                <h2 className="font-headline font-black text-lg text-on-surface capitalize">{label}</h2>
                <p className="font-label text-xs text-on-surface-variant">
                  {tochten.length} {tochten.length === 1 ? 'tocht' : 'tochten'}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Sluiten"
                className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Tochten lijst */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3 pb-8">
              {tochten.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3" aria-hidden="true">sailing</span>
                  <p className="font-body text-sm text-on-surface-variant">Geen tochten op deze dag</p>
                </div>
              ) : (
                tochten.map(item => (
                  <TochtCard key={item.tocht.id} {...item} compact />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
