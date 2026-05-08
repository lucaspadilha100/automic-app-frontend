import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { professionalsApi } from '@/api/professionals.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Professional } from '@/types'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfessionalsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<Professional | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['professionals'], queryFn: () => professionalsApi.list({ active_only: false }) })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => professionalsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professionals'] }); toast.success('Profissional removido'); setDeleteTarget(null) },
  })

  const columns: Column<Professional>[] = [
    { key: 'name', header: 'Profissional', render: (p) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          {p.photo_url ? <img src={p.photo_url} className="w-8 h-8 rounded-full object-cover" /> : <span className="text-xs font-semibold text-primary-700">{p.name[0]}</span>}
        </div>
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          {p.email && <p className="text-xs text-gray-500">{p.email}</p>}
        </div>
      </div>
    )},
    { key: 'phone', header: 'Telefone', render: (p) => <span className="text-gray-600">{p.phone || '—'}</span> },
    { key: 'status', header: 'Status', render: (p) => (
      <span className={`badge ${p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {p.is_active ? 'Ativo' : 'Inativo'}
      </span>
    )},
    { key: 'actions', header: '', render: (p) => (
      <div className="flex items-center gap-1 justify-end">
        <Link to={`/app/professionals/${p.id}`} className="btn btn-ghost btn-sm p-1.5 rounded-lg"><Edit className="w-3.5 h-3.5" /></Link>
        <button onClick={() => setDeleteTarget(p)} className="btn btn-ghost btn-sm p-1.5 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    ), className: 'w-24'},
  ]

  return (
    <div>
      <PageHeader title="Profissionais" actions={
        <button onClick={() => navigate('/app/professionals/new')} className="btn btn-primary btn-md"><Plus className="w-4 h-4" /> Novo profissional</button>
      } />
      <div className="card">
        <DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(p) => p.id}
          emptyTitle="Nenhum profissional cadastrado" emptyIcon={UserCheck} />
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Remover profissional"
        description={`Remover "${deleteTarget?.name}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)} danger loading={deleteMutation.isPending} />
    </div>
  )
}
