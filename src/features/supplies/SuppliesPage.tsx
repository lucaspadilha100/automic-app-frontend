import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extractApiError } from '@/api/client'
import { suppliesApi } from '@/api/supplies.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { FlaskConical, Plus, Power, PowerOff, Pencil, X, Check, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

type Supply = {
  id: string
  name: string
  unit: string
  cost_price: number | null
  track_stock: boolean
  stock_quantity: number | null
  low_stock_threshold: number | null
  is_active: boolean
}

const EMPTY_FORM = {
  name: '',
  unit: 'un',
  cost_price: '',
  track_stock: false,
  stock_quantity: '',
  low_stock_threshold: '',
  is_active: true,
}

const UNIT_LABELS: Record<string, string> = {
  un: 'Unidade',
  ml: 'Mililitros (ml)',
  g: 'Gramas (g)',
  kg: 'Quilogramas (kg)',
  l: 'Litros (l)',
}

export default function SuppliesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supply | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustValue, setAdjustValue] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const { data, isLoading } = useQuery<Supply[]>({
    queryKey: ['supplies'],
    queryFn: () => suppliesApi.list(),
  })

  const createMut = useMutation({
    mutationFn: () =>
      suppliesApi.create({
        name: form.name,
        unit: form.unit,
        cost_price: form.cost_price !== '' ? Number(form.cost_price) : null,
        track_stock: form.track_stock,
        stock_quantity: form.track_stock && form.stock_quantity !== '' ? Number(form.stock_quantity) : null,
        low_stock_threshold: form.track_stock && form.low_stock_threshold !== '' ? Number(form.low_stock_threshold) : null,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] })
      setShowForm(false)
      setForm(EMPTY_FORM)
      toast.success('Insumo criado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      suppliesApi.update(editing!.id, {
        name: form.name,
        unit: form.unit,
        cost_price: form.cost_price !== '' ? Number(form.cost_price) : null,
        track_stock: form.track_stock,
        stock_quantity: form.track_stock && form.stock_quantity !== '' ? Number(form.stock_quantity) : null,
        low_stock_threshold: form.track_stock && form.low_stock_threshold !== '' ? Number(form.low_stock_threshold) : null,
        is_active: form.is_active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] })
      setEditing(null)
      setShowForm(false)
      setForm(EMPTY_FORM)
      toast.success('Insumo atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      suppliesApi.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Status atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const adjustMut = useMutation({
    mutationFn: ({ id, adjustment, reason }: { id: string; adjustment: number; reason?: string }) =>
      suppliesApi.adjustStock(id, adjustment, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplies'] })
      setAdjustingId(null)
      setAdjustValue('')
      setAdjustReason('')
      toast.success('Estoque ajustado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  function openEdit(s: Supply) {
    setEditing(s)
    setForm({
      name: s.name,
      unit: s.unit,
      cost_price: s.cost_price != null ? String(s.cost_price) : '',
      track_stock: s.track_stock,
      stock_quantity: s.stock_quantity != null ? String(s.stock_quantity) : '',
      low_stock_threshold: s.low_stock_threshold != null ? String(s.low_stock_threshold) : '',
      is_active: s.is_active,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  function isLowStock(s: Supply) {
    return s.track_stock && s.low_stock_threshold != null && s.stock_quantity != null && s.stock_quantity <= s.low_stock_threshold
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Insumos"
        subtitle="Gerencie os materiais e insumos utilizados nos atendimentos"
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> Novo insumo
          </button>
        }
      />

      {showForm && (
        <div className="card p-6 border-primary-200 border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{editing ? 'Editar insumo' : 'Novo insumo'}</h3>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome *</label>
              <input className="input w-full" placeholder="Nome do insumo" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Unidade *</label>
              <select className="input w-full" value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {Object.entries(UNIT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Preço de custo</label>
              <input type="number" min="0" step="0.01" className="input w-full" placeholder="0,00"
                value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} />
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
                <input type="number" min="0" step="0.001" className="input w-full" placeholder="0"
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
              {(createMut.isPending || updateMut.isPending) ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar insumo'}
            </button>
          </div>
        </div>
      )}

      {adjustingId && (
        <div className="modal-overlay" onClick={() => { setAdjustingId(null); setAdjustValue(''); setAdjustReason('') }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-sm font-bold text-slate-900">Ajustar estoque</h3>
              <button onClick={() => { setAdjustingId(null); setAdjustValue(''); setAdjustReason('') }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ajuste</label>
                <input
                  type="number"
                  step="0.001"
                  className="input w-full"
                  placeholder="Ex: 10 ou -5"
                  value={adjustValue}
                  onChange={e => setAdjustValue(e.target.value)}
                />
                <p className="text-xs text-slate-400">Use valor negativo para deduzir do estoque</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Motivo</label>
                <input
                  className="input w-full"
                  placeholder="Motivo opcional"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => { setAdjustingId(null); setAdjustValue(''); setAdjustReason('') }}>Cancelar</button>
              <button
                className="btn-primary"
                disabled={adjustMut.isPending || adjustValue === ''}
                onClick={() => adjustMut.mutate({ id: adjustingId, adjustment: Number(adjustValue), reason: adjustReason || undefined })}>
                {adjustMut.isPending ? 'Salvando...' : 'Confirmar ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!data?.length ? (
        <EmptyState
          icon={FlaskConical}
          title="Nenhum insumo cadastrado"
          description="Cadastre os materiais e insumos usados nos seus atendimentos"
          action={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Novo insumo</button>}
        />
      ) : (
        <div className="space-y-2">
          {data.map(s => (
            <div key={s.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                  <FlaskConical className={`w-4 h-4 ${s.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{s.name}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    {isLowStock(s) && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                        Estoque baixo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {UNIT_LABELS[s.unit] ?? s.unit}
                    {s.cost_price != null && ` · R$ ${Number(s.cost_price).toFixed(2)}`}
                    {s.track_stock && s.stock_quantity != null && ` · Estoque: ${s.stock_quantity}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {s.track_stock && (
                  <button
                    onClick={() => { setAdjustingId(s.id); setAdjustValue(''); setAdjustReason('') }}
                    className="btn-icon btn text-slate-400 hover:text-slate-700"
                    title="Ajustar estoque">
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => openEdit(s)} className="btn-icon btn text-slate-400 hover:text-slate-700" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleMut.mutate({ id: s.id, is_active: !s.is_active })}
                  className={`btn-icon btn ${s.is_active ? 'text-emerald-500 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}
                  title={s.is_active ? 'Desativar' : 'Ativar'}>
                  {s.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
