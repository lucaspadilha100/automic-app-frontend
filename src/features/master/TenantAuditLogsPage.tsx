import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import type { AuditLog } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TenantAuditLogsPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['master', 'tenant-audit', tenantId],
    queryFn: () => masterApi.getTenantAuditLogs(tenantId!, { limit: 100 }),
  })

  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'Ação', render: (l) => <span className="font-mono text-xs text-indigo-300">{l.action}</span> },
    { key: 'entity', header: 'Entidade', render: (l) => <span className="text-gray-400 text-xs">{l.entity_type || '—'}</span> },
    { key: 'user', header: 'Usuário', render: (l) => <span className="text-gray-400 text-xs">{l.user_id ? l.user_id.slice(0, 8) + '...' : '—'}</span> },
    { key: 'date', header: 'Data', render: (l) => <span className="text-gray-500 text-xs">{format(new Date(l.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span> },
  ]

  return (
    <div>
      <PageHeader title="Logs de Auditoria" />
      <div className="card bg-white border-slate-200">
        <DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(l) => l.id} emptyTitle="Nenhum log registrado" />
      </div>
    </div>
  )
}
