import { useQuery } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { DataTable, Column } from '@/components/tables/DataTable'
import type { Plan } from '@/types'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit } from 'lucide-react'

export default function PlansListPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['master', 'plans'], queryFn: () => masterApi.listPlans() })

  const columns: Column<Plan>[] = [
    { key: 'name', header: 'Plano', render: (p) => <span className="font-medium text-slate-900">{p.name}</span> },
    { key: 'price', header: 'Preço/mês', render: (p) => <span className="text-indigo-300">R$ {p.price_monthly.toFixed(2)}</span> },
    { key: 'limits', header: 'Limites', render: (p) => (
      <span className="text-xs text-gray-400">{p.max_services ?? '∞'} svcs · {p.max_professionals ?? '∞'} profs</span>
    )},
    { key: 'features', header: 'Features', render: (p) => (
      <div className="flex gap-1 flex-wrap">
        {p.allow_packages && <span className="badge bg-indigo-900 text-indigo-300">Pacotes</span>}
        {p.allow_online_payment && <span className="badge bg-indigo-900 text-indigo-300">Pagamento</span>}
      </div>
    )},
    { key: 'actions', header: '', render: (p) => (
      <Link to={`/master/plans/${p.id}`} className="btn btn-ghost btn-sm"><Edit className="w-3.5 h-3.5" /></Link>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Planos"
        subtitle="Configure os planos e suas limitações"
        actions={<button onClick={() => navigate('/master/plans/new')} className="btn btn-primary btn-md"><Plus className="w-4 h-4" /> Novo plano</button>}
      />
      <div className="card bg-white border-slate-200">
        <DataTable columns={columns} data={data || []} isLoading={isLoading} keyExtractor={(p) => p.id} emptyTitle="Nenhum plano criado" />
      </div>
    </div>
  )
}
