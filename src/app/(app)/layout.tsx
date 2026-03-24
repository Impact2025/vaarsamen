import { BottomNav } from '@/components/ui/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <main className="max-w-md mx-auto pb-28 min-h-dvh">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
