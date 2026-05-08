
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { packagesApi } from '@/api/packages.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Package } from '@/types'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PackagesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['packages'], queryFn: () => packagesApi.list() })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => packagesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success('Removido'); setDeleteTarget(null) },
  })
  const columns: Column<Package>[] = [
    { key: 'name', header: 'Pacote', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'sessions', header: 'Sessões', render: (p) => <span>{p.total_sessions} sessões</span> },
    { key: 'price', header: 'Preço', render: (p) => <span className="font-medium">R$ {Number(p.price).toFixed(2)}</span> },
    { key: 'validity', header: 'Validade', render: (p) => <span className="text-gray-500">{p.validity_days ? `${p.validity_days} dias` : '—'}</span> },
    { key: 'status', header: 'Status', render: (p) => <span className={`badge ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.is_active ? 'Ativo' : 'Inativo'}</span> },
    { key: 'actions', header: '', render: (p) => (
      <div className="flex gap-1 justify-end">
        <Link to={`/app/packages/${p.id}`} className="btn btn-ghost btn-sm p-1.5 rounded-lg"><Edit className="w-3.5 h-3.5" /></Link>
        <button onClick={() => setDeleteTarget(p)} className="btn btn-ghost btn-sm p-1.5 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    ), className: 'w-24'},
  ]
  return (
    <div>
      <PageHeader title="Pacotes" actions={<button onClick={() => navigate('/app/packages/new')} className="btn btn-primary btn-md"><Plus className="w-4 h-4" /> Novo pacote</button>} />
      <div className="card">
        <DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(p) => p.id} emptyTitle="Nenhum pacote" />
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Remover pacote?" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} danger loading={deleteMutation.isPending} />
    </div>
  )
}
