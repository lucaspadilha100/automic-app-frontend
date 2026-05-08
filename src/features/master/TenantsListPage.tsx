import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Building2, ChevronRight, MoreVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const STATUS_OPTS = ['', 'trial', 'active', 'suspended', 'cancelled']

export default function TenantsListPage() {
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['master','tenants', filterStatus],
    queryFn: () => masterApi.listTenants(filterStatus ? { status: filterStatus } : undefined),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => masterApi.updateTenantStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','tenants'] }); toast.success('Status atualizado') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isLoading) return (
    <div>
      <PageHeader title="Empresas" subtitle="Todos os tenants ativos na plataforma" actions={<Link to="/master/tenants/new" className="btn-primary">+ Nova</Link>} />
      <SkeletonTable />
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Empresas"
        subtitle={`${tenants?.length || 0} tenants`}
        actions={<Link to="/master/tenants/new" className="btn-primary">+ Nova empresa</Link>}
      />

      <div className="flex gap-2">
        {STATUS_OPTS.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterStatus === s ? 'bg-primary-400 text-slate-900 border-primary-400' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {s || 'Todos'}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        {!tenants?.length ? <EmptyState icon={Building2} title="Nenhuma empresa encontrada" /> : (
          <table className="table">
            <thead className="thead">
              <tr>
                <th className="th">Empresa</th>
                <th className="th">Slug</th>
                <th className="th">Status</th>
                <th className="th">Billing</th>
                <th className="th">Criado</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {tenants?.map((t: Record<string, unknown>) => (
                <tr key={t.id as string} className="tr">
                  <td className="td font-semibold text-slate-900">{t.name as string}</td>
                  <td className="td text-slate-500 font-mono text-xs">{t.slug as string}</td>
                  <td className="td"><StatusBadge status={t.status as string} /></td>
                  <td className="td">
                    <select
                      value=""
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white cursor-pointer"
                      onChange={e => {
                        if (e.target.value) statusMut.mutate({ id: t.id as string, status: e.target.value })
                      }}>
                      <option value="">Mudar...</option>
                      {['trial','active','suspended','cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="td text-slate-400 text-xs">{new Date(t.created_at as string).toLocaleDateString('pt-BR')}</td>
                  <td className="td">
                    <Link to={`/master/tenants/${t.id}`} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium">
                      Detalhes <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
