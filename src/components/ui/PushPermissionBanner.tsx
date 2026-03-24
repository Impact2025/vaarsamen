'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'

export function PushPermissionBanner() {
  const { state, loading, requestPermission } = usePushNotifications()

  // Toon alleen als meldingen nog niet gevraagd/ingesteld zijn
  if (state !== 'default' || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null

  return (
    <div className="mx-4 mb-4 p-4 glass-card rounded-2xl border border-primary/20 flex items-start gap-3">
      <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
        notifications
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-label text-sm font-bold text-on-surface mb-0.5">
          Mis geen aanmeldingen
        </p>
        <p className="font-body text-xs text-on-surface-variant">
          Ontvang een melding als iemand zich aanmeldt voor jouw tocht.
        </p>
      </div>
      <button
        onClick={requestPermission}
        disabled={loading}
        className="flex-shrink-0 px-4 py-2 rounded-full gradient-primary text-on-primary
                   font-label text-xs font-bold shadow-glow active:scale-95 transition-all
                   disabled:opacity-50"
      >
        {loading ? '…' : 'Inschakelen'}
      </button>
    </div>
  )
}
