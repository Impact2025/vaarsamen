import { BottomNav } from '@/components/ui/BottomNav'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoutButton } from '@/components/ui/LogoutButton'
import { PushPermissionBanner } from '@/components/ui/PushPermissionBanner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <main className="max-w-md mx-auto pb-28 min-h-dvh">
        {children}
      </main>
      <PushPermissionBanner />
      {/* Rechtsboven: thema + altijd zichtbare uitlog-knop voor elke gebruiker */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-1.5">
        <LogoutButton showIcon={false} label="Uitloggen" />
        <ThemeToggle />
      </div>
      <BottomNav />
    </div>
  )
}
