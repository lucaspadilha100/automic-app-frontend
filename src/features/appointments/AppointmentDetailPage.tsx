import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { appointmentsApi } from '@/api/appointments.api'
import { paymentsApi } from '@/api/payments.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, Play, Flag, XCircle, Clock, CreditCard, RefreshCw, User } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

type Action = 'confirm' | 'start' | 'complete' | 'cancel' | 'no-show' | 'reschedule' | null

export default function AppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [action, setAction] = useState<Action>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [completeNotes, setCompleteNotes] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('pix')

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.get(appointmentId!),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['appointment', appointmentId] })
    qc.invalidateQueries({ queryKey: ['appointments'] })
  }

  const mut = (fn: () => Promise<unknown>, successMsg: string) =>
    useMutation({ mutationFn: fn, onSuccess: () => { invalidate(); setAction(null); toast.success(successMsg) }, onError: (e: unknown) => toast.error(extractApiError(e)) })

  const confirmMut = useMutation({ mutationFn: () => appointmentsApi.confirm(appointmentId!), onSuccess: () => { invalidate(); toast.success('Confirmado') }, onError: (e: unknown) => toast.error(extractApiError(e)) })
  const startMut = useMutation({ mutationFn: () => appointmentsApi.start(appointmentId!), onSuccess: () => { invalidate(); toast.success('Iniciado') }, onError: (e: unknown) => toast.error(extractApiError(e)) })
  const completeMut = useMutation({ mutationFn: () => appointmentsApi.complete(appointmentId!, completeNotes), onSuccess: () => { invalidate(); setAction(null); toast.success('Concluído') }, onError: (e: unknown) => toast.error(extractApiError(e)) })
  const cancelMut = useMutation({ mutationFn: () => appointmentsApi.cancel(appointmentId!, cancelReason), onSuccess: () => { invalidate(); setAction(null); toast.success('Cancelado') }, onError: (e: unknown) => toast.error(extractApiError(e)) })
  const noShowMut = useMutation({ mutationFn: () => appointmentsApi.noShow(appointmentId!), onSuccess: () => { invalidate(); toast.success('No-show registrado') }, onError: (e: unknown) => toast.error(extractApiError(e)) })
  const rescheduleMut = useMutation({ mutationFn: () => appointmentsApi.reschedule(appointmentId!, new Date(rescheduleDate).toISOString(), 'Remarcado'), onSuccess: (d: {id:string}) => { invalidate(); setAction(null); toast.success('Remarcado'); navigate(`/app/appointments/${d.id}`) }, onError: (e: unknown) => toast.error(extractApiError(e)) })
  const payMut = useMutation({ mutationFn: () => paymentsApi.register(appointmentId!, { amount: Number(payAmount), payment_method: payMethod }), onSuccess: () => { invalidate(); setShowPayment(false); toast.success('Pagamento registrado') }, onError: (e: unknown) => toast.error(extractApiError(e)) })

  if (isLoading) return <LoadingState />
  if (!appt) return <div className="p-6 text-slate-500">Agendamento não encontrado</div>

  const s = appt.status
  const can = {
    confirm: s === 'scheduled',
    start: s === 'confirmed',
    complete: s === 'in_progress',
    cancel: ['scheduled','confirmed','in_progress'].includes(s),
    noShow: ['scheduled','confirmed'].includes(s),
    reschedule: ['scheduled','confirmed'].includes(s),
    pay: ['scheduled','confirmed','completed'].includes(s),
  }

  const services = appt.appointment_services || []
  const professional = appt.professional

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Agendamento"
        subtitle={appt.customer_name || 'Cliente'}
        back={() => navigate('/app/appointments')}
      />

      {/* Status + main info */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <StatusBadge status={s} />
          <p className="text-xs text-slate-400">{appt.id.slice(0,8)}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={Clock} label="Data/Hora" value={format(new Date(appt.start_datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} />
          <InfoRow icon={User} label="Cliente" value={appt.customer_name || '—'} />
          {professional && <InfoRow icon={User} label="Profissional" value={professional.name} />}
          {services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Serviços</p>
              <div className="flex flex-wrap gap-1">
                {services.map((sv: {service_name_snapshot:string}, i:number) => (
                  <span key={i} className="badge-blue">{sv.service_name_snapshot}</span>
                ))}
              </div>
            </div>
          )}
          {appt.total_price > 0 && (
            <InfoRow icon={CreditCard} label="Total" value={`R$ ${Number(appt.total_price).toFixed(2)}`} />
          )}
        </div>
        {appt.customer_notes && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 mb-1">Observações do cliente</p>
            <p className="text-sm text-amber-800">{appt.customer_notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {can.confirm && (
          <button className="btn-success" onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending}>
            <CheckCircle className="w-4 h-4" /> Confirmar
          </button>
        )}
        {can.start && (
          <button className="btn-primary" onClick={() => startMut.mutate()} disabled={startMut.isPending}>
            <Play className="w-4 h-4" /> Iniciar
          </button>
        )}
        {can.complete && (
          <button className="btn-success" onClick={() => setAction('complete')}>
            <Flag className="w-4 h-4" /> Concluir
          </button>
        )}
        {can.pay && (
          <button className="btn-secondary" onClick={() => setShowPayment(true)}>
            <CreditCard className="w-4 h-4" /> Pagamento
          </button>
        )}
        {can.reschedule && (
          <button className="btn-secondary" onClick={() => setAction('reschedule')}>
            <RefreshCw className="w-4 h-4" /> Remarcar
          </button>
        )}
        {can.noShow && (
          <button className="btn-ghost" onClick={() => noShowMut.mutate()} disabled={noShowMut.isPending}>
            <Clock className="w-4 h-4" /> No-show
          </button>
        )}
        {can.cancel && (
          <button className="btn-danger" onClick={() => { setAction('cancel'); setCancelReason('') }}>
            <XCircle className="w-4 h-4" /> Cancelar
          </button>
        )}
      </div>

      {appt.cancellation_reason && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-red-500 mb-1">Motivo do cancelamento</p>
          <p className="text-sm text-slate-700">{appt.cancellation_reason}</p>
        </div>
      )}

      {/* Complete modal */}
      {action === 'complete' && (
        <div className="modal-overlay" onClick={() => setAction(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Concluir atendimento</h3><button onClick={() => setAction(null)}>✕</button></div>
            <div className="p-5">
              <label className="label">Notas do atendimento (opcional)</label>
              <textarea className="input" rows={3} value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} placeholder="Anotações internas sobre o procedimento..." />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-success" onClick={() => completeMut.mutate()} disabled={completeMut.isPending}>Confirmar conclusão</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {action === 'cancel' && (
        <div className="modal-overlay" onClick={() => setAction(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Cancelar agendamento</h3><button onClick={() => setAction(null)}>✕</button></div>
            <div className="p-5">
              <label className="label">Motivo *</label>
              <textarea className="input" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Motivo do cancelamento..." />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setAction(null)}>Voltar</button>
              <button className="btn-danger" onClick={() => cancelMut.mutate()} disabled={!cancelReason || cancelMut.isPending}>Confirmar cancelamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {action === 'reschedule' && (
        <div className="modal-overlay" onClick={() => setAction(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Remarcar</h3><button onClick={() => setAction(null)}>✕</button></div>
            <div className="p-5">
              <label className="label">Nova data e hora</label>
              <input type="datetime-local" className="input" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setAction(null)}>Cancelar</button>
              <button className="btn-primary" onClick={() => rescheduleMut.mutate()} disabled={!rescheduleDate || rescheduleMut.isPending}>Remarcar</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Registrar pagamento</h3><button onClick={() => setShowPayment(false)}>✕</button></div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Valor (R$)</label>
                <input className="input" type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder={Number(appt.total_price || 0).toFixed(2)} />
              </div>
              <div>
                <label className="label">Método</label>
                <select className="select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão crédito</option>
                  <option value="cartao_debito">Cartão débito</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPayment(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => payMut.mutate()} disabled={!payAmount || payMut.isPending}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{className?:string}>; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}
