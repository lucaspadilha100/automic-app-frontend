import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { scheduleExceptionsApi } from '@/api/scheduleExceptions.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Clock, Plus, Trash2, CalendarX } from 'lucide-react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'

const DAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

export default function SchedulePage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'hours'|'exceptions'>('hours')
  const [exceptionForm, setExceptionForm] = useState({
    exception_type: 'holiday', reason: '',
    start_datetime: '', end_datetime: '', professional_id: '',
  })
  const [showForm, setShowForm] = useState(false)

  const { data: bh, isLoading: bhLoading } = useQuery({
    queryKey: ['schedule','business-hours'],
    queryFn: async () => (await apiClient.get('/schedule/business-hours')).data,
  })

  const { data: exceptions, isLoading: excLoading } = useQuery({
    queryKey: ['schedule','exceptions'],
    queryFn: () => scheduleExceptionsApi.list(),
  })

  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => (await apiClient.get('/professionals')).data,
  })

  const updateBhMut = useMutation({
    mutationFn: (data: Record<string,unknown>) => apiClient.put('/schedule/business-hours', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule','business-hours'] }); toast.success('Horários salvos') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const createExcMut = useMutation({
    mutationFn: (data: Record<string,unknown>) => scheduleExceptionsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule','exceptions'] }); toast.success('Bloqueio criado'); setShowForm(false) },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const deleteExcMut = useMutation({
    mutationFn: (id: string) => scheduleExceptionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedule','exceptions'] }); toast.success('Bloqueio removido') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const handleSaveHours = () => {
    if (!bh) return
    updateBhMut.mutate(bh)
  }

  if (bhLoading || excLoading) return <LoadingState />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Horários" subtitle="Defina quando sua clínica atende" />

      <div className="tabs">
        <button className={`tab ${tab==='hours' ? 'tab-active' : ''}`} onClick={() => setTab('hours')}>
          <Clock className="w-4 h-4 inline mr-1.5" />Horário de funcionamento
        </button>
        <button className={`tab ${tab==='exceptions' ? 'tab-active' : ''}`} onClick={() => setTab('exceptions')}>
          <CalendarX className="w-4 h-4 inline mr-1.5" />Bloqueios e exceções
        </button>
      </div>

      {tab === 'hours' && (
        <div className="card">
          <div className="divide-y divide-slate-100">
            {(bh || []).map((day: Record<string,unknown>, idx: number) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-4">
                <div className="w-24 text-sm font-semibold text-slate-700">{DAYS[day.weekday as number]}</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-primary-400"
                    checked={!day.is_closed}
                    onChange={e => {
                      const updated = [...(bh || [])]
                      updated[idx] = { ...day, is_closed: !e.target.checked }
                      qc.setQueryData(['schedule','business-hours'], updated)
                    }} />
                  <span className="text-xs text-slate-500">{day.is_closed ? 'Fechado' : 'Aberto'}</span>
                </label>
                {!day.is_closed && (
                  <>
                    <input type="time" className="input w-32 text-sm" value={day.open_time as string || ''}
                      onChange={e => {
                        const updated = [...(bh || [])]
                        updated[idx] = { ...day, open_time: e.target.value }
                        qc.setQueryData(['schedule','business-hours'], updated)
                      }} />
                    <span className="text-slate-400 text-sm">até</span>
                    <input type="time" className="input w-32 text-sm" value={day.close_time as string || ''}
                      onChange={e => {
                        const updated = [...(bh || [])]
                        updated[idx] = { ...day, close_time: e.target.value }
                        qc.setQueryData(['schedule','business-hours'], updated)
                      }} />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100">
            <button className="btn-primary" onClick={handleSaveHours} disabled={updateBhMut.isPending}>
              {updateBhMut.isPending ? 'Salvando...' : 'Salvar horários'}
            </button>
          </div>
        </div>
      )}

      {tab === 'exceptions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Adicionar bloqueio
            </button>
          </div>

          {!exceptions?.length ? (
            <EmptyState icon={CalendarX} title="Nenhum bloqueio cadastrado" description="Adicione feriados, folgas ou fechamentos" />
          ) : (
            <div className="space-y-2">
              {exceptions.map((exc: Record<string,unknown>) => (
                <div key={exc.id as string} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={exc.exception_type as string} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{exc.reason as string || exc.exception_type as string}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(exc.start_datetime as string).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} →{' '}
                        {new Date(exc.end_datetime as string).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteExcMut.mutate(exc.id as string)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="modal-overlay" onClick={() => setShowForm(false)}>
              <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="font-bold text-slate-900">Novo bloqueio</h3>
                  <button onClick={() => setShowForm(false)}>✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="label">Tipo</label>
                    <select className="select" value={exceptionForm.exception_type}
                      onChange={e => setExceptionForm(f => ({ ...f, exception_type: e.target.value, professional_id: '' }))}>
                      <option value="holiday">🎉 Feriado (toda a clínica)</option>
                      <option value="leave">🏖️ Folga (profissional específico)</option>
                      <option value="closure">🔒 Fechamento (unidade)</option>
                    </select>
                  </div>
                  {exceptionForm.exception_type === 'leave' && (
                    <div>
                      <label className="label">Profissional</label>
                      <select className="select" value={exceptionForm.professional_id}
                        onChange={e => setExceptionForm(f => ({ ...f, professional_id: e.target.value }))}>
                        <option value="">Selecione...</option>
                        {professionals?.map((p: {id:string;name:string}) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="label">Motivo</label>
                    <input className="input" placeholder="Natal, Férias..." value={exceptionForm.reason}
                      onChange={e => setExceptionForm(f => ({ ...f, reason: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Início</label>
                      <input type="datetime-local" className="input" value={exceptionForm.start_datetime}
                        onChange={e => setExceptionForm(f => ({ ...f, start_datetime: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Fim</label>
                      <input type="datetime-local" className="input" value={exceptionForm.end_datetime}
                        onChange={e => setExceptionForm(f => ({ ...f, end_datetime: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                  <button className="btn-primary"
                    disabled={!exceptionForm.start_datetime || !exceptionForm.end_datetime || createExcMut.isPending}
                    onClick={() => createExcMut.mutate({
                      exception_type: exceptionForm.exception_type,
                      reason: exceptionForm.reason || undefined,
                      start_datetime: new Date(exceptionForm.start_datetime).toISOString(),
                      end_datetime: new Date(exceptionForm.end_datetime).toISOString(),
                      professional_id: exceptionForm.professional_id || undefined,
                    })}>
                    Criar bloqueio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
