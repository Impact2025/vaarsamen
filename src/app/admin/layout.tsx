import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin',            icon: 'dashboard',    label: 'Dashboard'    },
  { href: '/admin/gebruikers', icon: 'group',        label: 'Gebruikers'   },
  { href: '/admin/tochten',    icon: 'sailing',      label: 'Tochten'      },
  { href: '/admin/meldingen',  icon: 'flag',         label: 'Meldingen'    },
  { href: '/admin/cwo',        icon: 'verified',     label: 'CWO'          },
  { href: '/admin/push',       icon: 'campaign',     label: 'Broadcast'    },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.isAdmin) redirect('/')

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-56 bg-surface-container border-r border-white/5 min-h-screen sticky top-0">
        <div className="px-5 py-6 border-b border-white/5">
          <span className="font-headline font-black text-lg text-on-surface">⚙️ Admin</span>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">VaarSamen</p>
        </div>
        <nav className="flex-1 py-4 px-2" aria-label="Admin navigatie">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 font-label text-sm text-on-surface-variant
                         hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-2 font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            Terug naar app
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-container border-b border-white/5 sticky top-0 z-10">
        <span className="font-headline font-black text-base text-on-surface flex-1">⚙️ Admin</span>
        <div className="flex gap-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">{item.icon}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
