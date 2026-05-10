import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '@/api/appointments.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Calendar, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const STATUS_OPTS = ['', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled']
const STATUS_LABELS: Record<string, string> = {
  '': 'Todos',
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
  rescheduled: 'Reagendado',
}

export default function AppointmentsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', status],
    queryFn: () => appointmentsApi.list({ status: status || undefined, limit: 100 }),
  })

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => appointmentsApi.cancel(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Agendamento cancelado'); setCancelId(null) },
    onError: (e) => toast.error(extractApiError(e)),
  })

  useEffect(() => { setPage(0) }, [search, status])

  const appts = (data || []).filter((a: Record<string,unknown>) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      String(a.customer_name || '').toLowerCase().includes(term) ||
      (a.appointment_services as {service_name_snapshot:string}[])?.[0]?.service_name_snapshot?.toLowerCase().includes(term)
    )
  })

  const pagedAppts = appts.slice(page * 20, (page + 1) * 20)

  if (isLoading) return <div><PageHeader title="Agendamentos" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Agendamentos"
        subtitle={`${appts.length} resultados`}
        actions={<Link to="/app/appointments/new" className="btn-primary"><Plus className="w-4 h-4" /> Novo agendamento</Link>}
      />

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {STATUS_OPTS.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${status === s ? 'bg-primary-400 text-slate-900 border-primary-400' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        {!appts.length ? <EmptyState icon={Calendar} title="Nenhum agendamento" description="Crie um novo ou ajuste os filtros" action={<Link to="/app/appointments/new" className="btn-primary">Novo agendamento</Link>} /> : (
          <table className="table">
            <thead className="thead"><tr>
              <th className="th">Data/Hora</th>
              <th className="th">Cliente</th>
              <th className="th hidden sm:table-cell">Serviço</th>
              <th className="th hidden sm:table-cell">Profissional</th>
              <th className="th">Status</th>
              <th className="th">Ações</th>
            </tr></thead>
            <tbody>
              {pagedAppts.map((a: Record<string,unknown>) => (
                <tr key={a.id as string} className="tr">
                  <td className="td">
                    <p className="font-semibold text-slate-800">{format(new Date(a.start_datetime as string), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    <p className="text-xs text-slate-400">{format(new Date(a.start_datetime as string), 'HH:mm')} – {format(new Date(a.end_datetime as string), 'HH:mm')}</p>
                  </td>
                  <td className="td font-medium">{(a.customer_account as {name:string})?.name || '—'}</td>
                  <td className="td text-sm text-slate-500 hidden sm:table-cell">{(a.appointment_services as {service_name_snapshot:string}[])?.[0]?.service_name_snapshot || '—'}</td>
                  <td className="td text-sm text-slate-500 hidden sm:table-cell">{(a.professional as {name:string})?.name || '—'}</td>
                  <td className="td"><StatusBadge status={a.status as string} /></td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <Link to={`/app/appointments/${a.id}`} className="text-xs text-primary-600 hover:underline font-medium">Detalhes</Link>
                      {['scheduled','confirmed'].includes(a.status as string) && (
                        <button className="text-xs text-red-500 hover:underline" onClick={() => { setCancelId(a.id as string); setCancelReason('') }}>Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {appts.length > 20 && (
        <div className="flex items-center justify-between pt-4">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm">← Anterior</button>
          <span className="text-xs text-slate-400">Página {page + 1} de {Math.ceil(appts.length / 20)}</span>
          <button disabled={(page + 1) * 20 >= appts.length} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm">Próxima →</button>
        </div>
      )}

      {/* Cancel modal */}
      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-slate-900">Cancelar agendamento</h3>
              <button onClick={() => setCancelId(null)}>✕</button>
            </div>
            <div className="p-6">
              <label className="label">Motivo do cancelamento</label>
              <textarea className="input" rows={3} placeholder="Cliente pediu cancelamento..."
                value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setCancelId(null)}>Voltar</button>
              <button className="btn-danger" disabled={!cancelReason || cancelMut.isPending}
                onClick={() => cancelMut.mutate({ id: cancelId, reason: cancelReason })}>
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
