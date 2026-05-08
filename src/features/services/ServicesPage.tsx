import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/api/services.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Service } from '@/types'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ServicesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.list({ active_only: false }) })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast.success('Serviço removido'); setDeleteTarget(null) },
  })

  const columns: Column<Service>[] = [
    { key: 'name', header: 'Serviço', render: (s) => (
      <div>
        <p className="font-medium text-gray-900">{s.name}</p>
        {s.description && <p className="text-xs text-gray-500 truncate max-w-48">{s.description}</p>}
      </div>
    )},
    { key: 'duration', header: 'Duração', render: (s) => <span className="text-gray-600">{s.duration_minutes} min</span> },
    { key: 'price', header: 'Preço', render: (s) => <span className="font-medium">R$ {Number(s.price).toFixed(2)}</span> },
    { key: 'status', header: 'Status', render: (s) => (
      <span className={`badge ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {s.is_active ? 'Ativo' : 'Inativo'}
      </span>
    )},
    { key: 'actions', header: '', render: (s) => (
      <div className="flex items-center gap-1 justify-end">
        <Link to={`/app/services/${s.id}/edit`} className="btn btn-ghost btn-sm p-1.5 rounded-lg"><Edit className="w-3.5 h-3.5" /></Link>
        <button onClick={() => setDeleteTarget(s)} className="btn btn-ghost btn-sm p-1.5 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    ), className: 'w-24'},
  ]

  return (
    <div>
      <PageHeader
        title="Serviços"
        actions={
          <div className="flex gap-2">
            <Link to="/app/service-categories" className="btn btn-secondary btn-md">Categorias</Link>
            <button onClick={() => navigate('/app/services/new')} className="btn btn-primary btn-md"><Plus className="w-4 h-4" /> Novo serviço</button>
          </div>
        }
      />
      <div className="card">
        <DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(s) => s.id}
          emptyTitle="Nenhum serviço cadastrado" emptyDescription="Adicione serviços para começar a receber agendamentos" emptyIcon={Briefcase} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remover serviço"
        description={`Tem certeza que deseja remover "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
