import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { customerPortalApi } from '@/api/customerPortal.api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Calendar, ChevronLeft, XCircle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function CustomerAppointmentsPage() {
  const { slug } = useParams<{ slug: string }>()
  const qc = useQueryClient()
  const [cancelId, setCancelId] = useState<string|null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleId, setRescheduleId] = useState<string|null>(null)
  const [newDateTime, setNewDateTime] = useState('')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['customer-appointments', slug],
    queryFn: () => customerPortalApi.getAppointments(slug!),
  })

  const cancelMut = useMutation({
    mutationFn: () => customerPortalApi.cancelAppointment(slug!, cancelId!, cancelReason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer-appointments', slug] }); setCancelId(null); toast.success('Agendamento cancelado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const rescheduleMut = useMutation({
    mutationFn: () => customerPortalApi.rescheduleAppointment(slug!, rescheduleId!, { new_start_datetime: new Date(newDateTime).toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer-appointments', slug] }); setRescheduleId(null); toast.success('Agendamento remarcado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const upcoming = (appointments || []).filter((a: {status:string}) => ['scheduled','confirmed','in_progress'].includes(a.status))
  const past = (appointments || []).filter((a: {status:string}) => ['completed','cancelled','no_show','rescheduled'].includes(a.status))

  if (isLoading) return <LoadingState />

  const AppCard = ({ appt }: { appt: Record<string,unknown> }) => {
    const canCancel = ['scheduled','confirmed'].includes(appt.status as string)
    const canReschedule = ['scheduled','confirmed'].includes(appt.status as string)

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-bold text-slate-900">
              {(appt.appointment_services as {service_name_snapshot:string}[])?.[0]?.service_name_snapshot || 'Agendamento'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {format(new Date(appt.start_datetime as string), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <StatusBadge status={appt.status as string} />
        </div>

        {(appt.professional as {name:string})?.name && (
          <p className="text-xs text-slate-500 mb-3">👤 {(appt.professional as {name:string}).name}</p>
        )}

        {(canCancel || canReschedule) && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            {canReschedule && (
              <button className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                onClick={() => setRescheduleId(appt.id as string)}>
                <RefreshCw className="w-3.5 h-3.5" /> Remarcar
              </button>
            )}
            {canCancel && (
              <button className="flex-1 py-2 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
                onClick={() => { setCancelId(appt.id as string); setCancelReason('') }}>
                <XCircle className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link to={`/${slug}`} className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-slate-900">Meus agendamentos</h1>
        <Link to={`/${slug}`} className="ml-auto text-xs font-semibold text-primary-600">+ Novo</Link>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {!appointments?.length ? (
          <EmptyState icon={Calendar} title="Nenhum agendamento" description="Você ainda não tem agendamentos" action={<Link to={`/${slug}`} className="btn-primary">Agendar agora</Link>} />
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Próximos</p>
                <div className="space-y-3">
                  {upcoming.map((a: Record<string,unknown>) => <AppCard key={a.id as string} appt={a} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Histórico</p>
                <div className="space-y-3 opacity-70">
                  {past.slice(0, 10).map((a: Record<string,unknown>) => <AppCard key={a.id as string} appt={a} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel modal */}
      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal-box max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Cancelar agendamento</h3><button onClick={() => setCancelId(null)}>✕</button></div>
            <div className="p-5">
              <label className="label">Motivo (opcional)</label>
              <textarea className="input" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Não poderei comparecer..." />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setCancelId(null)}>Voltar</button>
              <button className="btn-danger" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleId && (
        <div className="modal-overlay" onClick={() => setRescheduleId(null)}>
          <div className="modal-box max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Remarcar</h3><button onClick={() => setRescheduleId(null)}>✕</button></div>
            <div className="p-5">
              <label className="label">Nova data e hora</label>
              <input type="datetime-local" className="input" value={newDateTime} onChange={e => setNewDateTime(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setRescheduleId(null)}>Cancelar</button>
              <button className="btn-primary" onClick={() => rescheduleMut.mutate()} disabled={!newDateTime || rescheduleMut.isPending}>Remarcar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
