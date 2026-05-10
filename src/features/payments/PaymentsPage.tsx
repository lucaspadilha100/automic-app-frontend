import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/api/payments.api'
import type { PaymentDetail } from '@/api/payments.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { format, subDays, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditCard, TrendingUp, ChevronLeft, ChevronRight, Banknote, Smartphone, Receipt, User, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const METHOD_LABELS: Record<string, string> = {
  pix_manual: 'PIX',
  pix_gateway: 'PIX (gateway)',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  other: 'Outro',
  none: '—',
}

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  pix_manual: Smartphone,
  pix_gateway: Smartphone,
  credit_card: CreditCard,
  debit_card: CreditCard,
  cash: Banknote,
  other: Receipt,
}

const ROLE_LABELS: Record<string, string> = {
  tenant_owner: 'Proprietário',
  manager: 'Gerente',
  receptionist: 'Recepcionista',
  professional: 'Profissional',
  super_admin: 'Admin',
}

const METHOD_COLORS: Record<string, string> = {
  pix_manual: 'bg-emerald-100 text-emerald-700',
  pix_gateway: 'bg-emerald-100 text-emerald-700',
  credit_card: 'bg-blue-100 text-blue-700',
  debit_card: 'bg-indigo-100 text-indigo-700',
  cash: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
}

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function PaymentsPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments-all', selectedDate],
    queryFn: () => paymentsApi.listAll({ date: selectedDate }),
  })

  const { data: summary } = useQuery({
    queryKey: ['payment-summary-detail', selectedDate],
    queryFn: () => paymentsApi.getSummary({ date_from: selectedDate, date_to: selectedDate }),
  })

  const paid = (payments || []).filter(p => p.status === 'paid')
  const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0)
  const ticketMedio = paid.length > 0 ? totalPaid / paid.length : 0

  const byMethod = paid.reduce<Record<string, number>>((acc, p) => {
    const key = p.payment_method || 'none'
    acc[key] = (acc[key] || 0) + p.amount
    return acc
  }, {})

  const isCurrentDay = selectedDate === todayStr()

  function prevDay() {
    const d = new Date(selectedDate + 'T12:00:00')
    setSelectedDate(format(subDays(d, 1), 'yyyy-MM-dd'))
  }
  function nextDay() {
    const d = new Date(selectedDate + 'T12:00:00')
    const next = format(new Date(d.getTime() + 86400000), 'yyyy-MM-dd')
    if (next <= todayStr()) setSelectedDate(next)
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Pagamentos" />

      {/* Date navigator */}
      <div className="flex items-center gap-3">
        <button onClick={prevDay} className="btn-ghost btn-icon p-2 rounded-lg border border-slate-200">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={e => e.target.value && setSelectedDate(e.target.value)}
            className="input py-1.5 text-sm font-medium max-w-[160px]"
          />
          {isCurrentDay && (
            <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">Hoje</span>
          )}
        </div>
        <button onClick={nextDay} disabled={isCurrentDay} className="btn-ghost btn-icon p-2 rounded-lg border border-slate-200 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
        <span className="text-sm text-slate-500 ml-1">
          {format(new Date(selectedDate + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-slate-500 font-medium">Total recebido</p>
          </div>
          <p className="text-2xl font-black text-slate-900">R$ {totalPaid.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">{paid.length} pagamento{paid.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-slate-500 font-medium">Ticket médio</p>
          </div>
          <p className="text-2xl font-black text-slate-900">R$ {ticketMedio.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">por pagamento</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium mb-2">Por método</p>
          {Object.entries(byMethod).length === 0 ? (
            <p className="text-xs text-slate-400">—</p>
          ) : (
            <div className="space-y-1">
              {Object.entries(byMethod).map(([method, total]) => (
                <div key={method} className="flex justify-between items-center text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${METHOD_COLORS[method] || 'bg-slate-100 text-slate-600'}`}>
                    {METHOD_LABELS[method] || method}
                  </span>
                  <span className="font-semibold text-slate-700">R$ {total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payments list */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Transações do dia</h2>
        </div>

        {paid.length === 0 ? (
          <EmptyState icon={CreditCard} title="Nenhum pagamento neste dia" description="Selecione outra data ou registre um novo pagamento" />
        ) : (
          <div className="divide-y divide-slate-50">
            {paid.map((p: PaymentDetail) => {
              const Icon = METHOD_ICONS[p.payment_method] || Receipt
              const paidAt = p.paid_at ? parseISO(p.paid_at) : null
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {/* Method icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${METHOD_COLORS[p.payment_method] || 'bg-slate-100'}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">
                        {p.customer_name || 'Cliente não identificado'}
                      </p>
                      {p.service_name && (
                        <span className="text-xs text-slate-400 truncate">{p.service_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[p.payment_method] || 'bg-slate-100 text-slate-600'}`}>
                        {METHOD_LABELS[p.payment_method] || p.payment_method}
                      </span>
                      {paidAt && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {format(paidAt, 'HH:mm')}
                        </span>
                      )}
                      {p.registered_by_name && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <User className="w-3 h-3" />
                          {p.registered_by_name}
                          {p.registered_by_role && (
                            <span className="text-slate-300">· {ROLE_LABELS[p.registered_by_role] || p.registered_by_role}</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount + link */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-slate-900">R$ {p.amount.toFixed(2)}</p>
                    <Link to={`/app/appointments/${p.appointment_id}`}
                      className="text-xs text-primary-600 hover:underline">
                      Ver agendamento
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
