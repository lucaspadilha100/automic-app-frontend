import { LucideIcon } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  isLoading?: boolean
  keyExtractor?: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
}

export function DataTable<T extends { id: string }>({
  data, columns, onRowClick, isLoading, emptyTitle, emptyDescription, emptyIcon: EmptyIcon
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="animate-pulse divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3.5">
            <div className="h-4 bg-slate-200 rounded flex-1" />
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-4 bg-slate-200 rounded w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!data.length && emptyTitle) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {EmptyIcon && (
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <EmptyIcon className="w-6 h-6 text-slate-400" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-slate-700">{emptyTitle}</h3>
        {emptyDescription && <p className="text-sm text-slate-400 mt-1 max-w-xs">{emptyDescription}</p>}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead className="thead">
          <tr>
            {columns.map(c => <th key={c.key} className={`th ${c.className || ''}`}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className={`tr ${onRowClick ? 'cursor-pointer' : ''}`} onClick={() => onRowClick?.(row)}>
              {columns.map(c => (
                <td key={c.key} className="td">
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
