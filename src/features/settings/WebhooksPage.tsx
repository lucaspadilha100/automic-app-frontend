import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Link2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function WebhooksPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ url: '', events: [] as string[], is_active: true })

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => (await apiClient.get('/settings/webhooks')).data,
  })

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiClient.post('/settings/webhooks', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); setShowForm(false); toast.success('Webhook criado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/settings/webhooks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); toast.success('Webhook removido') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <SkeletonTable />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Webhooks de saída</h3>
          <p className="text-xs text-slate-500 mt-0.5">Receba notificações de eventos no seu sistema</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5" /> Novo</button>
      </div>

      <div className="card divide-y divide-slate-100">
        {!data?.length ? <EmptyState icon={Link2} title="Nenhum webhook" description="Configure endpoints para receber eventos" /> : data?.map((w: Record<string,unknown>) => (
          <div key={w.id as string} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-mono text-slate-700 truncate max-w-sm">{w.url as string}</p>
              <p className="text-xs text-slate-400">{(w.events as string[])?.join(', ') || 'Todos eventos'}</p>
            </div>
            <button onClick={() => deleteMut.mutate(w.id as string)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold text-slate-900">Novo webhook</h3><button onClick={() => setShowForm(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">URL</label><input className="input" type="url" placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => createMut.mutate(form)} disabled={!form.url}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
