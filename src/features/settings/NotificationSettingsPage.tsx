import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Bell, Plus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const EVENTS = ['appointment_confirmed','appointment_reminder_24h','appointment_cancelled','appointment_completed']
const CHANNELS = ['email','sms','whatsapp']

export default function NotificationSettingsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ event_type: 'appointment_confirmed', channel: 'email', subject: '', body: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => (await apiClient.get('/settings/notifications')).data,
  })

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiClient.post('/settings/notifications', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notification-templates'] }); setShowForm(false); toast.success('Template criado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/settings/notifications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notification-templates'] }); toast.success('Template removido') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <SkeletonTable />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Templates de notificação</h3>
          <p className="text-xs text-slate-500 mt-0.5">Configure mensagens automáticas para seus clientes</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5" /> Novo</button>
      </div>

      <div className="card divide-y divide-slate-100">
        {!data?.length ? <EmptyState icon={Bell} title="Nenhum template" description="Templates padrão são usados automaticamente" /> : data?.map((t: Record<string,unknown>) => (
          <div key={t.id as string} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold text-slate-800">{t.event_type as string} · {t.channel as string}</p>
              <p className="text-xs text-slate-400 truncate max-w-sm">{t.subject as string || t.body as string}</p>
            </div>
            <button onClick={() => deleteMut.mutate(t.id as string)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold text-slate-900">Novo template</h3><button onClick={() => setShowForm(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Evento</label>
                  <select className="select" value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
                    {EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div><label className="label">Canal</label>
                  <select className="select" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {form.channel === 'email' && <div><label className="label">Assunto</label><input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>}
              <div><label className="label">Corpo da mensagem</label><textarea className="input" rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Use {{customer_name}}, {{appointment_date}}, etc..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => createMut.mutate(form)} disabled={!form.body}>Criar template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
