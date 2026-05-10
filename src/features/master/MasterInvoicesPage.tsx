import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { FileText, Play, CheckCircle, Zap, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { useState } from 'react'

export default function MasterInvoicesPage() {
  const [sp] = useSearchParams()
  const tenantId = sp.get('tenant_id') || undefined
  const qc = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['master','invoices', tenantId, filterStatus],
    queryFn: () => masterApi.listInvoices({ tenant_id: tenantId, status: filterStatus || undefined }),
  })

  const generateMut = useMutation({
    mutationFn: () => masterApi.runJob('generate-monthly-invoices'),
    onSuccess: (d: {created_count:number}) => { qc.invalidateQueries({ queryKey: ['master','invoices'] }); toast.success(`${d.created_count} fatura(s) gerada(s)`) },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const markPaidMut = useMutation({
    mutationFn: ({ id }: { id: string }) => masterApi.markInvoicePaid(id, { payment_method: 'manual', payment_provider: 'manual' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','invoices'] }); toast.success('Fatura marcada como paga') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const chargeMut = useMutation({
    mutationFn: ({ id }: { id: string }) => masterApi.chargeInvoice(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','invoices'] }); toast.success('Cobrança enviada') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const cancelMut = useMutation({
    mutationFn: ({ id }: { id: string }) => masterApi.cancelInvoice(id, 'Cancelado pelo admin'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','invoices'] }); toast.success('Fatura cancelada') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <div><PageHeader title="Faturas" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Faturas"
        subtitle={`${invoices?.length || 0} faturas`}
        actions={
          <button className="btn-secondary" onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>
            <Play className="w-4 h-4" /> Gerar faturas do mês
          </button>
        }
      />

      <div className="flex gap-2">
        {['','pending','paid','overdue','cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterStatus === s ? 'bg-primary-400 text-slate-900 border-primary-400' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
            {s || 'Todos'}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        {!invoices?.length ? <EmptyState icon={FileText} title="Nenhuma fatura" description="Gere as faturas do mês ou aguarde o próximo ciclo" /> : (
          <table className="table">
            <thead className="thead"><tr>
              <th className="th">Período</th>
              <th className="th">Plano</th>
              <th className="th">Valor</th>
              <th className="th">Vencimento</th>
              <th className="th">Status</th>
              <th className="th">Ações</th>
            </tr></thead>
            <tbody>
              {invoices?.map((inv: Record<string,unknown>) => (
                <tr key={inv.id as string} className="tr">
                  <td className="td text-xs">{String(inv.period_start).slice(0,7)}</td>
                  <td className="td text-xs">{inv.plan_name_snapshot as string}</td>
                  <td className="td font-semibold">R$ {Number(inv.amount).toFixed(2)}</td>
                  <td className="td text-xs text-slate-400">{new Date(inv.due_date as string).toLocaleDateString('pt-BR')}</td>
                  <td className="td"><StatusBadge status={inv.status as string} /></td>
                  <td className="td">
                    <div className="flex gap-1">
                      {(inv.status === 'pending' || inv.status === 'overdue') && (
                        <>
                          <button className="btn-ghost btn-sm gap-1" title="Cobrar automaticamente"
                            onClick={() => chargeMut.mutate({ id: inv.id as string })}
                            disabled={chargeMut.isPending}>
                            <Zap className="w-3.5 h-3.5" /> Cobrar
                          </button>
                          <button className="btn-ghost btn-sm gap-1" title="Marcar como paga manualmente"
                            onClick={() => markPaidMut.mutate({ id: inv.id as string })}
                            disabled={markPaidMut.isPending}>
                            <CheckCircle className="w-3.5 h-3.5" /> Paga
                          </button>
                          <button className="btn-ghost btn-sm gap-1 text-red-500" title="Cancelar fatura"
                            onClick={() => cancelMut.mutate({ id: inv.id as string })}
                            disabled={cancelMut.isPending}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
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
