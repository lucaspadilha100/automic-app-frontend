import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { professionalsApi } from '@/api/professionals.api'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { useForm } from 'react-hook-form'

const DAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const DEFAULT_AVAIL = DAYS.map((_, i) => ({
  weekday: i, start_time: '09:00', end_time: '18:00',
  break_start_time: '', break_end_time: '', is_available: i !== 0,
}))

type ProfForm = { name: string; email: string; phone: string; bio: string }

export default function ProfessionalDetailPage() {
  const { professionalId } = useParams<{ professionalId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isNew = !professionalId || professionalId === 'new'

  const [tab, setTab] = useState<'info'|'services'|'availability'>('info')
  const [availability, setAvailability] = useState(DEFAULT_AVAIL)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfForm>()

  const { data: professional, isLoading } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: () => professionalsApi.get(professionalId!),
    enabled: !isNew,
  })

  const { data: profAvail } = useQuery({
    queryKey: ['professional-availability', professionalId],
    queryFn: () => professionalsApi.getAvailability(professionalId!),
    enabled: !isNew,
  })

  const { data: allServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await apiClient.get('/services')).data,
  })

  const { data: profServices } = useQuery({
    queryKey: ['professional-services', professionalId],
    queryFn: () => professionalsApi.getServices(professionalId!),
    enabled: !isNew,
  })

  useEffect(() => { if (professional) reset({ name: professional.name, email: professional.email || '', phone: professional.phone || '', bio: professional.bio || '' }) }, [professional])
  useEffect(() => { if (profAvail?.length) setAvailability(profAvail) }, [profAvail])
  useEffect(() => { if (profServices?.service_ids) setSelectedServices(profServices.service_ids) }, [profServices])

  const createMut = useMutation({
    mutationFn: (d: ProfForm) => professionalsApi.create(d),
    onSuccess: (p: {id:string}) => { toast.success('Profissional criado'); navigate(`/app/professionals/${p.id}`) },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const updateMut = useMutation({
    mutationFn: (d: ProfForm) => professionalsApi.update(professionalId!, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professional', professionalId] }); toast.success('Salvo') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const availMut = useMutation({
    mutationFn: (data: typeof availability) => apiClient.put(`/professionals/${professionalId}/availability`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professional-availability', professionalId] }); toast.success('Disponibilidade salva') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const servicesMut = useMutation({
    mutationFn: (ids: string[]) => professionalsApi.setServices(professionalId!, ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professional-services', professionalId] }); toast.success('Serviços atualizados') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const onSubmit = (data: ProfForm) => isNew ? createMut.mutate(data) : updateMut.mutate(data)

  if (!isNew && isLoading) return <LoadingState />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={isNew ? 'Novo profissional' : professional?.name || 'Profissional'}
        back={() => navigate('/app/professionals')}
      />

      {!isNew && (
        <div className="tabs">
          {[['info','Informações'],['services','Serviços'],['availability','Disponibilidade']].map(([k,l]) => (
            <button key={k} className={`tab ${tab===k?'tab-active':''}`} onClick={() => setTab(k as typeof tab)}>{l}</button>
          ))}
        </div>
      )}

      {(tab === 'info' || isNew) && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" {...register('name', { required: true })} placeholder="Dra. Ana" />
              {errors.name && <p className="field-error">Nome obrigatório</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} placeholder="ana@clinica.com" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" {...register('phone')} placeholder="11999999999" />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} {...register('bio')} placeholder="Especialidades, formação..." />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={createMut.isPending || updateMut.isPending}>
              {isNew ? 'Criar profissional' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      )}

      {tab === 'services' && !isNew && (
        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Serviços que realiza</h3>
          <div className="space-y-2">
            {(allServices || []).map((sv: {id:string;name:string;duration_minutes:number}) => (
              <label key={sv.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input type="checkbox" className="w-4 h-4 accent-primary-400"
                  checked={selectedServices.includes(sv.id)}
                  onChange={e => setSelectedServices(prev => e.target.checked ? [...prev, sv.id] : prev.filter(id => id !== sv.id))} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{sv.name}</p>
                  <p className="text-xs text-slate-400">{sv.duration_minutes} min</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary" onClick={() => servicesMut.mutate(selectedServices)} disabled={servicesMut.isPending}>
              Salvar serviços
            </button>
          </div>
        </div>
      )}

      {tab === 'availability' && !isNew && (
        <div className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Horários de trabalho por dia</h3>
          <div className="space-y-3">
            {availability.map((day, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 min-w-32">
                  <input type="checkbox" className="w-4 h-4 accent-primary-400"
                    checked={day.is_available}
                    onChange={e => setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, is_available: e.target.checked } : d))} />
                  <span className="text-sm font-semibold text-slate-700">{DAYS[day.weekday]}</span>
                </div>
                {day.is_available && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="time" className="input w-32" value={day.start_time || '09:00'}
                      onChange={e => setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, start_time: e.target.value } : d))} />
                    <span className="text-slate-400 text-sm">até</span>
                    <input type="time" className="input w-32" value={day.end_time || '18:00'}
                      onChange={e => setAvailability(prev => prev.map((d, i) => i === idx ? { ...d, end_time: e.target.value } : d))} />
                  </div>
                )}
                {!day.is_available && <span className="text-xs text-slate-400">Não atende</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button className="btn-primary" onClick={() => availMut.mutate(availability)} disabled={availMut.isPending}>
              Salvar disponibilidade
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
