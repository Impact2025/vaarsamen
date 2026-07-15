'use client'

import { useState } from 'react'

export interface FaqItem {
  q: string
  a: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            className="glass-card overflow-hidden rounded-3xl border border-black/5 transition-shadow"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-headline text-base font-bold text-on-surface">
                {item.q}
              </span>
              <span
                className={`material-symbols-outlined shrink-0 text-xl text-primary transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                expand_more
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 font-body text-[0.95rem] leading-relaxed text-on-surface-variant">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
