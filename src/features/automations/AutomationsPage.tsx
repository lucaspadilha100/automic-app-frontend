import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Zap, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const TRIGGERS = [
  'appointment_created','appointment_confirmed','appointment_completed',
  'appointment_cancelled','customer_created','payment_registered',
]
const CHANNELS = ['whatsapp','email','sms']

export default function AutomationsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', trigger_type: 'appointment_created', channel: 'whatsapp', delay_minutes: 0, message_template: '', is_active: true })

  const { data, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => (await apiClient.get('/admin/automations')).data,
  })

  const createMut = useMutation({
    mutationFn: (d: typeof form) => apiClient.post('/admin/automations', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); setShowForm(false); toast.success('Automação criada') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => apiClient.patch(`/admin/automations/${id}/status`, { is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); toast.success('Status atualizado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/automations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); toast.success('Removido') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <div><PageHeader title="Automações" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Automações"
        subtitle="Mensagens e ações automáticas por evento"
        actions={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Nova</button>}
      />

      <div className="space-y-2">
        {!data?.length ? (
          <EmptyState icon={Zap} title="Nenhuma automação" description="Crie regras para enviar mensagens automaticamente após eventos" action={<button className="btn-primary" onClick={() => setShowForm(true)}>Criar automação</button>} />
        ) : data.map((a: Record<string,unknown>) => (
          <div key={a.id as string} className="card p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.is_active ? 'bg-primary-100' : 'bg-slate-100'}`}>
                <Zap className={`w-4 h-4 ${a.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{a.name as string}</p>
                <p className="text-xs text-slate-400">
                  {a.trigger_type as string} → {a.channel as string}
                  {a.delay_minutes ? ` (${a.delay_minutes}min depois)` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleMut.mutate({ id: a.id as string, is_active: !a.is_active })}
                className={`btn-icon btn ${a.is_active ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                title={a.is_active ? 'Desativar' : 'Ativar'}>
                {a.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteMut.mutate(a.id as string)} className="btn-icon btn text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-slate-900">Nova automação</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Confirmação de agendamento" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Gatilho (trigger)</label>
                  <select className="select" value={form.trigger_type} onChange={e => setForm(f => ({...f, trigger_type: e.target.value}))}>
                    {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Canal</label>
                  <select className="select" value={form.channel} onChange={e => setForm(f => ({...f, channel: e.target.value}))}>
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Delay (minutos após evento)</label>
                <input type="number" className="input" value={form.delay_minutes} onChange={e => setForm(f => ({...f, delay_minutes: Number(e.target.value)}))} min={0} />
              </div>
              <div>
                <label className="label">Mensagem</label>
                <textarea className="input" rows={4} value={form.message_template} onChange={e => setForm(f => ({...f, message_template: e.target.value}))} placeholder="Olá {{customer_name}}! Seu agendamento foi confirmado para {{appointment_date}}." />
                <p className="text-xs text-slate-400 mt-1">Variáveis: {`{{customer_name}}, {{appointment_date}}, {{appointment_time}}, {{professional_name}}, {{tenant_name}}`}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => createMut.mutate(form)} disabled={!form.name || !form.message_template || createMut.isPending}>
                Criar automação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
