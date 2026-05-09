import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { publicApi } from '@/api/public.api'
import { customerAuthApi } from '@/api/customerAuth.api'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import { LoadingState } from '@/components/feedback/LoadingState'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import {
  X, ChevronRight, ChevronLeft, Check, Clock, MapPin, Phone,
  AtSign, Star, Calendar, ChevronDown, Plus, Minus,
} from 'lucide-react'

type Step = 'services' | 'datetime' | 'auth' | 'confirm' | 'success'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function PremiumBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useCustomerAuthStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [step, setStep] = useState<Step>('services')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProfId, setSelectedProfId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [heroVisible, setHeroVisible] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)

  const { data: info, isLoading } = useQuery({
    queryKey: ['public', slug],
    queryFn: () => publicApi.getInfo(slug!),
    enabled: !!slug,
  })
  const { data: servicesData } = useQuery({
    queryKey: ['public', slug, 'services'],
    queryFn: () => publicApi.getServices(slug!),
    enabled: !!slug,
  })
  const { data: professionals } = useQuery({
    queryKey: ['public', slug, 'professionals'],
    queryFn: () => publicApi.getProfessionals(slug!),
    enabled: !!slug,
  })
  const { data: photos = [] } = useQuery<Array<{ id: string; photo_type: string; caption: string | null; file_url: string | null; created_at: string }>>({
    queryKey: ['public', slug, 'photos'],
    queryFn: async () => {
      const { publicApiClient } = await import('@/api/client')
      const r = await publicApiClient.get(`/public/${slug}/photos`)
      return r.data
    },
    enabled: !!slug,
  })
  const { data: reviews = [] } = useQuery<Array<{ id: string; rating: number; comment: string | null; reviewer_name: string | null; created_at: string }>>({
    queryKey: ['public', slug, 'reviews'],
    queryFn: async () => {
      const { publicApiClient } = await import('@/api/client')
      const r = await publicApiClient.get(`/public/${slug}/reviews`)
      return r.data
    },
    enabled: !!slug,
  })

  const services = (servicesData?.services ?? []) as Array<{ id: string; name: string; description?: string; duration_minutes: number; price: number; category_id?: string }>
  const profsArr = (professionals ?? []) as Array<{ id: string; name: string; bio?: string; photo_url?: string }>
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((a, s) => a + (s.duration_minutes || 0), 0)
  const totalPrice = selectedServices.reduce((a, s) => a + (s.price || 0), 0)

  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), i + 1)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE dd/MM', { locale: ptBR }), day: format(d, 'dd'), month: format(d, 'MMM', { locale: ptBR }), weekday: format(d, 'EEE', { locale: ptBR }) }
  })

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['public', slug, 'slots', selectedDate, selectedServiceIds.join(','), selectedProfId],
    queryFn: () => publicApi.getAvailability(slug!, { service_ids: selectedServiceIds, target_date: selectedDate, professional_id: selectedProfId || undefined }),
    enabled: !!selectedDate && selectedServiceIds.length > 0,
  })

  const bookMut = useMutation({
    mutationFn: () => publicApi.createAppointment(slug!, {
      professional_id: selectedProfId || profsArr?.[0]?.id,
      service_ids: selectedServiceIds,
      start_datetime: selectedSlot,
      customer_notes: notes,
    }),
    onSuccess: () => setStep('success'),
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
    onSuccess: ({ tokens, customer }: { tokens: { access_token: string }; customer: Parameters<typeof setAuth>[0] }) => {
      setAuth(customer, tokens.access_token)
      setStep('confirm')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.1 })
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  const primary = info?.theme?.primary_color || '#c9a96e'
  const tenantName = info?.tenant?.name || ''
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

  function openDrawer(svcId?: string) {
    if (svcId) setSelectedServiceIds([svcId])
    setStep('services')
    setDrawerOpen(true)
  }

  function toggleService(id: string) {
    setSelectedServiceIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  if (isLoading) return <LoadingState />
  if (!info) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-zinc-500">Empresa não encontrada</p>
    </div>
  )

  // ── DRAWER ──────────────────────────────────────────────────────────────────
  const Drawer = () => (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-500 ease-out max-h-[92vh] overflow-hidden flex flex-col ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 shrink-0">
          <div>
            {step !== 'services' && step !== 'success' && (
              <button onClick={() => setStep(step === 'datetime' ? 'services' : step === 'auth' ? 'datetime' : step === 'confirm' ? (isAuthenticated ? 'datetime' : 'auth') : 'services')}
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-1">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}
            <h2 className="text-lg font-bold text-zinc-900">
              {step === 'services' && 'Escolha os serviços'}
              {step === 'datetime' && 'Data & horário'}
              {step === 'auth' && 'Identificação'}
              {step === 'confirm' && 'Confirmar agendamento'}
              {step === 'success' && 'Agendado!'}
            </h2>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200">
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        {/* Steps dots */}
        {step !== 'success' && (
          <div className="flex gap-1.5 px-6 pb-4 shrink-0">
            {(['services', 'datetime', 'auth', 'confirm'] as Step[]).map((s, i) => (
              <div key={s} className="h-1 flex-1 rounded-full transition-all"
                style={{ backgroundColor: ['services', 'datetime', 'auth', 'confirm'].indexOf(step) >= i ? primary : '#e4e4e7' }} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 pb-6">

          {/* STEP: Services */}
          {step === 'services' && (
            <div className="space-y-2">
              {services.map(svc => {
                const sel = selectedServiceIds.includes(svc.id)
                return (
                  <button key={svc.id} onClick={() => toggleService(svc.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${sel ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${sel ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'}`}>
                      {sel && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 text-sm">{svc.name}</p>
                      {svc.description && <p className="text-xs text-zinc-400 truncate mt-0.5">{svc.description}</p>}
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration_minutes}min</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900 shrink-0">R$ {Number(svc.price).toFixed(2)}</p>
                  </button>
                )
              })}
            </div>
          )}

          {/* STEP: Date/Time */}
          {step === 'datetime' && (
            <div className="space-y-6">
              {profsArr.length > 1 && info.settings?.allow_professional_choice !== false && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Profissional</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {info.settings?.allow_any_professional !== false && (
                      <button onClick={() => setSelectedProfId('')}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${!selectedProfId ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600'}`}>
                        Qualquer
                      </button>
                    )}
                    {profsArr.map(p => (
                      <button key={p.id} onClick={() => setSelectedProfId(p.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedProfId === p.id ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600'}`}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Data</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dates.map(({ date, day, month, weekday }) => (
                    <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot('') }}
                      className={`flex-shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border-2 transition-all ${selectedDate === date ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-100 text-zinc-700 hover:border-zinc-300'}`}>
                      <span className="text-[10px] font-medium uppercase opacity-70">{weekday}</span>
                      <span className="text-xl font-black leading-tight">{day}</span>
                      <span className="text-[10px] opacity-70">{month}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Horário</p>
                  {slotsLoading ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-11 bg-zinc-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : !(slots as { available: boolean }[])?.filter(s => s.available).length ? (
                    <div className="py-8 text-center">
                      <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-400">Nenhum horário disponível</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {(slots as { start_datetime: string; available: boolean }[])?.filter(s => s.available).map(slot => {
                        const time = format(new Date(slot.start_datetime), 'HH:mm')
                        const sel = selectedSlot === slot.start_datetime
                        return (
                          <button key={slot.start_datetime} onClick={() => setSelectedSlot(slot.start_datetime)}
                            className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${sel ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-100 text-zinc-700 hover:border-zinc-300'}`}>
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP: Auth */}
          {step === 'auth' && (
            <div className="space-y-5">
              <div className="flex bg-zinc-100 p-1 rounded-2xl gap-1">
                {[['login', 'Entrar'], ['register', 'Criar conta']].map(([mode, label]) => (
                  <button key={mode} onClick={() => setAuthMode(mode as typeof authMode)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${authMode === mode ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {authMode === 'register' && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Nome</label>
                    <input className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors"
                      value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} placeholder="Maria Silva" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Email</label>
                  <input type="email" className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors"
                    value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} placeholder="maria@email.com" />
                </div>
                {authMode === 'register' && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">WhatsApp</label>
                    <input type="tel" className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors"
                      value={authForm.phone} onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))} placeholder="11999999999" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Senha</label>
                  <input type="password" className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none transition-colors"
                    value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 rounded-2xl p-5 space-y-3">
                {selectedServices.map(svc => (
                  <div key={svc.id} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{svc.name}</p>
                      <p className="text-xs text-zinc-400">{svc.duration_minutes}min</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-900">R$ {Number(svc.price).toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t border-zinc-200 pt-3 flex justify-between">
                  <p className="text-sm font-bold text-zinc-900">Total</p>
                  <p className="text-base font-black" style={{ color: primary }}>R$ {totalPrice.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>{format(new Date(selectedSlot), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{format(new Date(selectedSlot), 'HH:mm')} · {totalDuration}min</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Observações (opcional)</label>
                <textarea className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none resize-none transition-colors"
                  rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação?" />
              </div>
            </div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primary + '20' }}>
                <Check className="w-8 h-8" style={{ color: primary }} />
              </div>
              <h3 className="text-xl font-black text-zinc-900">Agendado com sucesso!</h3>
              <p className="text-sm text-zinc-500 mt-2">Você receberá uma confirmação em breve.</p>
              <div className="mt-6 space-y-2 text-left bg-zinc-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>{format(new Date(selectedSlot), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{totalDuration}min · R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <button className="w-full py-3.5 rounded-2xl text-white text-sm font-bold" style={{ backgroundColor: primary }}
                  onClick={() => navigate(`/customer/tenants/${slug}/appointments`)}>
                  Ver meus agendamentos
                </button>
                <button className="w-full py-3.5 rounded-2xl text-zinc-600 text-sm font-medium bg-zinc-100"
                  onClick={() => { setDrawerOpen(false); setStep('services'); setSelectedServiceIds([]); setSelectedSlot(''); setSelectedDate('') }}>
                  Fazer outro agendamento
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {step !== 'success' && (
          <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
            {step === 'services' && (
              <button disabled={selectedServiceIds.length === 0}
                onClick={() => setStep('datetime')}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                style={{ backgroundColor: primary }}>
                {selectedServiceIds.length === 0 ? 'Selecione um serviço' : `${selectedServiceIds.length} serviço${selectedServiceIds.length > 1 ? 's' : ''} · R$ ${totalPrice.toFixed(2)} · Continuar`}
                {selectedServiceIds.length > 0 && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {step === 'datetime' && (
              <button disabled={!selectedSlot}
                onClick={() => setStep(isAuthenticated ? 'confirm' : 'auth')}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                style={{ backgroundColor: primary }}>
                {!selectedSlot ? 'Selecione um horário' : `Continuar · ${format(new Date(selectedSlot), 'HH:mm')} ${selectedDate}`}
                {selectedSlot && <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {step === 'auth' && (
              <button disabled={authMut.isPending || !authForm.email || !authForm.password}
                onClick={() => authMut.mutate()}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30"
                style={{ backgroundColor: primary }}>
                {authMut.isPending ? 'Aguarde...' : authMode === 'login' ? 'Entrar e continuar' : 'Criar conta e continuar'}
              </button>
            )}
            {step === 'confirm' && (
              <button disabled={bookMut.isPending}
                onClick={() => bookMut.mutate()}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30"
                style={{ backgroundColor: primary }}>
                {bookMut.isPending ? 'Agendando...' : 'Confirmar agendamento'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // ── PAGE ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <Drawer />

      {/* Floating nav (appears on scroll) */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${!heroVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-white/95 backdrop-blur border-b border-zinc-100 px-5 py-3 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {info.theme?.logo_url && <img src={info.theme.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />}
            <p className="font-bold text-zinc-900 text-sm">{tenantName}</p>
          </div>
          <button onClick={() => openDrawer()}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold"
            style={{ backgroundColor: primary }}>
            Agendar
          </button>
        </div>
      </div>

      {/* Hero */}
      <div ref={heroRef} className="relative min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
        {info.theme?.cover_image_url && (
          <div className="absolute inset-0">
            <img src={info.theme.cover_image_url} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,1) 100%)' }} />
          </div>
        )}

        <div className="relative flex-1 flex flex-col justify-end px-6 pb-12 pt-20 max-w-lg mx-auto w-full">
          {info.theme?.logo_url && (
            <img src={info.theme.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover mb-6 border border-white/10" />
          )}

          <div className="mb-2">
            <p className="text-xs font-medium tracking-[0.3em] uppercase mb-3" style={{ color: primary }}>
              {info.tenant?.category || 'Beauty & Wellness'}
            </p>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight">{tenantName}</h1>
          </div>

          {info.tenant?.short_description && (
            <p className="text-zinc-400 text-sm mt-3 leading-relaxed max-w-xs">{info.tenant.short_description}</p>
          )}

          {avgRating && (
            <div className="flex items-center gap-2 mt-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-zinc-500">({reviews.length} avaliações)</span>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {info.tenant?.phone && (
              <a href={`tel:${info.tenant.phone}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors">
                <Phone className="w-3.5 h-3.5" />{info.tenant.phone}
              </a>
            )}
            {info.tenant?.address && (
              <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                <MapPin className="w-3.5 h-3.5" />{info.tenant.address}
              </span>
            )}
            {info.tenant?.instagram && (
              <a href={`https://instagram.com/${info.tenant.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors">
                <AtSign className="w-3.5 h-3.5" />{info.tenant.instagram}
              </a>
            )}
          </div>

          <button onClick={() => openDrawer()}
            className="mt-8 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: primary }}>
            Agendar agora <ChevronRight className="w-4 h-4" />
          </button>

          {/* Business hours preview */}
          {info.business_hours?.filter((b: { is_closed: boolean }) => !b.is_closed).length > 0 && (
            <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-1">
              {info.business_hours.filter((b: { is_closed: boolean }) => !b.is_closed).slice(0, 5).map((bh: { weekday: number; open_time?: string; close_time?: string; is_closed: boolean }) => (
                <div key={bh.weekday} className="flex-shrink-0 text-center">
                  <p className="text-[10px] font-bold uppercase text-zinc-600">{WEEKDAYS[bh.weekday]}</p>
                  <p className="text-xs text-zinc-300 font-medium">{bh.open_time?.slice(0, 5)}–{bh.close_time?.slice(0, 5)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div className="relative flex justify-center pb-6 animate-bounce">
          <ChevronDown className="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      {/* Services Section */}
      <div className="px-5 py-14 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-1">O que oferecemos</p>
            <h2 className="text-2xl font-black text-zinc-900">Serviços</h2>
          </div>
          {services.length > 4 && (
            <span className="text-xs text-zinc-400">{services.length} serviços</span>
          )}
        </div>

        <div className="space-y-3">
          {services.map((svc, i) => (
            <div key={svc.id} className="group flex items-center gap-4 py-4 border-b border-zinc-100 last:border-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm"
                style={{ backgroundColor: primary + '15', color: primary }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 text-sm">{svc.name}</p>
                {svc.description && <p className="text-xs text-zinc-400 truncate mt-0.5">{svc.description}</p>}
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration_minutes}min</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-black text-zinc-900">R$ {Number(svc.price).toFixed(2)}</p>
                <button onClick={() => openDrawer(svc.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: primary }}>
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Professionals */}
      {profsArr.length > 0 && (
        <div className="px-5 py-10 bg-zinc-50">
          <div className="max-w-lg mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-1">Conheça</p>
            <h2 className="text-2xl font-black text-zinc-900 mb-7">Nossa equipe</h2>
            <div className="grid grid-cols-2 gap-3">
              {profsArr.map(prof => (
                <div key={prof.id} className="bg-white rounded-2xl p-4 border border-zinc-100">
                  <div className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center font-black text-lg overflow-hidden"
                    style={{ backgroundColor: primary + '20', color: primary }}>
                    {prof.photo_url
                      ? <img src={prof.photo_url} alt={prof.name} className="w-full h-full object-cover" />
                      : prof.name.charAt(0)}
                  </div>
                  <p className="font-bold text-zinc-900 text-sm">{prof.name}</p>
                  {prof.bio && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{prof.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio */}
      {photos.length > 0 && (
        <div className="px-5 py-14 max-w-lg mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-1">Nosso trabalho</p>
          <h2 className="text-2xl font-black text-zinc-900 mb-7">Portfólio</h2>
          <div className="columns-2 gap-2 space-y-2">
            {photos.map((photo, i) => (
              photo.file_url ? (
                <button key={photo.id} onClick={() => setLightbox(photo.file_url!)}
                  className={`break-inside-avoid block w-full rounded-2xl overflow-hidden bg-zinc-100 group relative ${i % 3 === 0 ? 'aspect-square' : 'aspect-[4/5]'}`}>
                  <img src={photo.file_url} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white font-medium">{photo.caption}</p>
                    </div>
                  )}
                </button>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="py-14 bg-zinc-950">
          <div className="px-5 max-w-lg mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: primary }}>O que dizem</p>
            <div className="flex items-end justify-between mb-7">
              <h2 className="text-2xl font-black text-white">Avaliações</h2>
              {avgRating && (
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-black text-white">{avgRating.toFixed(1)}</span>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
            <div className="space-y-4">
              {reviews.slice(0, 5).map(review => (
                <div key={review.id} className="bg-zinc-900 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-white text-sm">{review.reviewer_name || 'Cliente'}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-zinc-400 leading-relaxed">"{review.comment}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Business Hours */}
      {info.business_hours?.length > 0 && (
        <div className="px-5 py-14 max-w-lg mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mb-1">Funcionamento</p>
          <h2 className="text-2xl font-black text-zinc-900 mb-6">Horários</h2>
          <div className="divide-y divide-zinc-100">
            {info.business_hours.map((bh: { weekday: number; open_time?: string; close_time?: string; is_closed: boolean }) => (
              <div key={bh.weekday} className="flex items-center justify-between py-3.5">
                <p className="text-sm font-medium text-zinc-900">{WEEKDAYS[bh.weekday]}</p>
                {bh.is_closed
                  ? <p className="text-xs text-zinc-400">Fechado</p>
                  : <p className="text-sm font-semibold text-zinc-900">{bh.open_time?.slice(0, 5)} – {bh.close_time?.slice(0, 5)}</p>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky book button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-zinc-100 p-4 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {selectedServiceIds.length > 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500">{selectedServiceIds.length} serviço{selectedServiceIds.length > 1 ? 's' : ''} selecionado{selectedServiceIds.length > 1 ? 's' : ''}</p>
              <p className="text-sm font-bold text-zinc-900">R$ {totalPrice.toFixed(2)} · {totalDuration}min</p>
            </div>
          )}
          <button onClick={() => openDrawer()} style={{ backgroundColor: primary }}
            className={`py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] ${selectedServiceIds.length > 0 ? 'flex-shrink-0 px-6' : 'w-full'}`}>
            {selectedServiceIds.length > 0 ? 'Continuar' : 'Agendar agora'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom padding for sticky button */}
      <div className="h-24" />

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={lightbox} className="max-w-full max-h-full rounded-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
