'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/ontdekken',         icon: 'explore',         label: 'Ontdekken' },
  { href: '/mijn-vorderingen',  icon: 'school',          label: 'Vorderingen' },
  { href: '/boeken',            icon: 'sailing',         label: 'Boeken' },
  { href: '/school-berichten',  icon: 'campaign',        label: 'School' },
  { href: '/berichten',         icon: 'chat',            label: 'Berichten' },
  { href: '/profiel',           icon: 'account_circle',  label: 'Profiel' },
] as const

const BERICHTEN_KEY = 'berichten_last_visit'
const SCHOOL_KEY    = 'school_berichten_last_visit'

export function BottomNav() {
  const pathname = usePathname()
  const [berichtenCount, setBerichtenCount] = useState(0)
  const [schoolCount,    setSchoolCount]    = useState(0)

  useEffect(() => {
    fetch('/api/matches?unread=1')
      .then(r => r.json()).then(d => setBerichtenCount(d.unread ?? 0)).catch(() => {})

    fetch('/api/school-berichten')
      .then(r => r.json()).then(d => {
        const ongelezen = (d.berichten ?? []).filter((b: any) => !b.gelezenOp).length
        setSchoolCount(ongelezen)
      }).catch(() => {})
  }, [])

  useEffect(() => {
    if (pathname === '/berichten' || pathname.startsWith('/berichten/') ||
        pathname === '/matches'   || pathname.startsWith('/matches/')) {
      localStorage.setItem(BERICHTEN_KEY, new Date().toISOString())
      setBerichtenCount(0)
    }
    if (pathname === '/school-berichten') {
      localStorage.setItem(SCHOOL_KEY, new Date().toISOString())
      setSchoolCount(0)
    }
  }, [pathname])

  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {/* Frosted glass bar */}
      <div className="relative mx-4 mb-0">
        <div
          className="rounded-2xl overflow-hidden
                     bg-surface/88 backdrop-blur-[32px]
                     border border-black/[0.07]
                     shadow-[0_8px_32px_rgba(7,19,37,0.12),0_2px_8px_rgba(7,19,37,0.06)]"
        >
          <div className="flex justify-around items-center px-1 py-1.5 max-w-md mx-auto">
            {NAV_ITEMS.map(({ href, icon, label }) => {
              const isActive   = pathname === href || pathname.startsWith(`${href}/`) ||
                (href === '/berichten' && (pathname === '/matches' || pathname.startsWith('/matches/')))
              const badgeCount = href === '/berichten' ? berichtenCount
                               : href === '/school-berichten' ? schoolCount
                               : 0

              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                             transition-none"
                >
                  {/* Animated pill achter actief item */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Icoon */}
                  <span
                    className={[
                      'material-symbols-outlined text-[24px] relative z-10',
                      'transition-colors duration-150',
                      isActive ? 'text-primary' : 'text-on-surface/38',
                    ].join(' ')}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>

                  {/* Label */}
                  <span className={[
                    'font-label text-[10px] font-semibold tracking-wide relative z-10',
                    'transition-colors duration-150',
                    isActive ? 'text-primary' : 'text-on-surface/38',
                  ].join(' ')}>
                    {label}
                  </span>

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span
                      className="absolute top-1 right-3 min-w-[16px] h-4 px-1 rounded-full
                                 bg-error text-white font-label text-[10px] font-bold
                                 flex items-center justify-center leading-none pointer-events-none z-20"
                      aria-label={`${badgeCount} nieuw`}
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>

  )
}
