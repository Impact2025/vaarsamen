import { BottomNav } from '@/components/ui/BottomNav'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PushPermissionBanner } from '@/components/ui/PushPermissionBanner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <main className="max-w-md mx-auto pb-28 min-h-dvh">
        {children}
      </main>
      <PushPermissionBanner />
      <ThemeToggle className="fixed top-4 right-4 z-40" />
      <BottomNav />
    </div>
  )
}
