import Link from 'next/link'
import { db } from '@/lib/db'
import { profiles, tochten, matches, reports } from '@/lib/db/schema'
import { count, eq, and, isNull, sql } from 'drizzle-orm'

async function getStats() {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    [totaal],
    [actiefTochten],
    [alleTochten],
    [alleMatches],
    [pendingReports],
    [pendingCWO],
    [proUsers],
    [nieuwDezeWeek],
  ] = await Promise.all([
    db.select({ n: count() }).from(profiles).where(isNull(profiles.deletedAt)),
    db.select({ n: count() }).from(tochten).where(and(eq(tochten.status, 'open'), isNull(tochten.deletedAt))),
    db.select({ n: count() }).from(tochten).where(isNull(tochten.deletedAt)),
    db.select({ n: count() }).from(matches),
    db.select({ n: count() }).from(reports).where(eq(reports.status, 'pending')),
    db.select({ n: count() }).from(profiles).where(and(
      sql`${profiles.cwoDocumentUrl} is not null`,
      eq(profiles.cwoVerified, false),
      isNull(profiles.deletedAt),
    )),
    db.select({ n: count() }).from(profiles).where(and(
      sql`${profiles.subscriptionTier} != 'free'`,
      isNull(profiles.deletedAt),
    )),
    db.select({ n: count() }).from(profiles).where(and(
      sql`${profiles.createdAt} > ${weekAgo}::timestamptz`,
      isNull(profiles.deletedAt),
    )),
  ])

  return {
    totalUsers:     totaal.n,
    activeTochten:  actiefTochten.n,
    totalTochten:   alleTochten.n,
    totalMatches:   alleMatches.n,
    pendingReports: pendingReports.n,
    pendingCWO:     pendingCWO.n,
    proUsers:       proUsers.n,
    newUsersWeek:   nieuwDezeWeek.n,
  }
}

const CARDS = [
  { key: 'totalUsers',     label: 'Zeilers',          icon: 'group',             href: '/admin/gebruikers',            color: '#46f1c5', alert: false },
  { key: 'newUsersWeek',   label: 'Nieuw deze week',  icon: 'person_add',        href: '/admin/gebruikers',            color: '#60a5fa', alert: false },
  { key: 'activeTochten',  label: 'Actieve tochten',  icon: 'sailing',           href: '/admin/tochten',               color: '#fbbf24', alert: false },
  { key: 'totalTochten',   label: 'Totaal tochten',   icon: 'anchor',            href: '/admin/tochten',               color: '#a78bfa', alert: false },
  { key: 'totalMatches',   label: 'Matches',          icon: 'favorite',          href: '/admin/gebruikers',            color: '#fb7185', alert: false },
  { key: 'proUsers',       label: 'Pro abonnementen', icon: 'workspace_premium', href: '/admin/gebruikers',            color: '#34d399', alert: false },
  { key: 'pendingReports', label: 'Meldingen (open)', icon: 'flag',              href: '/admin/meldingen',             color: '#f87171', alert: true  },
  { key: 'pendingCWO',     label: 'CWO wachtrij',     icon: 'verified',          href: '/admin/cwo',                   color: '#fb923c', alert: true  },
] as const

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-headline font-black text-2xl text-on-surface">Dashboard</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">Platform overzicht</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.map(card => {
          const value    = stats[card.key as keyof typeof stats]
          const hasAlert = card.alert && value > 0
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`glass-card rounded-2xl p-4 border transition-all hover:scale-[1.02] active:scale-[0.98]
                ${hasAlert ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/5'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: card.color + '22' }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: card.color, fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >{card.icon}</span>
                </div>
                {hasAlert && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1" aria-label="Vereist aandacht" />
                )}
              </div>
              <div className="font-headline font-black text-2xl text-on-surface">
                {value.toLocaleString('nl-NL')}
              </div>
              <p className="font-label text-xs text-on-surface-variant mt-1">{card.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Snelkoppelingen */}
      <div className="glass-card rounded-2xl p-5 border border-white/5">
        <h2 className="font-headline font-bold text-base text-on-surface mb-4">Snelkoppelingen</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: '/admin/meldingen',                        label: 'Open meldingen beoordelen',  icon: 'flag'              },
            { href: '/admin/cwo',                              label: 'CWO certificaten verifiëren', icon: 'verified'          },
            { href: '/admin/gebruikers?filter=geblokkeerd',    label: 'Geblokkeerde gebruikers',     icon: 'block'             },
            { href: '/admin/push',                             label: 'Push broadcast sturen',       icon: 'campaign'          },
            { href: '/admin/tochten',                          label: 'Tochten modereren',           icon: 'sailing'           },
            { href: '/admin/gebruikers?filter=pro',            label: 'Pro-abonnees',                icon: 'workspace_premium' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-white/5
                         hover:border-primary/20 hover:bg-primary/5 transition-all
                         font-label text-sm text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-base flex-shrink-0" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
