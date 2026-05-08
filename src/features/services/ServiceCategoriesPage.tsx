
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/api/services.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { ServiceCategory } from '@/types'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function ServiceCategoriesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ServiceCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceCategory | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<{ name: string; description: string; sort_order: number }>({ defaultValues: { sort_order: 0 } })
  const { data, isLoading } = useQuery({ queryKey: ['service-categories'], queryFn: () => servicesApi.listCategories() })

  const saveMutation = useMutation({
    mutationFn: (d: { name: string; description: string; sort_order: number }) =>
      editTarget ? servicesApi.updateCategory(editTarget.id, d) : servicesApi.createCategory(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service-categories'] }); toast.success(editTarget ? 'Atualizado' : 'Criado'); reset(); setShowForm(false); setEditTarget(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['service-categories'] }); toast.success('Removido'); setDeleteTarget(null) },
  })

  const handleEdit = (cat: ServiceCategory) => {
    setEditTarget(cat)
    setValue('name', cat.name)
    setValue('description', cat.description || '')
    setValue('sort_order', cat.sort_order)
    setShowForm(true)
  }

  const columns: Column<ServiceCategory>[] = [
    { key: 'name', header: 'Categoria', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'desc', header: 'Descrição', render: (c) => <span className="text-gray-500 text-sm">{c.description || '—'}</span> },
    { key: 'order', header: 'Ordem', render: (c) => <span className="text-gray-500">{c.sort_order}</span> },
    { key: 'actions', header: '', render: (c) => (
      <div className="flex gap-1 justify-end">
        <button onClick={() => handleEdit(c)} className="btn btn-ghost btn-sm p-1.5 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteTarget(c)} className="btn btn-ghost btn-sm p-1.5 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    ), className: 'w-24'},
  ]

  return (
    <div>
      <PageHeader title="Categorias de serviço" actions={
        <button onClick={() => { setEditTarget(null); reset(); setShowForm(!showForm) }} className="btn btn-primary btn-md"><Plus className="w-4 h-4" /> Nova categoria</button>
      } />
      {showForm && (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{editTarget ? 'Editar categoria' : 'Nova categoria'}</h3>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-2 gap-3">
            <div><label className="label">Nome</label><input {...register('name', { required: true })} className="input" /></div>
            <div><label className="label">Ordem</label><input {...register('sort_order', { valueAsNumber: true })} type="number" className="input" /></div>
            <div className="col-span-2"><label className="label">Descrição</label><input {...register('description')} className="input" /></div>
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditTarget(null); reset() }} className="btn btn-secondary btn-md">Cancelar</button>
              <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary btn-md">{saveMutation.isPending ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(c) => c.id} emptyTitle="Nenhuma categoria" />
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Remover "${deleteTarget?.name}"?`} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} danger loading={deleteMutation.isPending} />
    </div>
  )
}
