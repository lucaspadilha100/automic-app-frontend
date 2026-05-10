import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, ChevronRight, ChevronLeft, Check, ShoppingBag, Package, Truck } from 'lucide-react'
import { customerAuthApi } from '@/api/customerAuth.api'
import { customerPortalApi } from '@/api/customerPortal.api'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

type OrderStep = 'detail' | 'auth' | 'confirm' | 'success'
type DeliveryType = 'pickup' | 'delivery'

export type OrderableProduct = {
  id: string
  name: string
  price: number
  description?: string
  image_url?: string
}

export function ProductOrderModal({
  product,
  slug,
  isOpen,
  onClose,
  primaryColor = '#c9a96e',
}: {
  product: OrderableProduct | null
  slug: string
  isOpen: boolean
  onClose: () => void
  primaryColor?: string
}) {
  const { isAuthenticated, setAuth, customer } = useCustomerAuthStore()
  const [step, setStep] = useState<OrderStep>('detail')
  const [quantity, setQuantity] = useState(1)
  const [delivery, setDelivery] = useState<DeliveryType>('pickup')
  const [notes, setNotes] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })

  const total = product ? Number(product.price) * quantity : 0

  const authMut = useMutation({
    mutationFn: async () => {
      let tokens
      if (authMode === 'login') {
        tokens = await customerAuthApi.login({ email: authForm.email, password: authForm.password })
      } else {
        tokens = await customerAuthApi.register({ name: authForm.name, email: authForm.email || undefined, phone: authForm.phone, password: authForm.password })
      }
      const me = await customerAuthApi.me()
      return { tokens, customer: me }
    },
    onSuccess: ({ tokens, customer }) => {
      setAuth(customer, tokens.access_token)
      setStep('confirm')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const orderMut = useMutation({
    mutationFn: () => customerPortalApi.createProductOrder(slug, {
      items: [{ product_id: product!.id, quantity }],
      delivery_type: delivery,
      notes: notes || undefined,
    }),
    onSuccess: () => setStep('success'),
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep('detail')
        setQuantity(1)
        setDelivery('pickup')
        setNotes('')
        setAuthForm({ name: '', email: '', phone: '', password: '' })
      }, 350)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  function handleDetailNext() {
    setStep(isAuthenticated ? 'confirm' : 'auth')
  }

  function handleClose() {
    onClose()
  }

  const steps: OrderStep[] = isAuthenticated
    ? ['detail', 'confirm']
    : ['detail', 'auth', 'confirm']
  const stepIdx = steps.indexOf(step)

  if (!product) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl h-[88vh] sm:h-[640px] overflow-hidden flex flex-col transition-transform duration-500 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-4'}`}>

        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-zinc-50">
          <div>
            {(step === 'auth' || step === 'confirm') && step !== 'success' && (
              <button
                onClick={() => setStep(step === 'confirm' ? (isAuthenticated ? 'detail' : 'auth') : 'detail')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 mb-1 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            )}
            <h2 className="text-base font-bold text-zinc-900">
              {step === 'detail' && 'Reservar produto'}
              {step === 'auth' && 'Identificação'}
              {step === 'confirm' && 'Confirmar pedido'}
              {step === 'success' && 'Pedido realizado!'}
            </h2>
          </div>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors">
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        {/* Progress */}
        {step !== 'success' && (
          <div className="flex gap-1.5 px-6 pt-3 pb-1 shrink-0">
            {steps.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: stepIdx >= i ? primaryColor : '#e4e4e7' }} />
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-4">

          {/* STEP: Detail */}
          {step === 'detail' && (
            <div className="space-y-5">
              <div className="flex gap-4 p-4 bg-zinc-50 rounded-2xl">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-8 h-8 text-zinc-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 text-sm leading-snug">{product.name}</p>
                  {product.description && <p className="text-xs text-zinc-400 mt-1 line-clamp-3 leading-relaxed">{product.description}</p>}
                  <p className="text-lg font-black text-zinc-900 mt-2">R$ {Number(product.price).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Quantidade</p>
                <div className="flex items-center gap-5">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-700 hover:border-zinc-400 transition-colors text-xl font-bold">
                    −
                  </button>
                  <span className="text-2xl font-black text-zinc-900 w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-11 h-11 rounded-full border-2 border-zinc-200 flex items-center justify-center text-zinc-700 hover:border-zinc-400 transition-colors text-xl font-bold">
                    +
                  </button>
                  <span className="text-sm text-zinc-400 ml-auto">
                    Total: <span className="font-bold text-zinc-700">R$ {total.toFixed(2)}</span>
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Como deseja receber?</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: 'pickup', label: 'Retirada na loja', Icon: Package },
                    { key: 'delivery', label: 'Entrega', sub: '(a combinar)', Icon: Truck },
                  ] as const).map(({ key, label, sub, Icon }) => (
                    <button key={key} onClick={() => setDelivery(key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${delivery === key ? 'bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                      style={delivery === key ? { borderColor: primaryColor } : {}}>
                      <Icon className="w-6 h-6" style={{ color: delivery === key ? primaryColor : '#a1a1aa' }} />
                      <span className={`text-xs font-bold text-center leading-tight ${delivery === key ? 'text-zinc-900' : 'text-zinc-500'}`}>
                        {label}{sub && <><br /><span className="font-normal">{sub}</span></>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Observações (opcional)</p>
                <textarea
                  className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none resize-none transition-colors"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Algum detalhe ou preferência..." />
              </div>
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
                    <input className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none transition-colors"
                      value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} placeholder="Maria Silva" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Email</label>
                  <input type="email" className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none transition-colors"
                    value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} placeholder="maria@email.com" />
                </div>
                {authMode === 'register' && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">WhatsApp</label>
                    <input type="tel" className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none transition-colors"
                      value={authForm.phone} onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))} placeholder="11999999999" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Senha</label>
                  <input type="password" className="w-full border-2 border-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none transition-colors"
                    value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 rounded-2xl p-5 space-y-4">
                <div className="flex gap-3 items-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-7 h-7 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-zinc-900 text-sm leading-snug">{product.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Quantidade: {quantity}</p>
                  </div>
                </div>
                <div className="border-t border-zinc-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Modalidade</span>
                    <span className="font-semibold text-zinc-900">{delivery === 'pickup' ? 'Retirada na loja' : 'Entrega (a combinar)'}</span>
                  </div>
                  {notes && (
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-zinc-500 shrink-0">Observação</span>
                      <span className="text-zinc-600 text-right text-xs">{notes}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-zinc-100 pt-2">
                    <span className="font-bold text-zinc-900">Total estimado</span>
                    <span className="text-xl font-black" style={{ color: primaryColor }}>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {customer && (
                <p className="text-xs text-zinc-400 text-center">
                  Pedido em nome de <span className="font-semibold text-zinc-700">{customer.name}</span>
                </p>
              )}
              <p className="text-xs text-zinc-400 text-center leading-relaxed">
                Ao confirmar, você receberá contato para finalizar os detalhes.
              </p>
            </div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: primaryColor + '20' }}>
                <Check className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-xl font-black text-zinc-900">Pedido realizado!</h3>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-xs mx-auto">
                Sua reserva foi registrada. Entraremos em contato para confirmar {delivery === 'pickup' ? 'a retirada' : 'os detalhes da entrega'}.
              </p>
              <div className="mt-6 bg-zinc-50 rounded-2xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Produto</span>
                  <span className="font-semibold text-zinc-900 text-right max-w-[60%] leading-snug">{product.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Qtd.</span>
                  <span className="font-semibold text-zinc-900">{quantity}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-zinc-100 pt-2">
                  <span className="font-bold text-zinc-900">Total</span>
                  <span className="font-black text-zinc-900">R$ {total.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={handleClose}
                className="mt-6 w-full py-3.5 rounded-2xl bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 transition-colors">
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {step !== 'success' && (
          <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
            {step === 'detail' && (
              <button onClick={handleDetailNext}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ backgroundColor: primaryColor }}>
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 'auth' && (
              <button
                disabled={authMut.isPending || !authForm.email || !authForm.password}
                onClick={() => authMut.mutate()}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-30 transition-all hover:opacity-90"
                style={{ backgroundColor: primaryColor }}>
                {authMut.isPending ? 'Aguarde...' : authMode === 'login' ? 'Entrar e continuar' : 'Criar conta e continuar'}
              </button>
            )}
            {step === 'confirm' && (
              <button
                disabled={orderMut.isPending}
                onClick={() => orderMut.mutate()}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-30 transition-all hover:opacity-90"
                style={{ backgroundColor: primaryColor }}>
                {orderMut.isPending ? 'Enviando...' : 'Confirmar reserva'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
