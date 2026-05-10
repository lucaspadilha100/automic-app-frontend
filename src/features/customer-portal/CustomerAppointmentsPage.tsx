import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { customerPortalApi } from '@/api/customerPortal.api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Calendar, ChevronLeft, XCircle, RefreshCw, ClipboardList, Image, Star, User, Scissors, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

type Tab = 'upcoming' | 'past' | 'history'
type Appt = Record<string, unknown>

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="p-1 transition-transform active:scale-90">
          <Star className={`w-8 h-8 transition-colors ${i <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
        </button>
      ))}
    </div>
  )
}

function AppCard({
  appt, slug, onCancel, onReschedule,
}: {
  appt: Appt; slug: string;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}) {
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const qc = useQueryClient()

  const canCancel = ['scheduled', 'confirmed'].includes(appt.status as string)
  const canReschedule = ['scheduled', 'confirmed'].includes(appt.status as string)
  const isCompleted = appt.status === 'completed'

  const services = (appt.appointment_services as Array<{ service_name_snapshot: string; price_snapshot?: number }>) || []
  const professionalName = (appt.professional as { name: string } | null)?.name
  const totalPrice = services.reduce((sum, s) => sum + (s.price_snapshot || 0), 0)

  const { data: existingReview } = useQuery({
    queryKey: ['appointment-review', appt.id],
    queryFn: () => customerPortalApi.getAppointmentReview(slug, appt.id as string),
    enabled: isCompleted,
    retry: false,
  })

  const reviewMut = useMutation({
    mutationFn: () => customerPortalApi.submitReview(slug, appt.id as string, { rating, comment: comment || undefined }),
    onSuccess: () => {
      toast.success('Avaliação enviada!')
      qc.invalidateQueries({ queryKey: ['appointment-review', appt.id] })
      setShowReview(false)
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 leading-tight">
              {services.length > 0
                ? services.map(s => s.service_name_snapshot).join(' + ')
                : 'Agendamento'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {format(new Date(appt.start_datetime as string), "EEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <StatusBadge status={appt.status as string} />
        </div>

        {/* Details row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
          {professionalName && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span>{professionalName}</span>
            </div>
          )}
          {totalPrice > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
        </div>

        {/* Existing review badge */}
        {isCompleted && existingReview && (
          <div className="flex items-center gap-1.5 mb-3 bg-yellow-50 rounded-xl px-3 py-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= existingReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <span className="text-xs text-slate-500 ml-1">{existingReview.comment || 'Avaliado'}</span>
          </div>
        )}

        {/* Actions */}
        {(canCancel || canReschedule || (isCompleted && !existingReview)) && (
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            {canReschedule && (
              <button
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                onClick={() => onReschedule(appt.id as string)}>
                <RefreshCw className="w-3.5 h-3.5" /> Remarcar
              </button>
            )}
            {canCancel && (
              <button
                className="flex-1 py-2 px-3 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors"
                onClick={() => onCancel(appt.id as string)}>
                <XCircle className="w-3.5 h-3.5" /> Cancelar
              </button>
            )}
            {isCompleted && !existingReview && (
              <button
                className="flex-1 py-2 px-3 rounded-xl border border-yellow-200 text-xs font-semibold text-yellow-700 hover:bg-yellow-50 flex items-center justify-center gap-1.5 transition-colors"
                onClick={() => setShowReview(true)}>
                <Star className="w-3.5 h-3.5" /> Avaliar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      {showReview && (
        <div className="modal-overlay" onClick={() => setShowReview(false)}>
          <div className="modal-box max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">Avaliar atendimento</h3>
              <button onClick={() => setShowReview(false)}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-500 text-center">
                {services[0]?.service_name_snapshot || 'Agendamento'}<br />
                {professionalName && <span className="text-xs">com {professionalName}</span>}
              </p>
              <StarRatingInput value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-center text-sm font-semibold text-slate-700">
                  {['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente!'][rating]}
                </p>
              )}
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Conte como foi sua experiência... (opcional)"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowReview(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() => reviewMut.mutate()}
                disabled={rating === 0 || reviewMut.isPending}>
                Enviar avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function CustomerAppointmentsPage() {
  const { slug } = useParams<{ slug: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [newDateTime, setNewDateTime] = useState('')

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['customer-appointments', slug],
    queryFn: () => customerPortalApi.getAppointments(slug!),
  })

  const { data: procedureHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['customer-procedure-history', slug],
    queryFn: () => customerPortalApi.getProcedureHistory(slug!),
    enabled: tab === 'history',
  })

  const cancelMut = useMutation({
    mutationFn: () => customerPortalApi.cancelAppointment(slug!, cancelId!, cancelReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-appointments', slug] })
      setCancelId(null)
      toast.success('Agendamento cancelado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const rescheduleMut = useMutation({
    mutationFn: () => customerPortalApi.rescheduleAppointment(slug!, rescheduleId!, { new_start_datetime: new Date(newDateTime).toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-appointments', slug] })
      setRescheduleId(null)
      toast.success('Agendamento remarcado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const upcoming = (appointments || []).filter((a: Appt) => ['scheduled', 'confirmed', 'in_progress'].includes(a.status as string))
  const past = (appointments || []).filter((a: Appt) => ['completed', 'cancelled', 'no_show', 'rescheduled'].includes(a.status as string))

  if (isLoading) return <LoadingState />

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'upcoming', label: 'Próximos', count: upcoming.length },
    { key: 'past', label: 'Anteriores', count: past.length },
    { key: 'history', label: 'Histórico' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link to={`/${slug}`} className="text-slate-400 hover:text-slate-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-slate-900">Meus agendamentos</h1>
        <Link to={`/${slug}`} className="ml-auto text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors">
          + Novo
        </Link>
      </div>

      {/* Tabs */}
      <div className="sticky top-[53px] bg-white border-b border-slate-200 z-10">
        <div className="flex max-w-lg mx-auto">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                tab === key ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {label}
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                  tab === key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-3 pb-24">
        {/* Upcoming */}
        {tab === 'upcoming' && (
          !upcoming.length
            ? <EmptyState icon={Calendar} title="Nenhum agendamento próximo" description="Você não tem agendamentos futuros" action={<Link to={`/${slug}`} className="btn-primary">Agendar agora</Link>} />
            : upcoming.map((a: Appt) => (
              <AppCard key={a.id as string} appt={a} slug={slug!}
                onCancel={id => { setCancelId(id); setCancelReason('') }}
                onReschedule={id => { setRescheduleId(id); setNewDateTime('') }} />
            ))
        )}

        {/* Past */}
        {tab === 'past' && (
          !past.length
            ? <EmptyState icon={Calendar} title="Nenhum agendamento anterior" description="Você ainda não tem atendimentos concluídos" action={<Link to={`/${slug}`} className="btn-primary">Agendar agora</Link>} />
            : past.map((a: Appt) => (
              <AppCard key={a.id as string} appt={a} slug={slug!}
                onCancel={id => { setCancelId(id); setCancelReason('') }}
                onReschedule={id => { setRescheduleId(id); setNewDateTime('') }} />
            ))
        )}

        {/* History */}
        {tab === 'history' && (
          isLoadingHistory ? <LoadingState /> :
          !procedureHistory?.length
            ? <EmptyState icon={ClipboardList} title="Nenhum histórico" description="Ainda não há registros de procedimentos" />
            : (procedureHistory as Record<string, unknown>[]).map((item) => (
              <div key={item.id as string} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-bold text-slate-900">{item.title as string}</p>
                  {item.procedure_date && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(item.procedure_date as string), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
                {item.description && <p className="text-sm text-slate-600 mb-2">{item.description as string}</p>}
                {item.public_notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-2">{item.public_notes as string}</p>
                )}
                {item.recommended_return_date && (
                  <p className="text-xs text-amber-600 font-medium mb-2">
                    Retorno recomendado: {format(new Date(item.recommended_return_date as string), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
                {(item.photos as unknown[])?.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <Image className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-primary-600 font-semibold">Ver fotos ({(item.photos as unknown[]).length})</span>
                  </div>
                )}
              </div>
            ))
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
              <button className="btn-danger" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>Cancelar agendamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleId && (
        <div className="modal-overlay" onClick={() => setRescheduleId(null)}>
          <div className="modal-box max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Remarcar agendamento</h3><button onClick={() => setRescheduleId(null)}>✕</button></div>
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
