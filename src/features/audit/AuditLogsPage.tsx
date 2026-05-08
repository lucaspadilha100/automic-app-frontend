import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import type { AuditLog } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
export default function AuditLogsPage() {
  const [action, setAction] = useState('')
  const { data, isLoading } = useQuery({ queryKey: ['audit-logs', action], queryFn: () => auditApi.list({ action: action || undefined }) })
  const { data: actions } = useQuery({ queryKey: ['audit-actions'], queryFn: () => auditApi.listActions() })
  const columns: Column<AuditLog>[] = [
    { key: 'action', header: 'Ação', render: (l) => <span className="font-mono text-xs text-primary-600">{l.action}</span> },
    { key: 'entity', header: 'Entidade', render: (l) => <span className="text-gray-500 text-xs">{l.entity_type || '—'}</span> },
    { key: 'user', header: 'Usuário', render: (l) => <span className="text-gray-500 text-xs">{l.user_id ? l.user_id.slice(0, 8) + '...' : 'Sistema'}</span> },
    { key: 'date', header: 'Data', render: (l) => <span className="text-gray-500 text-xs">{format(new Date(l.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</span> },
  ]
  return (
    <div>
      <PageHeader title="Logs de Auditoria" />
      <div className="mb-4"><select value={action} onChange={(e) => setAction(e.target.value)} className="input max-w-64 py-1.5 text-sm"><option value="">Todas as ações</option>{actions?.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
      <div className="card"><DataTable columns={columns} data={data?.items || []} isLoading={isLoading} keyExtractor={(l) => l.id} emptyTitle="Nenhum log" /></div>
    </div>
  )
}
