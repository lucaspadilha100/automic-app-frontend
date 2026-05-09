import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { publicApi } from '@/api/public.api'
import { customerAuthApi } from '@/api/customerAuth.api'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import { LoadingState } from '@/components/feedback/LoadingState'
import {
  ChevronRight, ChevronLeft, Clock, Check, Calendar, MapPin, Phone,
  Star, AtSign, X,
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const PremiumBookingPage = lazy(() => import('./PremiumBookingPage'))

type Step = 'home' | 'datetime' | 'auth' | 'confirm' | 'success'

// Backend Python weekday: 0=Mon ... 5=Sat, 6=Sun
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: 'Antes', after: 'Depois', progress: 'Progresso', other: 'Portfolio',
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useCustomerAuthStore()

  const [step, setStep] = useState<Step>('home')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedProfId, setSelectedProfId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [createdId, setCreatedId] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)

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

  const services = servicesData?.services ?? []
  const selectedServices = services.filter((s: { id: string }) => selectedServiceIds.includes(s.id))
  const totalDuration = selectedServices.reduce((acc: number, s: { duration_minutes: number }) => acc + (s.duration_minutes || 0), 0)
  const totalPrice = selectedServices.reduce((acc: number, s: { price: number }) => acc + (s.price || 0), 0)

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
    mutationFn: () => publicApi.createAppointment(slug!, {
      professional_id: selectedProfId || (professionals as { id: string }[])?.[0]?.id,
      service_ids: selectedServiceIds,
      start_datetime: selectedSlot,
      customer_notes: notes,
    }),
    onSuccess: (d: { id: string }) => { setCreatedId(d.id); setStep('success') },
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

  const primaryColor = info?.theme?.primary_color || '#6366f1'
  const tenantName = info?.tenant?.name || ''
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

  function handleSelectService(svcId: string) {
    setSelectedServiceIds([svcId])
    setStep('datetime')
  }

  function toggleService(svcId: string) {
    setSelectedServiceIds(prev => prev.includes(svcId) ? prev.filter(id => id !== svcId) : [...prev, svcId])
  }

  if (isLoading) return <LoadingState />
  if (!info) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500">Empresa não encontrada</p>
    </div>
  )

  if (info.theme?.theme_preset === 'premium') {
    return (
      <Suspense fallback={<LoadingState />}>
        <PremiumBookingPage />
      </Suspense>
    )
  }

  // ── Sticky header (used in booking steps) ────────────────────────────────
  const BookingHeader = ({ onBack }: { onBack: () => void }) => (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
      <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      </button>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + '20' }}>
        <span className="font-black text-xs" style={{ color: primaryColor }}>{(tenantName || 'A').charAt(0)}</span>
      </div>
      <p className="font-bold text-slate-900 text-sm truncate flex-1">{tenantName}</p>
      <div className="flex gap-1.5">
        {['datetime', 'auth', 'confirm'].map((s, i) => (
          <div key={s} className="w-1.5 h-1.5 rounded-full transition-all" style={{
            backgroundColor: ['datetime', 'auth', 'confirm'].indexOf(step) >= i ? primaryColor : '#e2e8f0'
          }} />
        ))}
      </div>
    </div>
  )

  // ── STEP: HOME (Landing Page) ─────────────────────────────────────────────
  if (step === 'home') return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${primaryColor}cc 100%)` }}>
        <div className="px-5 pt-10 pb-16 text-center text-white">
          {info.theme?.logo_url && (
            <img src={info.theme.logo_url} alt="" className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover border-2 border-white/30 shadow-lg" />
          )}
          <h1 className="text-2xl font-black tracking-tight">{tenantName}</h1>
          {info.settings?.homepage_subtitle && (
            <p className="text-sm text-white/80 mt-1">{info.settings.homepage_subtitle}</p>
          )}
          {info.tenant?.short_description && (
            <p className="text-sm text-white/80 mt-1 max-w-xs mx-auto">{info.tenant.short_description}</p>
          )}

          <div className="flex items-center justify-center gap-5 mt-4 text-xs text-white/70 flex-wrap">
            {info.tenant?.phone && (
              <a href={`tel:${info.tenant.phone}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="w-3.5 h-3.5" /> {info.tenant.phone}
              </a>
            )}
            {info.tenant?.address && (
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {info.tenant.address}</span>
            )}
            {info.tenant?.instagram && (
              <a href={`https://instagram.com/${info.tenant.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white">
                <AtSign className="w-3.5 h-3.5" /> {info.tenant.instagram}
              </a>
            )}
          </div>

          {avgRating && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-yellow-300 text-yellow-300' : 'text-white/30'}`} />
              ))}
              <span className="text-sm font-bold text-white ml-1">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-white/60">({reviews.length} avaliações)</span>
            </div>
          )}
        </div>

        {/* Business hours ribbon */}
        {info.business_hours?.length > 0 && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
            <div className="bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center justify-center gap-3 overflow-x-auto">
              {info.business_hours.filter(bh => !bh.is_closed).slice(0, 4).map(bh => (
                <div key={bh.weekday} className="text-center shrink-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{WEEKDAY_LABELS[bh.weekday]}</p>
                  <p className="text-xs font-semibold text-slate-700">{bh.open_time?.slice(0, 5)}–{bh.close_time?.slice(0, 5)}</p>
                </div>
              ))}
              {info.business_hours.filter(bh => !bh.is_closed).length > 4 && (
                <p className="text-xs text-slate-400 shrink-0">+{info.business_hours.filter(bh => !bh.is_closed).length - 4}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-10 pb-24 space-y-8 max-w-lg mx-auto px-4">

        {/* Services */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Serviços</h2>
          <div className="space-y-2">
            {services.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Nenhum serviço disponível</p>}
            {(services as Array<{ id: string; name: string; duration_minutes: number; price: number; description?: string; category_name?: string }>).map(svc => (
              <button key={svc.id}
                onClick={() => handleSelectService(svc.id)}
                className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.98]">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{svc.name}</p>
                  {svc.description && <p className="text-xs text-slate-400 truncate mt-0.5">{svc.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    {svc.duration_minutes && (
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {svc.duration_minutes}min</span>
                    )}
                    {svc.price != null && (
                      <span className="text-sm font-bold" style={{ color: primaryColor }}>R$ {Number(svc.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor + '15' }}>
                  <ChevronRight className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Portfolio photos */}
        {photos.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Portfolio</h2>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(photo => (
                photo.file_url ? (
                  <button key={photo.id}
                    onClick={() => setLightbox(photo.file_url!)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                    <img src={photo.file_url} alt={photo.caption || photo.photo_type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <p className="text-[10px] text-white truncate">{photo.caption}</p>
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-bold text-white bg-black/40 rounded px-1 py-0.5">
                        {PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}
                      </span>
                    </div>
                  </button>
                ) : null
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avaliações</h2>
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {reviews.slice(0, 5).map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-800">{review.reviewer_name || 'Cliente'}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}
                  {review.created_at && (
                    <p className="text-xs text-slate-400 mt-2">{format(new Date(review.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All business hours */}
        {info.business_hours?.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Horários de Funcionamento</h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {info.business_hours.map(bh => (
                <div key={bh.weekday} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">{WEEKDAY_LABELS[bh.weekday]}</p>
                  {bh.is_closed ? (
                    <p className="text-xs text-slate-400">Fechado</p>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{bh.open_time?.slice(0, 5)} – {bh.close_time?.slice(0, 5)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-slate-300 z-10">
            <X className="w-7 h-7" />
          </button>
          <img src={lightbox} className="max-w-full max-h-full rounded-xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4">
        <button
          className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
          style={{ backgroundColor: primaryColor }}
          onClick={() => setStep('datetime')}>
          Agendar agora <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  // ── STEP: Date/Time ───────────────────────────────────────────────────────
  if (step === 'datetime') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <BookingHeader onBack={() => setStep('home')} />

      <div className="flex-1 px-4 pb-28 pt-4 space-y-5">
        {/* Service selector (add/remove additional services) */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Serviços selecionados</p>
          <div className="space-y-1.5">
            {(services as Array<{ id: string; name: string; duration_minutes: number; price: number }>).map(svc => {
              const sel = selectedServiceIds.includes(svc.id)
              return (
                <button key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${sel ? 'bg-white shadow-sm' : 'border-slate-200 bg-white/50 opacity-60'}`}
                  style={sel ? { borderColor: primaryColor } : {}}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0`}
                    style={sel ? { borderColor: primaryColor, backgroundColor: primaryColor } : { borderColor: '#cbd5e1' }}>
                    {sel && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-800">{svc.name}</span>
                  {svc.price != null && <span className="text-xs font-semibold" style={{ color: primaryColor }}>R$ {Number(svc.price).toFixed(2)}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Professional selector */}
        {(professionals as { id: string; name: string }[] | undefined)?.length > 1 && (info.settings?.allow_professional_choice !== false) && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Profissional</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {info.settings?.allow_any_professional !== false && (
                <button onClick={() => setSelectedProfId('')}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${!selectedProfId ? 'text-white' : 'border-slate-200 text-slate-600 bg-white'}`}
                  style={!selectedProfId ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                  Qualquer
                </button>
              )}
              {(professionals as { id: string; name: string }[]).map(p => (
                <button key={p.id} onClick={() => setSelectedProfId(p.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedProfId === p.id ? 'text-white' : 'border-slate-200 text-slate-600 bg-white'}`}
                  style={selectedProfId === p.id ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        {selectedServiceIds.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map(({ date, label }) => (
                <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot('') }}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-16 ${selectedDate === date ? 'text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                  style={selectedDate === date ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}>
                  <span className="text-[10px] font-bold uppercase opacity-80">{label.split(' ')[0]}</span>
                  <span className="text-lg font-black leading-tight">{label.split(' ')[1].split('/')[0]}</span>
                  <span className="text-[10px] opacity-70">{label.split(' ')[1].split('/')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slots */}
        {selectedDate && selectedServiceIds.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Horário disponível</p>
            {slotsLoading ? (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="w-20 h-10 skeleton" />)}
              </div>
            ) : !(slots as { available: boolean }[])?.filter(s => s.available).length ? (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum horário disponível nesta data</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(slots as { start_datetime: string; available: boolean }[])?.filter(s => s.available).map(slot => {
                  const time = format(new Date(slot.start_datetime), 'HH:mm')
                  const sel = selectedSlot === slot.start_datetime
                  return (
                    <button key={slot.start_datetime} onClick={() => setSelectedSlot(slot.start_datetime)}
                      className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${sel ? 'text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        {selectedServiceIds.length === 0 ? (
          <p className="text-sm text-center text-slate-400">Selecione pelo menos um serviço</p>
        ) : (
          <button className="btn btn-lg w-full rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: selectedSlot ? primaryColor : '#e2e8f0', color: selectedSlot ? '#fff' : '#94a3b8' }}
            disabled={!selectedSlot}
            onClick={() => setStep(isAuthenticated ? 'confirm' : 'auth')}>
            {selectedSlot
              ? <>{totalDuration}min · R$ {totalPrice.toFixed(2)} · Continuar <ChevronRight className="w-5 h-5" /></>
              : 'Selecione um horário'}
          </button>
        )}
      </div>
    </div>
  )

  // ── STEP: Auth ────────────────────────────────────────────────────────────
  if (step === 'auth') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <BookingHeader onBack={() => setStep('datetime')} />

      <div className="flex-1 px-4 pb-28 pt-6">
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
          {[['login', 'Entrar'], ['register', 'Criar conta']].map(([mode, label]) => (
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
              <input className="input" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} placeholder="Maria Silva" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} placeholder="maria@email.com" />
          </div>
          {authMode === 'register' && (
            <div>
              <label className="label">Telefone (WhatsApp)</label>
              <input type="tel" className="input" value={authForm.phone} onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))} placeholder="11999999999" />
            </div>
          )}
          <div>
            <label className="label">Senha</label>
            <input type="password" className="input" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
          </div>

          <button className="btn btn-lg w-full rounded-xl font-bold mt-2 text-white"
            style={{ backgroundColor: primaryColor }}
            onClick={() => authMut.mutate()}
            disabled={authMut.isPending || !authForm.email || !authForm.password}>
            {authMut.isPending ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── STEP: Confirm ─────────────────────────────────────────────────────────
  if (step === 'confirm') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <BookingHeader onBack={() => setStep('datetime')} />

      <div className="flex-1 px-4 pb-28 pt-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Resumo do agendamento</h3>

          <div className="space-y-3">
            {selectedServices.map((svc: { id: string; name: string; duration_minutes: number; price: number }) => (
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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <button className="btn btn-lg w-full rounded-xl font-bold text-white"
          style={{ backgroundColor: primaryColor }}
          onClick={() => bookMut.mutate()}
          disabled={bookMut.isPending}>
          {bookMut.isPending ? 'Agendando...' : 'Confirmar agendamento'}
        </button>
      </div>
    </div>
  )

  // ── STEP: Success ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: primaryColor + '20' }}>
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
        {selectedServices.map((svc: { id: string; name: string }) => (
          <div key={svc.id} className="flex items-center gap-2 text-sm text-slate-700">
            <Check className="w-4 h-4 text-slate-400" />
            <span>{svc.name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mt-6 w-full max-w-sm">
        <button className="btn btn-lg w-full rounded-xl font-bold text-white"
          style={{ backgroundColor: primaryColor }}
          onClick={() => navigate(`/customer/tenants/${slug}/appointments`)}>
          Ver meus agendamentos
        </button>
        <button className="btn-secondary w-full rounded-xl"
          onClick={() => { setStep('home'); setSelectedServiceIds([]); setSelectedSlot(''); setSelectedDate('') }}>
          Fazer outro agendamento
        </button>
      </div>
    </div>
  )
}
