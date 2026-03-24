export function TochtCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 border border-white/5 animate-pulse">
      <div className="w-8 h-1 rounded-full bg-white/10 mb-3" />
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-24 rounded-full bg-white/10" />
        <div className="h-4 w-10 rounded bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/10 ml-auto" />
      </div>
      <div className="h-6 w-3/4 rounded bg-white/10 mb-1" />
      <div className="h-5 w-1/2 rounded bg-white/10 mb-3" />
      <div className="h-4 w-full rounded bg-white/10 mb-1" />
      <div className="h-4 w-5/6 rounded bg-white/10 mb-3" />
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/10" />
        <div className="h-6 w-20 rounded-full bg-white/10" />
        <div className="h-6 w-16 rounded-full bg-white/10 ml-auto" />
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <div className="w-7 h-7 rounded-lg bg-white/10" />
        <div className="h-4 w-32 rounded bg-white/10" />
      </div>
    </div>
  )
}

export function TochtenPageSkeleton() {
  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-28 rounded bg-white/10 animate-pulse mb-2" />
          <div className="h-4 w-48 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-10 w-24 rounded-full bg-white/10 animate-pulse" />
      </div>
      {/* Filter bar skeleton */}
      <div className="h-10 w-full rounded-2xl bg-white/10 animate-pulse mb-3" />
      <div className="flex gap-2 mb-4">
        {[80, 72, 88, 64, 96].map((w, i) => (
          <div key={i} className="h-8 rounded-full bg-white/10 animate-pulse" style={{ width: w }} />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <TochtCardSkeleton key={i} />)}
      </div>
    </div>
  )
}
