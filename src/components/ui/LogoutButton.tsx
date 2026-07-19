'use client'

import { logout } from '@/app/actions/logout'

type Props = {
  /** Extra Tailwind-classes (bijv. voor positie of variant). */
  className?: string
  /** Toon het icoontje vóór het label. */
  showIcon?: boolean
  /** Labeltekst. */
  label?: string
  /** Variant: 'ghost' (tekst/zacht) of 'pill' (opvallende knop). */
  variant?: 'ghost' | 'pill'
}

/**
 * Universele uitlog-knop. Roept de gedeelde server-action `logout` aan,
 * dus geen client-side JS nodig en werkt overal (app én admin).
 */
export function LogoutButton({
  className = '',
  showIcon = true,
  label = 'Uitloggen',
  variant = 'ghost',
}: Props) {
  const base = [
    'inline-flex items-center justify-center gap-1.5',
    'font-label font-semibold text-sm',
    'transition-colors focus:outline-none focus-visible:ring-2',
    'focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    'rounded-full',
  ]

  const variants = {
    ghost:
      'text-on-surface-variant/70 hover:text-error px-3 py-1.5',
    pill:
      'bg-error/10 text-error hover:bg-error/20 px-4 py-2 border border-error/20',
  }

  return (
    <form action={logout}>
      <button type="submit" aria-label="Uitloggen" className={[...base, variants[variant], className].join(' ')}>
        {showIcon && (
          <span
            className="material-symbols-outlined text-[18px] select-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            logout
          </span>
        )}
        {label}
      </button>
    </form>
  )
}
