import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { NotificationLog } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
export default function NotificationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['notification-logs'], queryFn: () => notificationsApi.getLogs() })
  const columns: Column<NotificationLog>[] = [
    { key: 'type', header: 'Evento', render: (n) => <span className="font-mono text-xs text-primary-600">{n.event_type}</span> },
    { key: 'channel', header: 'Canal', render: (n) => <span className="badge bg-blue-50 text-blue-700">{n.channel}</span> },
    { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
    { key: 'date', header: 'Data', render: (n) => <span className="text-xs text-gray-500">{n.sent_at ? format(new Date(n.sent_at), 'dd/MM/yy HH:mm', { locale: ptBR }) : '—'}</span> },
  ]
  return (
    <div>
      <PageHeader title="Logs de Notificações" />
      <div className="card"><DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(n) => n.id} emptyTitle="Nenhuma notificação" /></div>
    </div>
  )
}
