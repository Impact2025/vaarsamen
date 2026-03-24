'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/ontdekken', icon: 'explore',        label: 'Ontdekken', badge: false },
  { href: '/matches',   icon: 'sailing',         label: 'Crew',      badge: false },
  { href: '/tochten',   icon: 'directions_boat', label: 'Tochten',   badge: true  },
  { href: '/profiel',   icon: 'account_circle',  label: 'Profiel',   badge: false },
] as const

const LAST_VISIT_KEY = 'tochten_last_visit'

function TochtenBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
    const since     = lastVisit ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    fetch(`/api/tochten/count?since=${encodeURIComponent(since)}`)
      .then(r => r.json())
      .then(d => setCount(d.nieuw ?? 0))
      .catch(() => {})
  }, [])

  if (count === 0) return null
  return (
    <span
      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
                 bg-error text-white font-label text-[10px] font-bold
                 flex items-center justify-center leading-none"
      aria-label={`${count} nieuwe tochten`}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  // Markeer Tochten als bezocht zodat badge verdwijnt
  useEffect(() => {
    if (pathname === '/tochten' || pathname.startsWith('/tochten/')) {
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
    }
  }, [pathname])

  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="fixed bottom-0 w-full rounded-t-[2rem] z-50 pb-[max(1.5rem,_env(safe-area-inset-bottom))] pt-2 px-4
                 bg-surface/40 backdrop-blur-[30px]
                 shadow-[0_-10px_40px_rgba(3,14,32,0.8)]
                 border-t border-white/5"
    >
      <div className="flex justify-around items-end max-w-md mx-auto">
        {NAV_ITEMS.map(({ href, icon, label, badge }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'relative flex flex-col items-center justify-center p-3 transition-all duration-300',
                isActive
                  ? 'gradient-primary text-on-primary rounded-full mb-1 shadow-glow'
                  : 'text-on-surface/60 hover:text-primary focus:text-primary focus:outline-none'
              )}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                aria-hidden="true"
              >
                {icon}
              </span>
              {!isActive && badge && <TochtenBadge />}
              {!isActive && (
                <span className="font-label text-[10px] font-semibold uppercase tracking-widest mt-1">
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
