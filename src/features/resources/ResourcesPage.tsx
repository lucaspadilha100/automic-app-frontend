import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourcesApi } from '@/api/resources.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { Resource } from '@/types'
import { Plus, Trash2, Layers } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
export default function ResourcesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null)
  const { register, handleSubmit, reset } = useForm<{ name: string; type: string; description: string }>({ defaultValues: { type: 'room', description: '' } })
  const { data, isLoading, error } = useQuery<Resource[], Error>({ queryKey: ['resources'], queryFn: () => resourcesApi.list(), retry: false })
  const createMutation = useMutation({
    mutationFn: (d: { name: string; type: string; description: string }) => resourcesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Recurso criado'); reset(); setShowForm(false) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => resourcesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); setDeleteTarget(null); toast.success('Removido') },
  })
  const isFeatureDisabled = (error as { response?: { data?: { code?: string } } })?.response?.data?.code === 'FEATURE_DISABLED'
  const columns: Column<Resource>[] = [
    { key: 'name', header: 'Recurso', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'type', header: 'Tipo', render: (r) => <span className="badge bg-gray-100 text-gray-600">{r.type}</span> },
    { key: 'actions', header: '', render: (r) => (<button onClick={() => setDeleteTarget(r)} className="btn btn-ghost btn-sm p-1.5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>), className: 'w-16' },
  ]
  if (isFeatureDisabled) return (
    <div><PageHeader title="Recursos Físicos" /><div className="card"><EmptyState icon={Layers} title="Recurso não disponível" description="Recursos físicos nao estao habilitados no seu plano." /></div></div>
  )
  return (
    <div>
      <PageHeader title="Recursos Físicos" actions={<button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-md"><Plus className="w-4 h-4" /> Novo</button>} />
      {showForm && (
        <div className="card p-5 mb-4">
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="grid grid-cols-2 gap-3">
            <div><label className="label">Nome</label><input {...register('name', { required: true })} className="input" /></div>
            <div><label className="label">Tipo</label><select {...register('type')} className="input"><option value="room">Sala</option><option value="equipment">Equipamento</option><option value="other">Outro</option></select></div>
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-md">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="btn btn-primary btn-md">Criar</button>
            </div>
          </form>
        </div>
      )}
      <div className="card"><DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(r) => r.id} emptyTitle="Nenhum recurso" emptyIcon={Layers} /></div>
      <ConfirmDialog open={!!deleteTarget} title="Remover recurso?" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} danger loading={deleteMutation.isPending} />
    </div>
  )
}
