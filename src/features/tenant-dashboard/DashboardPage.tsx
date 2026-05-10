import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { MetricCard } from '@/components/cards/MetricCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Calendar, Users, TrendingUp, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#6366f1',
  confirmed: '#10b981',
  completed: '#0ea5e9',
  cancelled: '#f43f5e',
  no_show: '#f59e0b',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'No-show',
}

export default function DashboardPage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await apiClient.get('/dashboard')).data,
  })

  const dateFrom = format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const dateTo = format(new Date(), 'yyyy-MM-dd')

  const { data: byStatus } = useQuery({
    queryKey: ['reports', 'by-status', dateFrom, dateTo],
    queryFn: async () => (await apiClient.get('/reports/appointments-by-status', { params: { date_from: dateFrom, date_to: dateTo } })).data,
  })

  const { data: newCustomers } = useQuery({
    queryKey: ['reports', 'new-customers'],
    queryFn: async () => (await apiClient.get('/reports/new-customers-over-time')).data,
  })

  if (isLoading) return <LoadingState />

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  const pieData = (byStatus || []).map((s: { status: string; count: number }) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8',
  })).filter((d: { value: number }) => d.value > 0)

  const customersChartData = (newCustomers || []).slice(-14).map((d: { year: number; month: number; count: number }) => ({
    date: format(new Date(d.year, d.month - 1, 1), 'MM/yyyy'),
    Clientes: d.count,
  }))

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
            ) : (dash?.todays_appointments || []).slice(0, 8).map((a: Record<string, unknown>) => (
              <Link to={`/app/appointments/${a.id}`} key={a.id as string}
                className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.customer_name as string || 'Cliente'}</p>
                  <p className="text-xs text-slate-400">
                    {a.start_datetime ? format(new Date(a.start_datetime as string), 'HH:mm') : '--:--'} · {(a.appointment_services as { service_name_snapshot: string }[])?.[0]?.service_name_snapshot}
                  </p>
                </div>
                <StatusBadge status={a.status as string} />
              </Link>
            ))}
          </div>
        </div>

        {/* Status pie chart */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Agendamentos por status</h2>
          <p className="text-xs text-slate-400 mb-4">Últimos 30 dias</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">Sem dados no período</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((entry: { color: string }, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Qtd']} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Taxa de ocupação', value: `${(dash?.occupancy_rate || 0).toFixed(0)}%`, color: 'text-primary-600' },
              { label: 'Confirmados', value: dash?.confirmed_count || 0, color: 'text-emerald-600' },
              { label: 'Cancelados', value: dash?.cancelled_count || 0, color: 'text-red-500' },
              { label: 'No-show', value: dash?.no_show_count || 0, color: 'text-amber-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className={`text-lg font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New customers chart */}
      {customersChartData.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Novos clientes</h2>
              <p className="text-xs text-slate-400">Últimos 14 dias</p>
            </div>
            <Link to="/app/customers" className="text-xs text-primary-600 hover:underline font-medium">Ver todos</Link>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={customersChartData} barSize={20}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v: number) => [v, 'Novos clientes']} />
              <Bar dataKey="Clientes" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex gap-2">
        <Link to="/app/calendar" className="btn-secondary text-xs">Ver agenda completa</Link>
        <Link to="/app/appointments" className="btn-ghost text-xs">Todos os agendamentos</Link>
        <Link to="/app/lifecycle" className="btn-ghost text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> CRM / Lifecycle</Link>
      </div>
    </div>
  )
}
