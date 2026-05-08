import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Bell, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const SEVERITY_COLORS: Record<string,string> = {
  info: 'border-l-blue-400 bg-blue-50/50',
  warning: 'border-l-amber-400 bg-amber-50/50',
  error: 'border-l-red-400 bg-red-50/50',
  success: 'border-l-emerald-400 bg-emerald-50/50',
}

export default function MasterNotificationsPage() {
  const qc = useQueryClient()
  const { data: rawNotifs, isLoading } = useQuery({ queryKey: ['master','notifications'], queryFn: () => masterApi.listNotifications() })
  const notifs = rawNotifs?.items || rawNotifs || []

  const markAllMut = useMutation({
    mutationFn: () => masterApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','notifications'] }); toast.success('Todas marcadas como lidas') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const markMut = useMutation({
    mutationFn: (id: string) => masterApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master','notifications'] }),
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Notificações"
        subtitle="Eventos da plataforma"
        actions={
          <button className="btn-secondary" onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}>
            <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
          </button>
        }
      />
      <div className="space-y-2">
        {!notifs?.length ? <EmptyState icon={Bell} title="Sem notificações" /> : notifs.map((n: Record<string,unknown>) => (
          <div key={n.id as string}
            className={`card border-l-4 p-4 flex items-start justify-between gap-4 transition-all ${SEVERITY_COLORS[n.severity as string] || 'border-l-slate-300'} ${!n.read_at ? 'ring-1 ring-primary-200' : 'opacity-70'}`}>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{n.title as string}</p>
                {!n.read_at && <span className="badge-cyan text-[10px]">Novo</span>}
              </div>
              <p className="text-xs text-slate-500 mt-1">{n.message as string}</p>
              <p className="text-[10px] text-slate-400 mt-2">{new Date(n.created_at as string).toLocaleString('pt-BR')}</p>
            </div>
            {!n.read_at && (
              <button onClick={() => markMut.mutate(n.id as string)} className="text-xs text-slate-400 hover:text-slate-600 shrink-0">
                ✓ Lida
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
