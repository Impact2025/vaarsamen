'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface MatchModalProps {
  isOpen:          boolean
  matchedProfile:  Profile
  myProfile:       Profile
  matchId:         string
  onClose:         () => void
}

export function MatchModal({ isOpen, matchedProfile, myProfile, matchId, onClose }: MatchModalProps) {
  const router = useRouter()

  const handleMessage = () => {
    onClose()
    router.push(`/matches/${matchId}`)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Nieuwe match!"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-full max-w-sm"
          >
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                  sailing
                </span>
                <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
                  Nieuwe Match
                </span>
              </div>
            </div>

            {/* Titel */}
            <div className="text-center mb-10">
              <h1 className="font-headline font-black text-5xl text-on-surface tracking-tight leading-[0.9] mb-3">
                Je hebt een <br />
                <span className="text-primary italic">match!</span>
              </h1>
              <p className="text-on-surface-variant font-body">
                Jij en {matchedProfile.displayName} hebben dezelfde koers gekozen.
              </p>
            </div>

            {/* Foto's */}
            <div className="glass-card rounded-card p-8 mb-6">
              <div className="flex justify-center items-center mb-8 relative">
                <ProfilePhoto profile={myProfile} rotate="left" />
                <div className="absolute z-30 w-14 h-14 rounded-full gradient-primary shadow-glow border-4 border-surface flex items-center justify-center translate-y-8" aria-hidden="true">
                  <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>anchor</span>
                </div>
                <ProfilePhoto profile={matchedProfile} rotate="right" />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleMessage}
                  className="gradient-primary w-full py-5 rounded-full font-headline font-extrabold text-on-primary
                             flex items-center justify-center gap-3 active:scale-95 transition-all shadow-glow
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">chat_bubble</span>
                  BERICHT STUREN
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-full font-headline font-bold text-on-surface-variant hover:text-on-surface transition-colors
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-outline"
                >
                  Later afspreken
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ProfilePhoto({ profile, rotate }: { profile: Profile; rotate: 'left' | 'right' }) {
  return (
    <div className={`relative z-${rotate === 'left' ? '20' : '10'} ${rotate === 'left' ? '-translate-x-4' : 'translate-x-4'}`}>
      <div className={`w-32 h-32 rounded-[1.5rem] overflow-hidden border-4 border-surface shadow-deep ${rotate === 'left' ? 'rotate-[-6deg]' : 'rotate-[6deg]'}`}>
        {profile.photoUrl ? (
          <Image
            src={profile.photoUrl}
            alt={`Foto van ${profile.displayName}`}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="w-full h-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant" aria-hidden="true">person</span>
          </div>
        )}
      </div>
    </div>
  )
}
