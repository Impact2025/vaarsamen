import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'animate-pulse rounded-lg bg-surface-container-high',
        className
      )}
    />
  )
}

export function SwipeCardSkeleton() {
  return (
    <div className="w-full aspect-[3/4] rounded-card bg-surface-container animate-pulse" aria-label="Laden..." />
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}
