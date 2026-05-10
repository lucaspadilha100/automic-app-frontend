export function LoadingState({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4 animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 rounded w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="table-wrap animate-pulse">
      <div className="thead h-10 bg-slate-50" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-200 rounded flex-1" style={{ flex: c === 0 ? 2 : 1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
