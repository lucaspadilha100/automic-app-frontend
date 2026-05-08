import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Building2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { useState } from 'react'

export default function UnitsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: async () => (await apiClient.get('/units')).data,
  })

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => apiClient.post('/units', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['units'] }); setShowForm(false); toast.success('Unidade criada') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/units/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['units'] }); toast.success('Unidade removida') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <div><PageHeader title="Unidades" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Unidades" subtitle="Filiais e espaços" actions={
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Nova</button>
      } />
      <div className="table-wrap">
        {!data?.length ? <EmptyState icon={Building2} title="Nenhuma unidade" action={<button className="btn-primary" onClick={() => setShowForm(true)}>Criar unidade</button>} /> : (
          <table className="table">
            <thead className="thead"><tr>
              <th className="th">Nome</th><th className="th">Endereço</th><th className="th"></th>
            </tr></thead>
            <tbody>
              {data?.map((u: Record<string, unknown>) => (
                <tr key={u.id as string} className="tr">
                  <td className="td font-semibold">{u.name as string}</td>
                  <td className="td text-slate-500">{u.address as string || '—'}</td>
                  <td className="td">
                    <button onClick={() => deleteMut.mutate(u.id as string)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold text-slate-900">Nova unidade</h3><button onClick={() => setShowForm(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">Endereço</label><input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => createMut.mutate(form)} disabled={!form.name}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
