import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { publicApi } from '@/api/public.api'
import { customerApiClient, CUSTOMER_TOKEN_KEY } from '@/api/client'
import { customerAuthApi } from '@/api/customerAuth.api'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ChevronRight, ChevronLeft, Clock, Check, Calendar, User, MapPin, Phone, Mail } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

type Step = 'services' | 'datetime' | 'auth' | 'confirm' | 'success'

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useCustomerAuthStore()

  const [step, setStep] = useState<Step>('services')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProfId, setSelectedProfId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [authMode, setAuthMode] = useState<'login'|'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [createdId, setCreatedId] = useState('')

  // Data
  const { data: info, isLoading } = useQuery({ queryKey: ['public', slug], queryFn: () => publicApi.getInfo(slug!), enabled: !!slug })
  const { data: servicesData } = useQuery({ queryKey: ['public', slug, 'services'], queryFn: () => publicApi.getServices(slug!), enabled: !!slug })
  const { data: professionals } = useQuery({ queryKey: ['public', slug, 'professionals'], queryFn: () => publicApi.getProfessionals(slug!), enabled: !!slug })

  const services = servicesData?.services ?? []
  const selectedServices = services.filter((s: {id:string}) => selectedServiceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((acc: number, s: {duration_minutes:number}) => acc + s.duration_minutes, 0)
  const totalPrice = selectedServices.reduce((acc: number, s: {price:number}) => acc + s.price, 0)

  // Available dates (next 30 days)
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), i + 1)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE dd/MM', { locale: ptBR }), dayOfWeek: d.getDay() }
  })

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['public', slug, 'slots', selectedDate, selectedServiceIds.join(','), selectedProfId],
    queryFn: () => publicApi.getAvailability(slug!, {
      service_ids: selectedServiceIds,
      target_date: selectedDate,
      professional_id: selectedProfId || undefined,
    }),
    enabled: !!selectedDate && selectedServiceIds.length > 0,
  })

  const bookMut = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
      const client = token ? customerApiClient : publicApi as unknown as typeof customerApiClient
      const r = await customerApiClient.post(`/public/${slug}/appointments`, {
        professional_id: selectedProfId || (professionals as {id:string}[])?.[0]?.id,
        service_ids: selectedServiceIds,
        start_datetime: selectedSlot,
        customer_notes: notes,
      })
      return r.data
    },
    onSuccess: (d: {id:string}) => { setCreatedId(d.id); setStep('success') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const authMut = useMutation({
    mutationFn: async () => {
      let tokens
      if (authMode === 'login') {
        tokens = await customerAuthApi.login({ email: authForm.email, password: authForm.password })
      } else {
        tokens = await customerAuthApi.register({ name: authForm.name, email: authForm.email || undefined, phone: authForm.phone, password: authForm.password })
      }
      const customer = await customerAuthApi.me()
      return { tokens, customer }
    },
    onSuccess: ({ tokens, customer }: { tokens: {access_token:string}; customer: Parameters<typeof setAuth>[0] }) => {
      setAuth(customer, tokens.access_token)
      setStep('confirm')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const primaryColor = info?.primary_color || '#22d3ee'

  if (isLoading) return <LoadingState />
  if (!info) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500">Empresa não encontrada</p>
    </div>
  )

  // Sticky header for mobile
  const Header = () => (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + '20' }}>
        <span className="font-black text-sm" style={{ color: primaryColor }}>{(info.public_name || info.name || 'A').charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm truncate">{info.public_name || info.name}</p>
        {step !== 'services' && (
          <p className="text-xs text-slate-400">
            {step === 'datetime' && 'Escolha data e horário'}
            {step === 'auth' && 'Entre ou cadastre-se'}
            {step === 'confirm' && 'Confirmar agendamento'}
            {step === 'success' && 'Agendamento confirmado!'}
          </p>
        )}
      </div>
      {/* Progress dots */}
      <div className="flex gap-1.5">
        {['services','datetime','auth','confirm'].map((s, i) => (
          <div key={s} className="w-1.5 h-1.5 rounded-full transition-all" style={{
            backgroundColor: ['services','datetime','auth','confirm'].indexOf(step) >= i ? primaryColor : '#e2e8f0'
          }} />
        ))}
      </div>
    </div>
  )

  // ── Step: Services ────────────────────────────────────────────────────────
  if (step === 'services') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      {/* Hero */}
      <div className="px-4 py-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` }}>
        {info.logo_url && <img src={info.logo_url} alt="" className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover" />}
        <h1 className="text-xl font-black text-slate-900">{info.public_name || info.name}</h1>
        {info.description && <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">{info.description}</p>}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
          {info.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {info.phone}</span>}
          {info.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {info.address}</span>}
        </div>
      </div>

      <div className="flex-1 px-4 pb-28">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 mt-2">Escolha o serviço</h2>
        <div className="space-y-2">
          {services.map((svc: {id:string;name:string;duration_minutes:number;price:number;description?:string;category_name?:string}) => {
            const sel = selectedServiceIds.includes(svc.id)
            return (
              <button key={svc.id}
                onClick={() => setSelectedServiceIds(prev => sel ? prev.filter(id => id !== svc.id) : [...prev, svc.id])}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${sel ? 'border-current bg-white shadow-glow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                style={sel ? { borderColor: primaryColor } : {}}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${sel ? 'border-current' : 'border-slate-300'}`} style={sel ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                  {sel && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{svc.name}</p>
                  {svc.description && <p className="text-xs text-slate-400 truncate">{svc.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {svc.duration_minutes}min</span>
                    <span className="text-xs font-semibold" style={{ color: primaryColor }}>R$ {Number(svc.price).toFixed(2)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      {selectedServiceIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">{selectedServiceIds.length} serviço(s) · {totalDuration}min</p>
            <p className="text-base font-bold text-slate-900">R$ {totalPrice.toFixed(2)}</p>
          </div>
          <button className="btn btn-lg rounded-xl px-8 font-bold" style={{ backgroundColor: primaryColor }}
            onClick={() => setStep('datetime')}>
            Continuar <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )

  // ── Step: Date/Time ───────────────────────────────────────────────────────
  if (step === 'datetime') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <div className="flex-1 px-4 pb-28 pt-4 space-y-5">
        {/* Professional selector */}
        {(professionals as {id:string;name:string;photo_url?:string}[] | undefined)?.length > 1 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Profissional</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setSelectedProfId('')}
                className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${!selectedProfId ? 'border-current text-white' : 'border-slate-200 text-slate-600'}`}
                style={!selectedProfId ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                Qualquer
              </button>
              {(professionals as {id:string;name:string}[]).map(p => (
                <button key={p.id} onClick={() => setSelectedProfId(p.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedProfId === p.id ? 'border-current text-white' : 'border-slate-200 text-slate-600'}`}
                  style={selectedProfId === p.id ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map(({ date, label, dayOfWeek }) => (
              <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot('') }}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-16 ${selectedDate === date ? 'text-white border-current' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                style={selectedDate === date ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                <span className="text-[10px] font-bold uppercase opacity-80">{label.split(' ')[0]}</span>
                <span className="text-lg font-black leading-tight">{label.split(' ')[1].split('/')[0]}</span>
                <span className="text-[10px] opacity-70">{label.split(' ')[1].split('/')[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Slots */}
        {selectedDate && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Horário disponível</p>
            {slotsLoading ? (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="w-20 h-10 skeleton" />)}
              </div>
            ) : !(slots as {available:boolean}[])?.filter(s => s.available).length ? (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum horário disponível nesta data</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(slots as {start_datetime:string;available:boolean}[])?.filter(s => s.available).map(slot => {
                  const time = format(new Date(slot.start_datetime), 'HH:mm')
                  const sel = selectedSlot === slot.start_datetime
                  return (
                    <button key={slot.start_datetime} onClick={() => setSelectedSlot(slot.start_datetime)}
                      className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${sel ? 'text-white border-current' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                      style={sel ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                      {time}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3">
        <button className="btn-secondary flex-shrink-0" onClick={() => setStep('services')}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button className="btn btn-lg flex-1 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: selectedSlot ? primaryColor : '#e2e8f0', color: selectedSlot ? '#0f172a' : '#94a3b8' }}
          disabled={!selectedSlot}
          onClick={() => setStep(isAuthenticated ? 'confirm' : 'auth')}>
          {selectedSlot ? 'Continuar' : 'Selecione um horário'} <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  // ── Step: Auth ────────────────────────────────────────────────────────────
  if (step === 'auth') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <div className="flex-1 px-4 pb-28 pt-6">
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
          {[['login','Entrar'],['register','Cadastrar']].map(([mode, label]) => (
            <button key={mode} onClick={() => setAuthMode(mode as typeof authMode)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${authMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="label">Nome completo</label>
              <input className="input" value={authForm.name} onChange={e => setAuthForm(f => ({...f, name: e.target.value}))} placeholder="Maria Silva" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={authForm.email} onChange={e => setAuthForm(f => ({...f, email: e.target.value}))} placeholder="maria@email.com" />
          </div>
          {authMode === 'register' && (
            <div>
              <label className="label">Telefone (WhatsApp)</label>
              <input type="tel" className="input" value={authForm.phone} onChange={e => setAuthForm(f => ({...f, phone: e.target.value}))} placeholder="11999999999" />
            </div>
          )}
          <div>
            <label className="label">Senha</label>
            <input type="password" className="input" value={authForm.password} onChange={e => setAuthForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" />
          </div>

          <button className="btn btn-lg w-full rounded-xl font-bold mt-2" style={{ backgroundColor: primaryColor }}
            onClick={() => authMut.mutate()} disabled={authMut.isPending || !authForm.email || !authForm.password}>
            {authMut.isPending ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <button className="btn-secondary w-full" onClick={() => setStep('datetime')}>
          <ChevronLeft className="w-5 h-5" /> Voltar
        </button>
      </div>
    </div>
  )

  // ── Step: Confirm ─────────────────────────────────────────────────────────
  if (step === 'confirm') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <div className="flex-1 px-4 pb-28 pt-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Resumo do agendamento</h3>

          <div className="space-y-3">
            {selectedServices.map((svc: {id:string;name:string;duration_minutes:number;price:number}) => (
              <div key={svc.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{svc.name}</p>
                  <p className="text-xs text-slate-400">{svc.duration_minutes}min</p>
                </div>
                <p className="text-sm font-bold text-slate-900">R$ {Number(svc.price).toFixed(2)}</p>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3 flex justify-between">
              <p className="text-sm font-bold text-slate-900">Total</p>
              <p className="text-base font-black" style={{ color: primaryColor }}>R$ {totalPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(selectedSlot), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{format(new Date(selectedSlot), 'HH:mm')} · {totalDuration}min</span>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Observações (opcional)</label>
          <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação para a clínica?" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3">
        <button className="btn-secondary flex-shrink-0" onClick={() => setStep('datetime')}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button className="btn btn-lg flex-1 rounded-xl font-bold" style={{ backgroundColor: primaryColor }}
          onClick={() => bookMut.mutate()} disabled={bookMut.isPending}>
          {bookMut.isPending ? 'Agendando...' : 'Confirmar agendamento'}
        </button>
      </div>
    </div>
  )

  // ── Step: Success ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse-soft" style={{ backgroundColor: primaryColor + '20' }}>
        <Check className="w-10 h-10" style={{ color: primaryColor }} />
      </div>
      <h1 className="text-2xl font-black text-slate-900">Agendado!</h1>
      <p className="text-slate-500 mt-2 max-w-xs">Seu agendamento foi confirmado. Você receberá uma confirmação em breve.</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-6 w-full max-w-sm text-left space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{format(new Date(selectedSlot), "dd/MM/yyyy 'às' HH:mm")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{totalDuration}min · R$ {totalPrice.toFixed(2)}</span>
        </div>
        {selectedServices.map((svc: {id:string;name:string}) => (
          <div key={svc.id} className="flex items-center gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4 text-slate-400" />
            <span>{svc.name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-6 w-full max-w-sm">
        <button className="btn btn-lg w-full rounded-xl font-bold" style={{ backgroundColor: primaryColor }}
          onClick={() => navigate(`/customer/tenants/${slug}/appointments`)}>
          Ver meus agendamentos
        </button>
        <button className="btn-secondary w-full rounded-xl" onClick={() => { setStep('services'); setSelectedServiceIds([]); setSelectedSlot(''); setSelectedDate('') }}>
          Fazer outro agendamento
        </button>
      </div>
    </div>
  )
}
