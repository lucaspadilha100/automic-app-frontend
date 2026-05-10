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
  AtSign, Star, Calendar, ChevronDown, CalendarDays, LogOut, User,
} from 'lucide-react'
import { ProductOrderModal, type OrderableProduct } from './ProductOrderModal'

type Step = 'services' | 'datetime' | 'auth' | 'confirm' | 'success'
type Product = { id: string; name: string; price: number; description?: string; image_url?: string }
// Backend uses Python weekday: 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type BH = { weekday: number; open_time?: string; close_time?: string; is_closed: boolean }
type Service = { id: string; name: string; description?: string; duration_minutes: number; price: number; category_id?: string }
type Prof = { id: string; name: string; bio?: string; photo_url?: string; service_ids?: string[] }
type Review = { id: string; rating: number; comment: string | null; reviewer_name: string | null; created_at: string }
type Photo = { id: string; photo_type: string; caption: string | null; file_url: string | null; created_at: string }

export default function PremiumBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, setAuth, customer, logout: customerLogout } = useCustomerAuthStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [step, setStep] = useState<Step>('services')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProfId, setSelectedProfId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [heroVisible, setHeroVisible] = useState(true)
  const [profIdx, setProfIdx] = useState(0)
  const [hoursExpanded, setHoursExpanded] = useState(false)
  const [selectedProf, setSelectedProf] = useState<Prof | null>(null)
  const [productOrder, setProductOrder] = useState<OrderableProduct | null>(null)
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
  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ['public', slug, 'photos'],
    queryFn: async () => {
      const { publicApiClient } = await import('@/api/client')
      const r = await publicApiClient.get(`/public/${slug}/photos`)
      return r.data
    },
    enabled: !!slug,
  })
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['public', slug, 'reviews'],
    queryFn: async () => {
      const { publicApiClient } = await import('@/api/client')
      const r = await publicApiClient.get(`/public/${slug}/reviews`)
      return r.data
    },
    enabled: !!slug,
  })
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['public', slug, 'products'],
    queryFn: async () => {
      const { publicApiClient } = await import('@/api/client')
      const r = await publicApiClient.get(`/public/${slug}/products`)
      return r.data
    },
    enabled: !!slug,
  })

  const services = (servicesData?.services ?? []) as Service[]
  const profsArr = (professionals ?? []) as Prof[]
  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((a, s) => a + (s.duration_minutes || 0), 0)
  const totalPrice = selectedServices.reduce((a, s) => a + (s.price || 0), 0)

  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(new Date(), i + 1)
    return {
      date: format(d, 'yyyy-MM-dd'),
      day: format(d, 'dd'),
      month: format(d, 'MMM', { locale: ptBR }),
      weekday: format(d, 'EEE', { locale: ptBR }),
    }
  })

  const { data: slots, isLoading: slotsLoading, isError: slotsError } = useQuery({
    queryKey: ['public', slug, 'slots', selectedDate, selectedServiceIds.join(','), selectedProfId],
    queryFn: () => publicApi.getAvailability(slug!, {
      service_ids: selectedServiceIds,
      target_date: selectedDate,
      professional_id: selectedProfId || undefined,
    }),
    enabled: !!selectedDate && selectedServiceIds.length > 0,
    retry: false,
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

  // Hero visibility observer (for floating nav)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.1 })
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  // Professional carousel auto-advance
  useEffect(() => {
    if (profsArr.length <= 1) return
    const t = setInterval(() => setProfIdx(i => (i + 1) % profsArr.length), 4500)
    return () => clearInterval(t)
  }, [profsArr.length])

  // "Aberto agora" logic — convert JS getDay() (0=Sun) to Python weekday (0=Mon)
  const nowDate = new Date()
  const jsDay = nowDate.getDay()
  const currentDay = jsDay === 0 ? 6 : jsDay - 1
  const currentTimeStr = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`
  const todayBH = info?.business_hours?.find((bh: BH) => bh.weekday === currentDay) as BH | undefined
  const isOpenNow = todayBH && !todayBH.is_closed &&
    currentTimeStr >= (todayBH.open_time?.slice(0, 5) ?? '99:99') &&
    currentTimeStr < (todayBH.close_time?.slice(0, 5) ?? '00:00')

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
  const handleCustomerLogout = () => {
    customerLogout()
  }

  if (isLoading) return <LoadingState />
  if (!info) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-zinc-500">Empresa não encontrada</p>
    </div>
  )

  const hasAbout = info.settings?.homepage_title || info.settings?.homepage_subtitle || info.tenant?.short_description

  // ── PAGE ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── BOOKING MODAL */}
      <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
        <div className={`relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl h-[92vh] sm:h-[680px] overflow-hidden flex flex-col transition-transform duration-500 ease-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-4'}`}>
          <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-zinc-200" />
          </div>
          <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-zinc-50">
            <div>
              {step !== 'services' && step !== 'success' && (
                <button
                  onClick={() => setStep(step === 'datetime' ? 'services' : step === 'auth' ? 'datetime' : step === 'confirm' ? (isAuthenticated ? 'datetime' : 'auth') : 'services')}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 mb-1 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                </button>
              )}
              <h2 className="text-base font-bold text-zinc-900">
                {step === 'services' && 'Escolha os serviços'}
                {step === 'datetime' && 'Data & horário'}
                {step === 'auth' && 'Identificação'}
                {step === 'confirm' && 'Confirmar agendamento'}
                {step === 'success' && 'Agendado!'}
              </h2>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors">
              <X className="w-4 h-4 text-zinc-600" />
            </button>
          </div>

          {step !== 'success' && (
            <div className="flex gap-1.5 px-6 pt-3 pb-1 shrink-0">
              {(['services', 'datetime', 'auth', 'confirm'] as Step[]).map((s, i) => (
                <div key={s} className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ backgroundColor: ['services', 'datetime', 'auth', 'confirm'].indexOf(step) >= i ? primary : '#e4e4e7' }} />
              ))}
            </div>
          )}

          <div className="overflow-y-auto flex-1 px-6 pb-6 pt-4">
            {/* STEP: Services */}
            {step === 'services' && (
              <div className="space-y-2">
                {services.map(svc => {
                  const sel = selectedServiceIds.includes(svc.id)
                  return (
                    <button key={svc.id} onClick={() => toggleService(svc.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${sel ? 'bg-zinc-50' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
                      style={sel ? { borderColor: primary } : {}}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all`}
                        style={sel ? { backgroundColor: primary, borderColor: primary } : { borderColor: '#d4d4d8' }}>
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
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${!selectedProfId ? 'text-white border-transparent' : 'border-zinc-200 text-zinc-600 bg-white'}`}
                          style={!selectedProfId ? { backgroundColor: primary } : {}}>
                          Qualquer
                        </button>
                      )}
                      {profsArr.map(p => (
                        <button key={p.id} onClick={() => setSelectedProfId(p.id)}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedProfId === p.id ? 'text-white border-transparent' : 'border-zinc-200 text-zinc-600 bg-white'}`}
                          style={selectedProfId === p.id ? { backgroundColor: primary } : {}}>
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
                        className={`flex-shrink-0 flex flex-col items-center w-14 py-3 rounded-2xl border-2 transition-all ${selectedDate === date ? 'text-white border-transparent' : 'border-zinc-100 text-zinc-700 hover:border-zinc-300'}`}
                        style={selectedDate === date ? { backgroundColor: primary } : {}}>
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
                    ) : slotsError ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-red-400">Erro ao buscar horários. Verifique o console.</p>
                      </div>
                    ) : !(slots as { start_datetime: string }[])?.length ? (
                      <div className="py-8 text-center">
                        <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        <p className="text-sm text-zinc-400">Nenhum horário disponível nesta data</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {(slots as { start_datetime: string }[])?.map(slot => {
                          const time = format(new Date(slot.start_datetime), 'HH:mm')
                          const sel = selectedSlot === slot.start_datetime
                          return (
                            <button key={slot.start_datetime} onClick={() => setSelectedSlot(slot.start_datetime)}
                              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${sel ? 'text-white border-transparent' : 'border-zinc-100 text-zinc-700 hover:border-zinc-300'}`}
                              style={sel ? { backgroundColor: primary } : {}}>
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

          {step !== 'success' && (
            <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
              {step === 'services' && (
                <button disabled={selectedServiceIds.length === 0} onClick={() => setStep('datetime')}
                  className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  style={{ backgroundColor: primary }}>
                  {selectedServiceIds.length === 0 ? 'Selecione um serviço' : `${selectedServiceIds.length} serviço${selectedServiceIds.length > 1 ? 's' : ''} · R$ ${totalPrice.toFixed(2)} · Continuar`}
                  {selectedServiceIds.length > 0 && <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              {step === 'datetime' && (
                <button disabled={!selectedSlot} onClick={() => setStep(isAuthenticated ? 'confirm' : 'auth')}
                  className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  style={{ backgroundColor: primary }}>
                  {!selectedSlot ? 'Selecione um horário' : `Continuar · ${format(new Date(selectedSlot), 'HH:mm')} ${selectedDate}`}
                  {selectedSlot && <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              {step === 'auth' && (
                <button disabled={authMut.isPending || !authForm.email || !authForm.password} onClick={() => authMut.mutate()}
                  className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30"
                  style={{ backgroundColor: primary }}>
                  {authMut.isPending ? 'Aguarde...' : authMode === 'login' ? 'Entrar e continuar' : 'Criar conta e continuar'}
                </button>
              )}
              {step === 'confirm' && (
                <button disabled={bookMut.isPending} onClick={() => bookMut.mutate()}
                  className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-30"
                  style={{ backgroundColor: primary }}>
                  {bookMut.isPending ? 'Agendando...' : 'Confirmar agendamento'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating nav ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${!heroVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2">
            {/* Logo + nome */}
            <div className="flex items-center gap-2 min-w-0">
              {info.theme?.logo_url && (
                <img src={info.theme.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              )}
              <span className="font-bold text-zinc-900 truncate text-sm sm:text-base">{tenantName}</span>
              {avgRating && (
                <div className="hidden sm:flex items-center gap-1 ml-1 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-zinc-600">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {/* Direita: auth + CTA */}
            <div className="flex items-center gap-2 shrink-0">
              {info.tenant?.phone && (
                <a href={`tel:${info.tenant.phone}`} className="hidden lg:flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                  <Phone className="w-4 h-4" />{info.tenant.phone}
                </a>
              )}
              {isAuthenticated && customer ? (
                <>
                  <button
                    onClick={() => navigate(`/customer/tenants/${slug}/appointments`)}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-full px-3 py-1.5 transition-all">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Meus agendamentos</span>
                    <span className="md:hidden">Agenda</span>
                  </button>
                  <button
                    onClick={() => navigate(`/customer/tenants/${slug}/appointments`)}
                    title="Meus agendamentos"
                    className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors">
                    <CalendarDays className="w-4 h-4 text-zinc-600" />
                  </button>
                  <button
                    onClick={handleCustomerLogout}
                    title="Sair"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors">
                    <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="hidden sm:block text-xs text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1">
                    Admin
                  </button>
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-full px-3 py-1.5 transition-all">
                    <User className="w-3.5 h-3.5" />
                    Entrar
                  </button>
                </>
              )}
              {/* Botão agendar — oculto no mobile pois a barra inferior já faz isso */}
              <button onClick={() => openDrawer()}
                className="hidden sm:flex px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: primary }}>
                Agendar agora
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Auth bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end gap-2 px-3 sm:px-6 pt-3">
          {isAuthenticated && customer ? (
            <>
              <button
                onClick={() => navigate(`/customer/tenants/${slug}/appointments`)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 transition-all">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Meus agendamentos</span>
                <span className="sm:hidden">Agenda</span>
              </button>
              <button
                onClick={handleCustomerLogout}
                title="Sair"
                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all">
                <LogOut className="w-3.5 h-3.5 text-white/70" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-[10px] text-white/50 hover:text-white/80 transition-colors px-2 py-1.5">
                Admin
              </button>
              <button
                onClick={() => setDrawerOpen(true)}
                className="text-xs font-semibold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 transition-all flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Entrar
              </button>
            </>
          )}
        </div>

        {info.theme?.cover_image_url ? (
          <div className="absolute inset-0">
            <img src={info.theme.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,0.8) 100%)' }} />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0a0a0a 0%, ${primary}22 100%)` }} />
        )}

        <div className="relative flex-1 flex items-end pb-12 sm:pb-16 pt-20 sm:pt-24">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              {info.theme?.logo_url && (
                <img src={info.theme.logo_url} alt="" className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover mb-5 sm:mb-8 border border-white/10 shadow-2xl" />
              )}
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase mb-3 sm:mb-4" style={{ color: primary }}>
                {info.tenant?.category || 'Beleza & Bem-estar'}
              </p>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">
                {tenantName}
              </h1>
              {info.tenant?.short_description && (
                <p className="text-zinc-400 mt-4 sm:mt-5 text-sm sm:text-base leading-relaxed max-w-md">
                  {info.tenant.short_description}
                </p>
              )}

              {avgRating && (
                <div className="flex items-center gap-2 mt-4 sm:mt-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-white">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-zinc-500">({reviews.length} avaliações)</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-5">
                {info.tenant?.phone && (
                  <a href={`tel:${info.tenant.phone}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs sm:text-sm transition-colors">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{info.tenant.phone}
                  </a>
                )}
                {info.tenant?.address && (
                  <span className="flex items-center gap-1.5 text-zinc-400 text-xs sm:text-sm">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{info.tenant.address}
                  </span>
                )}
                {info.tenant?.instagram && (
                  <a href={`https://instagram.com/${info.tenant.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs sm:text-sm transition-colors">
                    <AtSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{info.tenant.instagram}
                  </a>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
                <button onClick={() => openDrawer()}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: primary }}>
                  {info.settings?.primary_button_text || 'Agendar agora'} <ChevronRight className="w-4 h-4" />
                </button>
                {services.length > 0 && (
                  <button
                    onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm font-medium text-white/70 border border-white/10 hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2">
                    Ver serviços <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status de funcionamento — visível sem scroll */}
              {info.business_hours?.length > 0 && (
                <div className="mt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${isOpenNow ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-red-500/15 text-red-400 border-red-500/25'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-current ${isOpenNow ? 'animate-pulse' : ''}`} />
                      {isOpenNow ? 'Aberto agora' : 'Fechado agora'}
                    </span>
                    {todayBH && !todayBH.is_closed && (
                      <span className="text-xs text-zinc-400">
                        {isOpenNow
                          ? `Fecha às ${todayBH.close_time?.slice(0, 5)}`
                          : `Hoje: ${todayBH.open_time?.slice(0, 5)} – ${todayBH.close_time?.slice(0, 5)}`}
                      </span>
                    )}
                    <button onClick={() => setHoursExpanded(v => !v)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">
                      {hoursExpanded ? 'Fechar' : 'Ver todos os horários'}
                    </button>
                  </div>
                  {hoursExpanded && (
                    <div className="mt-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4 grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                      {(info.business_hours as BH[]).map((bh: BH) => (
                        <div key={bh.weekday} className={`text-center p-2 rounded-xl ${bh.weekday === currentDay ? 'bg-white/10' : ''}`}>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">{WEEKDAYS[bh.weekday]}</p>
                          {bh.is_closed
                            ? <p className="text-[10px] text-zinc-600">Fechado</p>
                            : <p className="text-[10px] text-zinc-300 font-medium leading-tight">{bh.open_time?.slice(0, 5)}<br />{bh.close_time?.slice(0, 5)}</p>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex justify-center pb-6 animate-bounce">
          <ChevronDown className="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      {/* ── About / Quem somos ───────────────────────────────────── */}
      {hasAbout && (
        <div className="bg-zinc-50 py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-4" style={{ color: primary }}>
                Sobre nós
              </p>
              {info.settings?.homepage_title && (
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 leading-tight mb-6">
                  {info.settings.homepage_title}
                </h2>
              )}
              {info.settings?.homepage_subtitle && (
                <p className="text-lg text-zinc-600 leading-relaxed mb-4">
                  {info.settings.homepage_subtitle}
                </p>
              )}
              {info.tenant?.short_description && !info.settings?.homepage_title && (
                <p className="text-lg text-zinc-600 leading-relaxed">
                  {info.tenant.short_description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-8">
                <div className="h-px flex-1 max-w-xs" style={{ backgroundColor: primary + '40' }} />
                <button onClick={() => openDrawer()}
                  className="flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-80"
                  style={{ color: primary }}>
                  Agendar agora <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Team / Professionals ─────────────────────────────────── */}
      {profsArr.length > 0 && (
        <div className="py-20 lg:py-28 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: primary }}>Conheça</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Nossa equipe</h2>
              <p className="text-sm text-zinc-500 mt-2">Toque em um profissional para ver os serviços</p>
            </div>

            {/* Mobile: carousel */}
            <div className="lg:hidden">
              <div className="overflow-hidden rounded-3xl">
                <div className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${profIdx * 100}%)` }}>
                  {profsArr.map(prof => (
                    <div key={prof.id} className="w-full flex-shrink-0">
                      <button className="w-full bg-zinc-900 rounded-3xl overflow-hidden text-left group"
                        onClick={() => setSelectedProf(prof)}>
                        {prof.photo_url ? (
                          <img src={prof.photo_url} alt={prof.name} className="w-full h-72 object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-72 flex items-center justify-center text-5xl font-black"
                            style={{ backgroundColor: primary + '20', color: primary }}>
                            {prof.name.charAt(0)}
                          </div>
                        )}
                        <div className="p-6 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-xl">{prof.name}</h3>
                            {prof.bio && <p className="text-sm text-zinc-400 mt-1 leading-relaxed line-clamp-2">{prof.bio}</p>}
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-600 shrink-0 ml-3" />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-5">
                <button onClick={() => setProfIdx(i => (i - 1 + profsArr.length) % profsArr.length)}
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  {profsArr.map((_, i) => (
                    <button key={i} onClick={() => setProfIdx(i)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{ backgroundColor: i === profIdx ? primary : '#52525b' }} />
                  ))}
                </div>
                <button onClick={() => setProfIdx(i => (i + 1) % profsArr.length)}
                  className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop: grid */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {profsArr.map((prof, i) => (
                <button key={prof.id} onClick={() => setSelectedProf(prof)}
                  className={`bg-zinc-900 rounded-3xl overflow-hidden transition-all duration-500 text-left group ${i === profIdx % profsArr.length ? 'ring-2 scale-[1.02]' : 'opacity-80 hover:opacity-100 hover:scale-[1.01]'}`}
                  style={i === profIdx % profsArr.length ? { ringColor: primary } : {}}
                  onMouseEnter={() => setProfIdx(i)}>
                  {prof.photo_url ? (
                    <img src={prof.photo_url} alt={prof.name} className="w-full h-64 object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-5xl font-black"
                      style={{ backgroundColor: primary + '20', color: primary }}>
                      {prof.name.charAt(0)}
                    </div>
                  )}
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg">{prof.name}</h3>
                      {prof.bio && <p className="text-sm text-zinc-400 mt-1 leading-relaxed line-clamp-2">{prof.bio}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0 ml-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Services ─────────────────────────────────────────────── */}
      {services.length > 0 && (
        <div id="services-section" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 mb-3">O que oferecemos</p>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Nossos serviços</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((svc, i) => (
                <div key={svc.id} className="group flex flex-col bg-white border border-zinc-100 rounded-3xl p-6 hover:shadow-lg hover:border-zinc-200 transition-all duration-300">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0"
                      style={{ backgroundColor: primary + '15', color: primary }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-50 rounded-full px-3 py-1">
                      <Clock className="w-3.5 h-3.5" />
                      {svc.duration_minutes}min
                    </div>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg leading-snug mb-2">{svc.name}</h3>
                  {svc.description && (
                    <p className="text-sm text-zinc-500 leading-relaxed flex-1 line-clamp-3">{svc.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-50">
                    <p className="text-xl font-black text-zinc-900">
                      R$ {Number(svc.price).toFixed(2)}
                    </p>
                    <button onClick={() => openDrawer(svc.id)}
                      className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97] group-hover:shadow-md"
                      style={{ backgroundColor: primary }}>
                      Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Produtos / Ecommerce ──────────────────────────────────── */}
      {products.length > 0 && (
        <div className="py-20 lg:py-28 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 mb-3">Loja</p>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Produtos</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full aspect-square bg-zinc-100 flex items-center justify-center">
                      <Star className="w-10 h-10 text-zinc-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-bold text-zinc-900 text-sm leading-snug line-clamp-2 mb-1">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{product.description}</p>
                    )}
                    <p className="text-lg font-black text-zinc-900 mb-3">R$ {Number(product.price).toFixed(2)}</p>
                    <button
                      onClick={() => setProductOrder({ id: product.id, name: product.name, price: Number(product.price), description: product.description, image_url: product.image_url })}
                      className="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90"
                      style={{ backgroundColor: primary }}>
                      Reservar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Portfolio ────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <div className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400 mb-3">Nosso trabalho</p>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Portfólio</h2>
            </div>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {photos.map((photo, i) => (
                photo.file_url ? (
                  <button key={photo.id} onClick={() => setLightbox(photo.file_url!)}
                    className={`break-inside-avoid block w-full rounded-2xl overflow-hidden bg-zinc-100 group relative ${i % 3 === 0 ? 'aspect-square' : 'aspect-[3/4]'}`}>
                    <img src={photo.file_url} alt={photo.caption || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white font-medium">{photo.caption}</p>
                      </div>
                    )}
                  </button>
                ) : null
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews ──────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="py-20 lg:py-28 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: primary }}>Depoimentos</p>
                <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">O que dizem</h2>
              </div>
              {avgRating && (
                <div className="text-right hidden sm:block">
                  <p className="text-5xl font-black text-zinc-900">{avgRating.toFixed(1)}</p>
                  <div className="flex gap-0.5 justify-end mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{reviews.length} avaliações</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map(review => (
                <div key={review.id} className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-zinc-600 text-sm leading-relaxed mb-4">"{review.comment}"</p>
                  )}
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: primary }}>
                      {(review.reviewer_name || 'C').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{review.reviewer_name || 'Cliente'}</p>
                      {review.created_at && (
                        <p className="text-xs text-zinc-400">{format(new Date(review.created_at), 'MMM yyyy', { locale: ptBR })}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ── Footer contact ───────────────────────────────────────── */}
      <footer className="py-8 sm:py-10 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {info.settings?.footer_text && (
            <p className="text-zinc-500 text-xs text-center mb-6 leading-relaxed max-w-lg mx-auto">{info.settings.footer_text}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              {info.theme?.logo_url && <img src={info.theme.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover opacity-70" />}
              <span className="font-bold text-zinc-400">{tenantName}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-5">
              {info.tenant?.phone && (
                <a href={`tel:${info.tenant.phone}`} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                  <Phone className="w-3.5 h-3.5" />{info.tenant.phone}
                </a>
              )}
              {info.tenant?.instagram && (
                <a href={`https://instagram.com/${info.tenant.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                  <AtSign className="w-3.5 h-3.5" />{info.tenant.instagram}
                </a>
              )}
              {info.tenant?.address && (
                <span className="hidden sm:flex items-center gap-1.5 text-zinc-600 text-xs">
                  <MapPin className="w-3.5 h-3.5" />{info.tenant.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Sticky CTA bar ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-zinc-100 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          {selectedServiceIds.length > 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500">{selectedServiceIds.length} serviço{selectedServiceIds.length > 1 ? 's' : ''} selecionado{selectedServiceIds.length > 1 ? 's' : ''}</p>
              <p className="text-sm font-bold text-zinc-900">R$ {totalPrice.toFixed(2)} · {totalDuration}min</p>
            </div>
          )}
          <button onClick={() => openDrawer()} style={{ backgroundColor: primary }}
            className={`py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] ${selectedServiceIds.length > 0 ? 'flex-shrink-0 px-6' : 'flex-1 sm:max-w-sm sm:mx-auto'}`}>
            {selectedServiceIds.length > 0 ? 'Continuar agendamento' : (info.settings?.primary_button_text || 'Agendar agora')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-20" />

      {/* ── Product order modal ──────────────────────────────────── */}
      <ProductOrderModal
        product={productOrder}
        slug={slug!}
        isOpen={!!productOrder}
        onClose={() => setProductOrder(null)}
        primaryColor={primary}
      />

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={lightbox} className="max-w-full max-h-full rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Professional services modal ───────────────────────────── */}
      {selectedProf && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setSelectedProf(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden h-[85vh] sm:h-[600px] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 p-5 border-b border-zinc-100">
              {selectedProf.photo_url ? (
                <img src={selectedProf.photo_url} alt={selectedProf.name}
                  className="w-14 h-14 rounded-2xl object-cover object-top shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
                  style={{ backgroundColor: primary + '20', color: primary }}>
                  {selectedProf.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-zinc-900 text-lg leading-tight">{selectedProf.name}</h3>
                {selectedProf.bio && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{selectedProf.bio}</p>}
              </div>
              <button onClick={() => setSelectedProf(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors shrink-0">
                <X className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {(() => {
                const profServices = services.filter(s =>
                  selectedProf.service_ids?.includes(s.id)
                )
                if (!profServices.length) return (
                  <p className="text-sm text-zinc-400 text-center py-6">Nenhum serviço vinculado</p>
                )
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Serviços</p>
                    {profServices.map(svc => (
                      <button key={svc.id}
                        onClick={() => { openDrawer(svc.id); setSelectedProf(null) }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-zinc-100 hover:border-zinc-200 bg-white hover:bg-zinc-50 transition-all group text-left">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900 text-sm">{svc.name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{svc.duration_minutes}min
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-zinc-900">R$ {Number(svc.price).toFixed(2)}</span>
                          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div className="p-5 border-t border-zinc-100">
              <button onClick={() => { openDrawer(); setSelectedProf(null) }}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold"
                style={{ backgroundColor: primary }}>
                {info.settings?.primary_button_text || 'Agendar agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
