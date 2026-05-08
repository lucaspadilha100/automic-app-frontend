import { useQuery } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Activity } from 'lucide-react'
import { useState } from 'react'

export default function MasterTasksPage() {
  const [filterName, setFilterName] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['master','tasks', filterName],
    queryFn: () => masterApi.listTaskRuns({ task_name: filterName || undefined, limit: 50 }),
  })

  if (isLoading) return <div><PageHeader title="Task Runs" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Task Runs" subtitle="Histórico de execuções de jobs" />

      <div className="flex gap-2">
        <input className="input max-w-xs" placeholder="Filtrar por job..." value={filterName} onChange={e => setFilterName(e.target.value)} />
      </div>

      <div className="table-wrap">
        {!data?.items?.length ? <EmptyState icon={Activity} title="Nenhuma execução encontrada" /> : (
          <table className="table">
            <thead className="thead"><tr>
              <th className="th">Job</th>
              <th className="th">Status</th>
              <th className="th">Fonte</th>
              <th className="th">Duração</th>
              <th className="th">Executado em</th>
              <th className="th">Erro</th>
            </tr></thead>
            <tbody>
              {data.items.map((t: Record<string,unknown>) => (
                <tr key={t.id as string} className="tr">
                  <td className="td font-mono text-xs font-semibold text-slate-700">{t.task_name as string}</td>
                  <td className="td"><StatusBadge status={t.status as string} /></td>
                  <td className="td text-xs text-slate-400">{t.source as string}</td>
                  <td className="td text-xs">{t.duration_ms ? `${t.duration_ms}ms` : '-'}</td>
                  <td className="td text-xs text-slate-400">{new Date(t.started_at as string).toLocaleString('pt-BR')}</td>
                  <td className="td text-xs text-red-500 max-w-xs truncate">{t.error_message as string || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
