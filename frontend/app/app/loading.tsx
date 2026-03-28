export default function AppLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-lg bg-muted" />
          <div className="h-3.5 w-56 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-muted" />
          <div className="h-8 w-28 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card" />
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-muted" style={{ width: `${60 + i * 12}px` }} />
        ))}
      </div>

      {/* Main content block — table skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 rounded bg-muted flex-1" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-0">
            <div className="size-8 rounded-full bg-muted shrink-0" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3.5 rounded bg-muted flex-1" style={{ opacity: 1 - j * 0.15 }} />
            ))}
            <div className="h-7 w-16 rounded-lg bg-muted shrink-0" />
          </div>
        ))}
      </div>

      {/* Secondary card row (charts / summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-52 rounded-xl border border-border bg-card" />
        <div className="h-52 rounded-xl border border-border bg-card" />
      </div>
    </div>
  )
}
