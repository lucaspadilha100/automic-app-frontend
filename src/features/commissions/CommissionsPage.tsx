import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BarChart3, Plus, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function CommissionsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'settings'|'records'>('records')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ professional_id: '', commission_type: 'percentage', value: '', min_value: '', max_value: '' })

  const { data: records, isLoading: recLoading } = useQuery({
    queryKey: ['commission-records'],
    queryFn: async () => (await apiClient.get('/admin/commissions/records')).data,
  })

  const { data: settings } = useQuery({
    queryKey: ['commission-settings'],
    queryFn: async () => (await apiClient.get('/admin/commissions/settings')).data,
  })

  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => (await apiClient.get('/professionals')).data,
  })

  const createSettingMut = useMutation({
    mutationFn: (d: typeof form) => apiClient.post('/admin/commissions/settings', { ...d, value: Number(d.value) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commission-settings'] }); setShowForm(false); toast.success('Regra criada') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const markPaidMut = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/commissions/records/${id}/mark-paid`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commission-records'] }); toast.success('Comissão marcada como paga') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Comissões"
        subtitle="Controle de comissões dos profissionais"
        actions={tab === 'settings' ? <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Nova regra</button> : undefined}
      />

      <div className="tabs">
        <button className={`tab ${tab==='records'?'tab-active':''}`} onClick={() => setTab('records')}>Registros</button>
        <button className={`tab ${tab==='settings'?'tab-active':''}`} onClick={() => setTab('settings')}>Regras</button>
      </div>

      {tab === 'records' && (
        <div className="table-wrap">
          {recLoading ? <SkeletonTable /> : !records?.length ? (
            <EmptyState icon={BarChart3} title="Nenhum registro" description="As comissões são geradas automaticamente após pagamentos" />
          ) : (
            <table className="table">
              <thead className="thead"><tr>
                <th className="th">Profissional</th>
                <th className="th">Valor</th>
                <th className="th">Status</th>
                <th className="th">Data</th>
                <th className="th"></th>
              </tr></thead>
              <tbody>
                {records?.map((r: Record<string,unknown>) => (
                  <tr key={r.id as string} className="tr">
                    <td className="td font-medium">{(r.professional as {name:string})?.name || '—'}</td>
                    <td className="td font-semibold text-emerald-700">R$ {Number(r.amount || 0).toFixed(2)}</td>
                    <td className="td"><StatusBadge status={r.status as string} /></td>
                    <td className="td text-xs text-slate-400">{new Date(r.created_at as string).toLocaleDateString('pt-BR')}</td>
                    <td className="td">
                      {r.status === 'pending' && (
                        <button className="btn-ghost btn-sm gap-1" onClick={() => markPaidMut.mutate(r.id as string)}>
                          <CheckCircle className="w-3.5 h-3.5" /> Marcar paga
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-3">
          {!settings?.length ? (
            <EmptyState icon={BarChart3} title="Nenhuma regra" description="Crie regras de comissão por profissional" action={<button className="btn-primary" onClick={() => setShowForm(true)}>Criar regra</button>} />
          ) : settings?.map((s: Record<string,unknown>) => (
            <div key={s.id as string} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{(s.professional as {name:string})?.name}</p>
                <p className="text-xs text-slate-400">
                  {s.commission_type === 'percentage' ? `${s.value}%` : `R$ ${s.value} fixo`}
                </p>
              </div>
              <StatusBadge status={s.is_active ? 'active' : 'inactive'} />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Nova regra de comissão</h3><button onClick={() => setShowForm(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Profissional</label>
                <select className="select" value={form.professional_id} onChange={e => setForm(f => ({...f, professional_id: e.target.value}))}>
                  <option value="">Selecione...</option>
                  {professionals?.map((p: {id:string;name:string}) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select className="select" value={form.commission_type} onChange={e => setForm(f => ({...f, commission_type: e.target.value}))}>
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="label">{form.commission_type === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}</label>
                  <input type="number" step="0.01" className="input" value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} placeholder="30" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => createSettingMut.mutate(form)} disabled={!form.professional_id || !form.value || createSettingMut.isPending}>Criar regra</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
