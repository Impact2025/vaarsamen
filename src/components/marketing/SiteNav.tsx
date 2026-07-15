'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '#oplossing', label: 'Wat wij oplossen' },
  { href: '#functies', label: 'Functies' },
  { href: '#prijzen', label: 'Prijzen' },
  { href: '#over-ons', label: 'Wie zijn wij' },
  { href: '#faq', label: 'FAQ' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-black/5 bg-surface/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl gradient-primary shadow-glow">
              <span
                className="material-symbols-outlined text-[20px] text-on-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                sailing
              </span>
            </span>
            <span className="font-headline text-lg font-extrabold tracking-tight text-on-surface">
              VaarSamen
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-label text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="font-label text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              Inloggen
            </Link>
            <Link
              href="/registreer"
              className="rounded-full gradient-primary px-5 py-2.5 font-headline text-sm font-bold text-on-primary shadow-glow transition-transform active:scale-95"
            >
              Gratis starten
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Menu openen"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full glass-card text-on-surface md:hidden"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              {open ? 'close' : 'menu'}
            </span>
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-b border-black/5 bg-surface/95 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 font-label text-sm font-semibold text-on-surface-variant transition-colors hover:bg-primary/5 hover:text-primary"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-full border border-primary/30 px-5 py-3 text-center font-label text-sm font-bold text-primary"
              >
                Inloggen
              </Link>
              <Link
                href="/registreer"
                onClick={() => setOpen(false)}
                className="rounded-full gradient-primary px-5 py-3 text-center font-headline text-sm font-bold text-on-primary shadow-glow"
              >
                Gratis starten
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
