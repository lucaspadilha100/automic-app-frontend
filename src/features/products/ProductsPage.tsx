import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extractApiError } from '@/api/client'
import { productsApi } from '@/api/products.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonList } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ShoppingBag, Plus, Power, PowerOff, Pencil, X, Trash2, ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Category = {
  id: string
  name: string
  sort_order: number
}

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string | null
  category?: Category | null
  track_stock: boolean
  stock_quantity: number | null
  low_stock_threshold: number | null
  is_active: boolean
}

type OrderItem = {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
}

type Order = {
  id: string
  customer_name: string
  customer_phone: string | null
  items: OrderItem[]
  total: number
  status: 'pending' | 'ready' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'paid'
  payment_method: string | null
  created_at: string
}

const EMPTY_PRODUCT_FORM = {
  name: '',
  category_id: '',
  price: '',
  image_url: '',
  description: '',
  track_stock: false,
  stock_quantity: '',
  low_stock_threshold: '',
  is_active: true,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  ready: 'Pronto',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  ready: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'ready',
  ready: 'completed',
}

const NEXT_STATUS_LABEL: Record<string, string> = {
  pending: 'Marcar pronto',
  ready: 'Concluir',
}

export default function ProductsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'products' | 'orders'>('products')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('pix')

  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['product-categories'],
    queryFn: () => productsApi.listCategories(),
  })

  const { data: orders, isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ['product-orders'],
    queryFn: () => productsApi.listOrders(),
  })

  const createMut = useMutation({
    mutationFn: () =>
      productsApi.create({
        name: form.name,
        category_id: form.category_id || null,
        price: Number(form.price),
        image_url: form.image_url || null,
        description: form.description || null,
        track_stock: form.track_stock,
        stock_quantity: form.track_stock && form.stock_quantity !== '' ? Number(form.stock_quantity) : null,
        low_stock_threshold: form.track_stock && form.low_stock_threshold !== '' ? Number(form.low_stock_threshold) : null,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setShowForm(false)
      setForm(EMPTY_PRODUCT_FORM)
      toast.success('Produto criado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      productsApi.update(editing!.id, {
        name: form.name,
        category_id: form.category_id || null,
        price: Number(form.price),
        image_url: form.image_url || null,
        description: form.description || null,
        track_stock: form.track_stock,
        stock_quantity: form.track_stock && form.stock_quantity !== '' ? Number(form.stock_quantity) : null,
        low_stock_threshold: form.track_stock && form.low_stock_threshold !== '' ? Number(form.low_stock_threshold) : null,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setEditing(null)
      setShowForm(false)
      setForm(EMPTY_PRODUCT_FORM)
      toast.success('Produto atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      productsApi.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Status atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setConfirmDelete(null)
      toast.success('Produto removido')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const advanceStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      productsApi.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-orders'] })
      toast.success('Status atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const cancelOrderMut = useMutation({
    mutationFn: (id: string) => productsApi.updateOrderStatus(id, 'cancelled'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-orders'] })
      toast.success('Pedido cancelado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const markPaidMut = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      productsApi.markOrderPaid(id, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-orders'] })
      setPayingOrderId(null)
      setPaymentMethod('pix')
      toast.success('Pagamento registrado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      category_id: p.category_id ?? '',
      price: String(p.price),
      image_url: p.image_url ?? '',
      description: p.description ?? '',
      track_stock: p.track_stock,
      stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : '',
      low_stock_threshold: p.low_stock_threshold != null ? String(p.low_stock_threshold) : '',
      is_active: p.is_active,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_PRODUCT_FORM)
  }

  function isLowStock(p: Product) {
    return p.track_stock && p.low_stock_threshold != null && p.stock_quantity != null && p.stock_quantity <= p.low_stock_threshold
  }

  if (loadingProducts && tab === 'products') return <SkeletonList />
  if (loadingOrders && tab === 'orders') return <SkeletonList />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Produtos"
        subtitle="Gerencie produtos à venda e pedidos"
        actions={
          tab === 'products' ? (
            <button className="btn-primary" onClick={() => { setEditing(null); setForm(EMPTY_PRODUCT_FORM); setShowForm(true) }}>
              <Plus className="w-4 h-4" /> Novo produto
            </button>
          ) : undefined
        }
      />

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'products' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Produtos
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'orders' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Pedidos
        </button>
      </div>

      {tab === 'products' && (
        <>
          {showForm && (
            <div className="card p-6 border-primary-200 border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{editing ? 'Editar produto' : 'Novo produto'}</h3>
                <button onClick={closeForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome *</label>
                  <input className="input w-full" placeholder="Nome do produto" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Categoria</label>
                  <select className="input w-full" value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Sem categoria</option>
                    {categories?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Preço *</label>
                  <input type="number" min="0" step="0.01" className="input w-full" placeholder="0,00"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">URL da imagem</label>
                  <input className="input w-full" placeholder="https://..." value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Descrição</label>
                  <textarea className="input w-full" rows={2} placeholder="Descrição opcional"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, track_stock: !f.track_stock }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.track_stock ? 'bg-primary-500' : 'bg-slate-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.track_stock ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700">Controlar estoque</span>
              </label>

              {form.track_stock && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Quantidade em estoque</label>
                    <input type="number" min="0" className="input w-full" placeholder="0"
                      value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Alerta de estoque baixo</label>
                    <input type="number" min="0" className="input w-full" placeholder="5"
                      value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))} />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_active ? 'bg-primary-500' : 'bg-slate-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700">Ativo</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-ghost" onClick={closeForm}>Cancelar</button>
                <button
                  className="btn-primary"
                  disabled={createMut.isPending || updateMut.isPending}
                  onClick={() => editing ? updateMut.mutate() : createMut.mutate()}>
                  {(createMut.isPending || updateMut.isPending) ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar produto'}
                </button>
              </div>
            </div>
          )}

          {!products?.length ? (
            <EmptyState
              icon={ShoppingBag}
              title="Nenhum produto cadastrado"
              description="Crie produtos para vender aos seus clientes"
              action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Novo produto</button>}
            />
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                      <ShoppingBag className={`w-4 h-4 ${p.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {p.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        {isLowStock(p) && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                            Estoque baixo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {p.category?.name && `${p.category.name} · `}
                        R$ {Number(p.price).toFixed(2)}
                        {p.track_stock && p.stock_quantity != null && ` · Estoque: ${p.stock_quantity}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="btn-icon btn text-slate-400 hover:text-slate-700" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleMut.mutate({ id: p.id, is_active: !p.is_active })}
                      className={`btn-icon btn ${p.is_active ? 'text-emerald-500 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}
                      title={p.is_active ? 'Desativar' : 'Ativar'}>
                      {p.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    {confirmDelete === p.id ? (
                      <>
                        <button
                          onClick={() => deleteMut.mutate(p.id)}
                          className="btn-icon btn text-red-500 hover:text-red-700"
                          title="Confirmar exclusão">
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="btn-icon btn text-slate-400 hover:text-slate-600"
                          title="Cancelar">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="btn-icon btn text-slate-400 hover:text-red-500"
                        title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        <>
          {!orders?.length ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nenhum pedido encontrado"
              description="Os pedidos aparecerão aqui quando forem realizados"
            />
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <div key={order.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{order.customer_name}</p>
                        {order.customer_phone && (
                          <span className="text-xs text-slate-500">{order.customer_phone}</span>
                        )}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {order.payment_status === 'paid' ? `Pago · ${order.payment_method}` : 'Não pago'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} · R$ {Number(order.total).toFixed(2)} · {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                        payingOrderId === order.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              className="input text-xs py-1"
                              value={paymentMethod}
                              onChange={e => setPaymentMethod(e.target.value)}>
                              <option value="pix">Pix</option>
                              <option value="dinheiro">Dinheiro</option>
                              <option value="cartão">Cartão</option>
                            </select>
                            <button
                              className="btn-primary text-xs py-1 px-2"
                              disabled={markPaidMut.isPending}
                              onClick={() => markPaidMut.mutate({ id: order.id, method: paymentMethod })}>
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              className="btn-ghost text-xs py-1 px-2"
                              onClick={() => { setPayingOrderId(null); setPaymentMethod('pix') }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => setPayingOrderId(order.id)}>
                            Registrar pagamento
                          </button>
                        )
                      )}
                      {NEXT_STATUS[order.status] && (
                        <button
                          className="btn-primary text-xs"
                          disabled={advanceStatusMut.isPending}
                          onClick={() => advanceStatusMut.mutate({ id: order.id, status: NEXT_STATUS[order.status] })}>
                          {NEXT_STATUS_LABEL[order.status]}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          className="btn-danger text-xs"
                          disabled={cancelOrderMut.isPending}
                          onClick={() => cancelOrderMut.mutate(order.id)}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>R$ {Number(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
