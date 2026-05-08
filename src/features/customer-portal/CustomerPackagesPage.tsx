import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { customerPortalApi } from '@/api/customerPortal.api'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Package, ChevronLeft } from 'lucide-react'

export default function CustomerPackagesPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: packages, isLoading } = useQuery({
    queryKey: ['customer-packages', slug],
    queryFn: () => customerPortalApi.getPackages(slug!),
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link to={`/${slug}`} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-slate-900">Meus pacotes</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-3">
        {!packages?.length ? (
          <EmptyState icon={Package} title="Nenhum pacote" description="Você ainda não adquiriu nenhum pacote" action={<Link to={`/${slug}`} className="btn-primary">Ver serviços</Link>} />
        ) : packages.map((pkg: Record<string,unknown>) => {
          const used = Number(pkg.sessions_used || 0)
          const total = Number(pkg.sessions_total || pkg.total_sessions || 0)
          const pct = total > 0 ? (used / total) * 100 : 0
          return (
            <div key={pkg.id as string} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{pkg.package_name as string || pkg.name as string}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{used} de {total} sessões usadas</p>
                </div>
                <StatusBadge status={pkg.status as string} />
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-primary-400 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{used} usadas</span>
                <span>{total - used} restantes</span>
              </div>
              {pkg.expires_at && (
                <p className="text-xs text-slate-400 mt-2">Válido até {new Date(pkg.expires_at as string).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
