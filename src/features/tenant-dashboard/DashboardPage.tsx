import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/cards/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Calendar, Users, TrendingUp, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await apiClient.get('/dashboard')).data,
  })

  if (isLoading) return <LoadingState />

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={today}
        actions={<Link to="/app/appointments/new" className="btn-primary">+ Novo agendamento</Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <MetricCard title="Agendamentos hoje" value={dash?.appointments_today || 0} icon={Calendar} color="cyan" />
        <MetricCard title="Agend. semana" value={dash?.appointments_this_week || 0} icon={Calendar} color="blue" />
        <MetricCard title="Total clientes" value={dash?.total_customers || 0} icon={Users} color="violet" />
        <MetricCard title="Receita mês" value={`R$ ${(dash?.revenue_this_month || 0).toFixed(0)}`} icon={CreditCard} color="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Agenda de hoje</h2>
            <Link to="/app/calendar" className="text-xs text-primary-600 hover:underline font-medium">Ver agenda</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(dash?.todays_appointments || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Nenhum agendamento hoje</p>
            ) : (dash?.todays_appointments || []).slice(0, 8).map((a: Record<string,unknown>) => (
              <Link to={`/app/appointments/${a.id}`} key={a.id as string}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.customer_name as string || 'Cliente'}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(a.start_datetime as string), 'HH:mm')} · {(a.appointment_services as {service_name_snapshot:string}[])?.[0]?.service_name_snapshot}
                  </p>
                </div>
                <StatusBadge status={a.status as string} />
              </Link>
            ))}
          </div>
        </div>

        {/* Revenue chart placeholder */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Taxa de ocupação', value: `${(dash?.occupancy_rate || 0).toFixed(0)}%`, color: 'text-primary-600' },
              { label: 'Confirmados', value: dash?.confirmed_count || 0, color: 'text-emerald-600' },
              { label: 'Cancelados', value: dash?.cancelled_count || 0, color: 'text-red-500' },
              { label: 'No-show', value: dash?.no_show_count || 0, color: 'text-amber-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/app/calendar" className="btn-secondary flex-1 justify-center text-xs">Ver agenda</Link>
            <Link to="/app/appointments" className="btn-ghost flex-1 justify-center text-xs">Agendamentos</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
