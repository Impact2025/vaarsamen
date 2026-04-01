'use client'

import { useTheme } from './ThemeProvider'
import { useEffect, useState } from 'react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className={`w-9 h-9 rounded-full ${className}`} aria-hidden="true" />
  }

  const isDark = theme !== 'light'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
      className={[
        'w-9 h-9 flex items-center justify-center rounded-full',
        'glass-card border border-white/10',
        'text-on-surface-variant hover:text-primary hover:border-primary/30',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        className,
      ].join(' ')}
    >
      <span
        className="material-symbols-outlined text-[18px] select-none"
        style={{ fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
