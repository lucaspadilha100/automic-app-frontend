import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { subDays, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react'

const PRESETS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: '1 ano', days: 365 },
]

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

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#ec4899']

type ByStatus = { status: string; count: number }
type ByProfessional = { professional_name: string; total_appointments: number; total_revenue: number }
type ByService = { service_name: string; count: number; revenue: number }
type NewCustomers = { year: number; month: number; count: number }
type OccupancyRate = { booked_minutes: number; available_minutes: number; occupancy_rate_percent: number }

export default function ReportsPage() {
  const [preset, setPreset] = useState(30)
  const dateFrom = format(subDays(new Date(), preset - 1), 'yyyy-MM-dd')
  const dateTo = format(new Date(), 'yyyy-MM-dd')
  const params = { date_from: dateFrom, date_to: dateTo }

  const { data: byStatus, isLoading: l1 } = useQuery<ByStatus[]>({
    queryKey: ['reports', 'by-status', dateFrom, dateTo],
    queryFn: async () => (await apiClient.get('/reports/appointments-by-status', { params })).data,
  })

  const { data: byProfessional, isLoading: l2 } = useQuery<ByProfessional[]>({
    queryKey: ['reports', 'by-professional', dateFrom, dateTo],
    queryFn: async () => (await apiClient.get('/reports/revenue-by-professional', { params })).data,
  })

  const { data: byService, isLoading: l3 } = useQuery<ByService[]>({
    queryKey: ['reports', 'by-service', dateFrom, dateTo],
    queryFn: async () => (await apiClient.get('/reports/revenue-by-service', { params })).data,
  })

  const { data: newCustomers } = useQuery<NewCustomers[]>({
    queryKey: ['reports', 'new-customers'],
    queryFn: async () => (await apiClient.get('/reports/new-customers-over-time')).data,
  })

  const { data: occupancy } = useQuery<OccupancyRate>({
    queryKey: ['reports', 'occupancy', dateFrom, dateTo],
    queryFn: async () => (await apiClient.get('/reports/occupancy-rate', { params: { date_from: dateFrom, date_to: dateTo } })).data,
  })

  const isLoading = l1 || l2 || l3

  // Pie chart data
  const pieData = (byStatus || [])
    .map(s => ({ name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || '#94a3b8' }))
    .filter(d => d.value > 0)

  // Professionals bar chart
  const profData = (byProfessional || [])
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 8)
    .map(p => ({ name: p.professional_name.split(' ')[0], agendamentos: p.total_appointments, receita: p.total_revenue }))

  // Services bar chart
  const serviceData = (byService || [])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map(s => ({ name: s.service_name.length > 16 ? s.service_name.slice(0, 14) + '…' : s.service_name, Qtd: s.count, Receita: s.revenue }))

  // New customers line chart (last 12 months)
  const customersData = (newCustomers || [])
    .slice(-12)
    .map(d => ({
      mes: format(new Date(d.year, d.month - 1, 1), 'MMM/yy', { locale: ptBR }),
      Clientes: d.count,
    }))

  const totalAppointments = (byStatus || []).reduce((s, r) => s + r.count, 0)
  const totalRevenue = (byProfessional || []).reduce((s, r) => s + r.total_revenue, 0)
  const totalCompleted = (byStatus || []).find(r => r.status === 'completed')?.count || 0
  const totalCustomers = (newCustomers || []).slice(-preset / 30 || 1).reduce((s, r) => s + r.count, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Relatórios"
        subtitle="Análise de desempenho do negócio"
      />

      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500">Período:</span>
        {PRESETS.map(p => (
          <button
            key={p.days}
            onClick={() => setPreset(p.days)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              preset === p.days
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {p.label}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-2">{format(new Date(dateFrom), 'dd/MM/yyyy')} → {format(new Date(dateTo), 'dd/MM/yyyy')}</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total agendamentos', value: totalAppointments, icon: BarChart3, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Concluídos', value: totalCompleted, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Receita total', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Taxa de ocupação', value: `${occupancy?.occupancy_rate_percent?.toFixed(1) || 0}%`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Appointments by status */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Agendamentos por status</h3>
            <p className="text-xs text-slate-400 mb-4">{totalAppointments} no período</p>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={11}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Qtd']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* New customers over time */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Novos clientes</h3>
            <p className="text-xs text-slate-400 mb-4">Últimos 12 meses</p>
            {customersData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={customersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Clientes" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by professional */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Receita por profissional</h3>
            <p className="text-xs text-slate-400 mb-4">Agendamentos concluídos</p>
            {profData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={profData} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip formatter={(v: number, name: string) => [
                    name === 'receita' ? `R$ ${v.toLocaleString('pt-BR')}` : v,
                    name === 'receita' ? 'Receita' : 'Agend.',
                  ]} />
                  <Bar dataKey="receita" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by service */}
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Serviços mais realizados</h3>
            <p className="text-xs text-slate-400 mb-4">Agendamentos concluídos</p>
            {serviceData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={serviceData} barSize={16}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip formatter={(v: number, name: string) => [
                    name === 'Receita' ? `R$ ${v.toLocaleString('pt-BR')}` : v,
                    name,
                  ]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Qtd" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
