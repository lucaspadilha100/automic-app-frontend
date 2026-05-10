import { useQuery } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/cards/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Building2, CreditCard, TrendingUp, Users, Activity, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MasterDashboard() {
  const { data: tenants, isLoading } = useQuery({ queryKey: ['master','tenants'], queryFn: () => masterApi.listTenants() })
  const { data: plans } = useQuery({ queryKey: ['master','plans'], queryFn: () => masterApi.listPlans() })
  const { data: health } = useQuery({ queryKey: ['master','health'], queryFn: () => masterApi.getTenantsHealth() })
  const { data: tasks } = useQuery({ queryKey: ['master','tasks'], queryFn: () => masterApi.listTaskRuns({ limit: 5 }) })
  const { data: mrr } = useQuery({ queryKey: ['master','mrr'], queryFn: () => masterApi.getMrr() })

  if (isLoading) return <LoadingState />

  const counts = tenants?.reduce((acc: Record<string,number>, t: {status:string}) => {
    acc[t.status] = (acc[t.status] || 0) + 1; return acc
  }, {}) || {}

  const atRisk = (health as {churn_risk:string}[] | undefined)?.filter(h => h.churn_risk === 'critical' || h.churn_risk === 'high').length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Console Master"
        subtitle="Visão geral da plataforma AUTOMIC"
        actions={<Link to="/master/tenants/new" className="btn-primary">+ Nova empresa</Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger">
        <MetricCard title="Empresas" value={tenants?.length || 0} icon={Building2} color="cyan" />
        <MetricCard title="Ativas" value={counts['active'] || 0} icon={TrendingUp} color="green" />
        <MetricCard title="Em trial" value={counts['trial'] || 0} icon={Users} color="violet" />
        <MetricCard title="Em risco" value={atRisk} icon={AlertTriangle} color="orange" />
        <MetricCard title="MRR" value={`R$ ${(mrr?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tenants recentes */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Empresas</h2>
            <Link to="/master/tenants" className="text-xs text-primary-600 hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {tenants?.slice(0,8).map((t: {id:string;name:string;slug:string;status:string;created_at:string}) => (
              <Link to={`/master/tenants/${t.id}`} key={t.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.slug}</p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Tasks recentes */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Jobs recentes</h2>
            <Link to="/master/tasks" className="text-xs text-primary-600 hover:underline font-medium">Ver todos</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {tasks?.items?.map((t: {id:string;task_name:string;status:string;duration_ms:number}) => (
              <div key={t.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-700 truncate">{t.task_name}</p>
                  <StatusBadge status={t.status} />
                </div>
                {t.duration_ms && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{t.duration_ms}ms</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
