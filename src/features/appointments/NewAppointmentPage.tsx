import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { appointmentsApi } from '@/api/appointments.api'
import { apiClient } from '@/api/client'
import { customersApi } from '@/api/customers.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, User, Scissors, Search, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function NewAppointmentPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<'service'|'professional'|'datetime'|'customer'|'confirm'>('service')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProfId, setSelectedProfId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Record<string,unknown> | null>(null)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })
  const [useNewCustomer, setUseNewCustomer] = useState(false)
  const [notes, setNotes] = useState('')

  const { data: services } = useQuery({ queryKey: ['services'], queryFn: async () => (await apiClient.get('/services')).data })
  const { data: professionals } = useQuery({ queryKey: ['professionals'], queryFn: async () => (await apiClient.get('/professionals')).data })
  const { data: customers } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => customersApi.list({ search: customerSearch }),
    enabled: customerSearch.length >= 2,
  })

  const selectedServices = (services || []).filter((s: {id:string}) => selectedServiceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((a: number, s: {duration_minutes:number}) => a + s.duration_minutes, 0)
  const totalPrice = selectedServices.reduce((a: number, s: {price:number}) => a + Number(s.price), 0)

  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), i)
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, "EEE dd/MM", { locale: ptBR }) }
  })

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['admin-slots', selectedDate, selectedServiceIds.join(','), selectedProfId],
    queryFn: () => appointmentsApi.slots({
      date: selectedDate,
      service_ids: selectedServiceIds,
      professional_id: selectedProfId || undefined,
    }),
    enabled: !!selectedDate && selectedServiceIds.length > 0,
  })

  const createMut = useMutation({
    mutationFn: async () => {
      let customerAccountId: string | undefined
      if (useNewCustomer) {
        // Create new customer and get their customer_account_id
        const c = await customersApi.create({ name: newCustomer.name, phone: newCustomer.phone, email: newCustomer.email || undefined }) as Record<string,string>
        customerAccountId = c.customer_account_id
      } else {
        // customer list returns {id: tenant_customer_id, customer_account_id: ...}
        customerAccountId = selectedCustomer?.customer_account_id as string
      }
      // professional_id is required - use first available if none selected
      const profId = selectedProfId || (professionals as {id:string}[])?.[0]?.id
      return appointmentsApi.create({
        customer_account_id: customerAccountId,
        professional_id: profId,
        service_ids: selectedServiceIds,
        start_datetime: selectedSlot,
        internal_notes: notes || undefined,
        source: 'admin_panel',
      })
    },
    onSuccess: (d: {id:string}) => {
      toast.success('Agendamento criado!')
      navigate(`/app/appointments/${d.id}`)
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const canGoNext = {
    service: selectedServiceIds.length > 0,
    professional: true,
    datetime: !!selectedSlot,
    customer: useNewCustomer ? !!(newCustomer.name && newCustomer.phone) : !!selectedCustomer,
  }

  const STEPS = ['service','professional','datetime','customer','confirm']
  const stepIdx = STEPS.indexOf(step)

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader title="Novo agendamento" back={() => navigate('/app/appointments')} />

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['Serviço','Profissional','Horário','Cliente','Confirmar'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < stepIdx ? 'bg-primary-400 text-slate-900' :
              i === stepIdx ? 'bg-primary-400 text-slate-900 ring-4 ring-primary-100' :
              'bg-slate-200 text-slate-500'}`}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === stepIdx ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
            {i < 4 && <div className={`h-px flex-1 hidden sm:block ${i < stepIdx ? 'bg-primary-400' : 'bg-slate-200'}`} style={{width: 20}} />}
          </div>
        ))}
      </div>

      {/* Step: Serviço */}
      {step === 'service' && (
        <div className="card p-6 space-y-3">
          <h3 className="font-bold text-slate-900 mb-4">Selecione o(s) serviço(s)</h3>
          {(services || []).map((svc: {id:string;name:string;duration_minutes:number;price:number;category_name?:string}) => {
            const sel = selectedServiceIds.includes(svc.id)
            return (
              <label key={svc.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${sel ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="checkbox" className="w-4 h-4 accent-primary-400"
                  checked={sel}
                  onChange={e => setSelectedServiceIds(prev => e.target.checked ? [...prev, svc.id] : prev.filter(id => id !== svc.id))} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{svc.name}</p>
                  <p className="text-xs text-slate-400"><Clock className="w-3 h-3 inline mr-1" />{svc.duration_minutes}min</p>
                </div>
                <p className="font-bold text-primary-600">R$ {Number(svc.price).toFixed(2)}</p>
              </label>
            )
          })}
          <div className="flex justify-end pt-2">
            <button className="btn-primary" disabled={!canGoNext.service} onClick={() => setStep('professional')}>
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* Step: Profissional */}
      {step === 'professional' && (
        <div className="card p-6 space-y-3">
          <h3 className="font-bold text-slate-900 mb-4">Escolha o profissional (opcional)</h3>
          <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${!selectedProfId ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="radio" className="w-4 h-4 accent-primary-400" checked={!selectedProfId} onChange={() => setSelectedProfId('')} />
            <p className="font-semibold text-slate-700">Qualquer profissional disponível</p>
          </label>
          {(professionals || []).map((prof: {id:string;name:string;bio?:string}) => (
            <label key={prof.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedProfId === prof.id ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="radio" className="w-4 h-4 accent-primary-400" checked={selectedProfId === prof.id} onChange={() => setSelectedProfId(prof.id)} />
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-bold text-sm">{prof.name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{prof.name}</p>
                {prof.bio && <p className="text-xs text-slate-400 truncate max-w-xs">{prof.bio}</p>}
              </div>
            </label>
          ))}
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep('service')}>← Voltar</button>
            <button className="btn-primary" onClick={() => setStep('datetime')}>Próximo →</button>
          </div>
        </div>
      )}

      {/* Step: Data/Hora */}
      {step === 'datetime' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-slate-900">Data e horário</h3>
          <div>
            <p className="label">Data</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map(({ value, label }) => (
                <button key={value} onClick={() => { setSelectedDate(value); setSelectedSlot('') }}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                    selectedDate === value ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}>{label}
                </button>
              ))}
            </div>
          </div>
          {selectedDate && (
            <div>
              <p className="label">Horário disponível</p>
              {slotsLoading ? (
                <div className="grid grid-cols-4 gap-2">{Array.from({length:8}).map((_,i) => <div key={i} className="h-10 skeleton" />)}</div>
              ) : !(slots as {available:boolean;start_datetime:string}[])?.filter(s => s.available).length ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nenhum horário disponível nesta data</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {(slots as {start_datetime:string;available:boolean}[])?.filter(s => s.available).map(slot => {
                    const time = format(new Date(slot.start_datetime), 'HH:mm')
                    const sel = selectedSlot === slot.start_datetime
                    return (
                      <button key={slot.start_datetime} onClick={() => setSelectedSlot(slot.start_datetime)}
                        className={`py-2.5 rounded-lg border-2 text-sm font-bold transition-all ${sel ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                        {time}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep('professional')}>← Voltar</button>
            <button className="btn-primary" disabled={!canGoNext.datetime} onClick={() => setStep('customer')}>Próximo →</button>
          </div>
        </div>
      )}

      {/* Step: Cliente */}
      {step === 'customer' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-slate-900">Selecione o cliente</h3>

          <div className="flex gap-2">
            <button className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${!useNewCustomer ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}
              onClick={() => setUseNewCustomer(false)}>Buscar existente</button>
            <button className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${useNewCustomer ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600'}`}
              onClick={() => setUseNewCustomer(true)}>+ Novo cliente</button>
          </div>

          {!useNewCustomer ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input className="input pl-9" placeholder="Nome, telefone ou email..." value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)} />
              </div>
              {selectedCustomer && (
                <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <User className="w-4 h-4 text-primary-600" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{selectedCustomer.name as string}</p>
                    <p className="text-xs text-slate-500">{selectedCustomer.phone as string}</p>
                  </div>
                  <button className="ml-auto text-xs text-slate-400 hover:text-red-500" onClick={() => setSelectedCustomer(null)}>✕</button>
                </div>
              )}
              {customerSearch.length >= 2 && (customers || []).map((c: Record<string,unknown>) => (
                <button key={c.id as string} onClick={() => { setSelectedCustomer(c); setCustomerSearch('') }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-500">{(c.name as string).charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{c.name as string}</p>
                    <p className="text-xs text-slate-400">{c.phone as string}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Nome *</label>
                <input className="input" value={newCustomer.name} onChange={e => setNewCustomer(p => ({...p, name: e.target.value}))} placeholder="Nome completo" />
              </div>
              <div>
                <label className="label">Telefone/WhatsApp *</label>
                <input className="input" type="tel" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({...p, phone: e.target.value}))} placeholder="11999999999" />
              </div>
              <div>
                <label className="label">E-mail (opcional)</label>
                <input className="input" type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({...p, email: e.target.value}))} placeholder="cliente@email.com" />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep('datetime')}>← Voltar</button>
            <button className="btn-primary" disabled={!canGoNext.customer} onClick={() => setStep('confirm')}>Próximo →</button>
          </div>
        </div>
      )}

      {/* Step: Confirmar */}
      {step === 'confirm' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-slate-900">Confirmar agendamento</h3>

          <div className="space-y-3 divide-y divide-slate-100">
            <div className="flex items-start gap-3 pb-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</p>
                <p className="font-semibold text-slate-900">
                  {useNewCustomer ? newCustomer.name : selectedCustomer?.name as string}
                </p>
                <p className="text-xs text-slate-400">
                  {useNewCustomer ? newCustomer.phone : selectedCustomer?.phone as string}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <Scissors className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Serviços</p>
                {selectedServices.map((s: {id:string;name:string;price:number}) => (
                  <p key={s.id} className="text-sm text-slate-800">{s.name} — <span className="text-primary-600 font-semibold">R$ {Number(s.price).toFixed(2)}</span></p>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-3 py-3">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data e hora</p>
                <p className="font-semibold text-slate-900">{format(new Date(selectedSlot), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                <p className="text-xs text-slate-400">{totalDuration}min · R$ {totalPrice.toFixed(2)}</p>
              </div>
            </div>
            {selectedProfId && (
              <div className="flex items-start gap-3 pt-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Profissional</p>
                  <p className="font-semibold text-slate-900">{(professionals || []).find((p: {id:string}) => p.id === selectedProfId)?.name}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label">Observações internas (opcional)</label>
            <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas para o profissional..." />
          </div>

          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep('customer')}>← Voltar</button>
            <button className="btn-primary" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? 'Criando...' : '✓ Confirmar agendamento'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
