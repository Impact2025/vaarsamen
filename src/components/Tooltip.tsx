'use client'

import { useState, useRef, type ReactNode } from 'react'

// Lichte, dependency-vrije tooltip. Toont uitleg bij hover én focus (toetsenbord).
// Gebruik: <Tooltip label="..."><button>...</button></Tooltip>
export function Tooltip({
  label,
  children,
  side = 'bottom',
}: {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  const t = useRef<number | undefined>(undefined)

  const show = () => { window.clearTimeout(t.current); setOpen(true) }
  const hide = () => { t.current = window.setTimeout(() => setOpen(false), 60) }

  const pos =
    side === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2'

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-50 ${pos} w-max max-w-[220px] px-2.5 py-1.5
            rounded-xl bg-surface-container-high border border-white/10 shadow-deep
            font-label text-[11px] leading-snug text-on-surface`}
        >
          {label}
        </span>
      )}
    </span>
  )
}
