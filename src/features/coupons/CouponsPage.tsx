import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, extractApiError } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonList } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Tag, Plus, Power, PowerOff, Pencil, X, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Coupon = {
  id: string
  code: string
  discount_type: string
  discount_value: number
  starts_at: string | null
  ends_at: string | null
  usage_limit: number | null
  times_used: number
  is_active: boolean
}

const EMPTY_FORM = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  starts_at: '',
  ends_at: '',
  usage_limit: '',
  is_active: true,
}

export default function CouponsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery<Coupon[]>({
    queryKey: ['coupons'],
    queryFn: async () => (await apiClient.get('/coupons')).data,
  })

  const createMut = useMutation({
    mutationFn: () => apiClient.post('/coupons', {
      ...form,
      discount_value: Number(form.discount_value),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] })
      setShowForm(false)
      setForm(EMPTY_FORM)
      toast.success('Cupom criado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const updateMut = useMutation({
    mutationFn: () => apiClient.put(`/coupons/${editing!.id}`, {
      ...form,
      discount_value: Number(form.discount_value),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] })
      setEditing(null)
      setForm(EMPTY_FORM)
      toast.success('Cupom atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiClient.patch(`/coupons/${id}/status`, null, { params: { is_active } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast.success('Status atualizado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  function openEdit(c: Coupon) {
    setEditing(c)
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      starts_at: c.starts_at ? c.starts_at.slice(0, 10) : '',
      ends_at: c.ends_at ? c.ends_at.slice(0, 10) : '',
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      is_active: c.is_active,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Cupons de desconto"
        subtitle="Gerencie códigos promocionais para clientes"
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> Novo cupom
          </button>
        }
      />

      {/* Form panel */}
      {showForm && (
        <div className="card p-6 border-primary-200 border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{editing ? 'Editar cupom' : 'Novo cupom'}</h3>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Código *</label>
              <input className="input w-full uppercase" placeholder="PROMO10" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipo de desconto *</label>
              <select className="input w-full" value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Valor * {form.discount_type === 'percentage' ? '(%)' : '(R$)'}
              </label>
              <input type="number" min="0" step="0.01" className="input w-full" placeholder="10"
                value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Limite de usos</label>
              <input type="number" min="1" className="input w-full" placeholder="Ilimitado"
                value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Válido de</label>
              <input type="date" className="input w-full" value={form.starts_at}
                onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Válido até</label>
              <input type="date" className="input w-full" value={form.ends_at}
                onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <button
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
              {(createMut.isPending || updateMut.isPending) ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar cupom'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {!data?.length ? (
        <EmptyState
          icon={Tag}
          title="Nenhum cupom criado"
          description="Crie cupons de desconto para seus clientes"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Criar cupom</button>}
        />
      ) : (
        <div className="space-y-2">
          {data.map(c => (
            <div key={c.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                  <Tag className={`w-4 h-4 ${c.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 font-mono">{c.code}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% de desconto` : `R$ ${Number(c.discount_value).toFixed(2)} de desconto`}
                    {c.usage_limit ? ` · ${c.times_used}/${c.usage_limit} usos` : ` · ${c.times_used} uso${c.times_used !== 1 ? 's' : ''}`}
                    {c.ends_at && ` · Expira: ${format(new Date(c.ends_at), 'dd/MM/yyyy', { locale: ptBR })}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(c)} className="btn-icon btn text-slate-400 hover:text-slate-700" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleMut.mutate({ id: c.id, is_active: !c.is_active })}
                  className={`btn-icon btn ${c.is_active ? 'text-emerald-500 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}
                  title={c.is_active ? 'Desativar' : 'Ativar'}>
                  {c.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
