import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="min-h-dvh bg-surface">
      <main className="max-w-md mx-auto pb-28 min-h-dvh">
        {children}
      </main>
      <ThemeToggle className="fixed top-4 right-4 z-40" />
      <BottomNav />
    </div>
  )
}
