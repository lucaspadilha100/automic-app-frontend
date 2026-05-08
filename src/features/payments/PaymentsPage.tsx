
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/api/payments.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CreditCard } from 'lucide-react'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro', pix: 'PIX', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', other: 'Outro',
}

export default function PaymentsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['payment-summary', dateFrom, dateTo],
    queryFn: () => paymentsApi.getSummary({ date_from: dateFrom || undefined, date_to: dateTo || undefined }),
  })
  const totalRevenue = data?.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.total, 0) || 0
  if (isLoading) return <LoadingState />
  return (
    <div>
      <PageHeader title="Pagamentos" />
      <div className="flex gap-3 mb-6">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input max-w-40 py-1.5 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input max-w-40 py-1.5 text-sm" />
      </div>
      <div className="card mb-6 p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Receita confirmada</p>
        <p className="text-3xl font-semibold text-slate-900 font-display">R$ {totalRevenue.toFixed(2)}</p>
      </div>
      <div className="card">
        {data && data.length > 0 ? (
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Método</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qtd</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium">{METHOD_LABELS[row.payment_method] || row.payment_method}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.count}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">R$ {row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState icon={CreditCard} title="Nenhum pagamento no período" />}
      </div>
    </div>
  )
}
