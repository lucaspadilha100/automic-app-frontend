import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, extractApiError } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Settings, RefreshCw, Users, Star, AlertTriangle, UserCheck, UserPlus, Clock, Phone, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'

type Summary = { new: number; active: number; recurring: number; inactive: number; at_risk: number; vip: number; total: number }
type LifecycleSettings = { inactive_after_days: number; at_risk_after_days: number; recurring_min_appointments: number; vip_min_appointments: number; vip_min_total_spent: number }
type Customer = {
  tenant_customer_id: string
  lifecycle_status: string
  name: string
  phone: string | null
  email: string | null
  customer_since: string | null
  last_appointment_at: string | null
  next_appointment_at: string | null
  total_spent: number
  appointments_count: number
  no_show_count: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Users }> = {
  new: { label: 'Novo', color: 'text-blue-600', bg: 'bg-blue-50', icon: UserPlus },
  active: { label: 'Ativo', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: UserCheck },
  recurring: { label: 'Recorrente', color: 'text-primary-600', bg: 'bg-primary-50', icon: RefreshCw },
  vip: { label: 'VIP', color: 'text-amber-600', bg: 'bg-amber-50', icon: Star },
  at_risk: { label: 'Em risco', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
  inactive: { label: 'Inativo', color: 'text-slate-500', bg: 'bg-slate-50', icon: Clock },
}

export default function LifecyclePage() {
  const qc = useQueryClient()
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState<Partial<LifecycleSettings>>({})

  const { data: summary, isLoading: loadingSummary } = useQuery<Summary>({
    queryKey: ['lifecycle-summary'],
    queryFn: async () => (await apiClient.get('/admin/customer-lifecycle/summary')).data,
  })

  const { data: settings } = useQuery<LifecycleSettings>({
    queryKey: ['lifecycle-settings'],
    queryFn: async () => (await apiClient.get('/admin/customer-lifecycle/settings')).data,
  })


  const { data: customers, isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ['lifecycle-customers', activeStatus],
    queryFn: async () => (await apiClient.get('/admin/customer-lifecycle/customers', {
      params: activeStatus ? { lifecycle_status: activeStatus } : {},
    })).data,
  })

  useEffect(() => { if (settings) setSettingsForm(settings) }, [settings])

  const saveSettingsMut = useMutation({
    mutationFn: () => apiClient.put('/admin/customer-lifecycle/settings', settingsForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lifecycle-settings'] })
      qc.invalidateQueries({ queryKey: ['lifecycle-summary'] })
      setShowSettings(false)
      toast.success('Configurações salvas')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (loadingSummary) return <LoadingState />

  const totalForBar = summary?.total || 1

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="CRM / Lifecycle"
        subtitle="Ciclo de vida e saúde da base de clientes"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowSettings(s => !s)}>
              <Settings className="w-4 h-4" /> Configurar
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = summary?.[key as keyof Summary] || 0
          const Icon = cfg.icon
          const isActive = activeStatus === key
          return (
            <button
              key={key}
              onClick={() => setActiveStatus(isActive ? null : key)}
              className={`card p-4 text-left transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary-400' : ''}`}>
              <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <p className={`text-xl font-black ${cfg.color}`}>{count}</p>
              <p className="text-xs text-slate-500 font-medium">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {/* Distribution bar */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">Distribuição da base ({summary?.total || 0} clientes)</p>
        <div className="flex rounded-full overflow-hidden h-3 bg-slate-100">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = summary?.[key as keyof Summary] || 0
            const pct = (count / totalForBar) * 100
            if (pct < 1) return null
            return (
              <div
                key={key}
                title={`${cfg.label}: ${count}`}
                className={cfg.bg.replace('bg-', 'bg-').replace('-50', '-400')}
                style={{ width: `${pct}%` }}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className={`w-2 h-2 rounded-full ${cfg.bg.replace('-50', '-400')}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && settings && (
        <div className="card p-6 space-y-4 border-primary-200 border">
          <h3 className="text-sm font-bold text-slate-900">Configurações de classificação</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              { key: 'inactive_after_days', label: 'Inativo após (dias sem agendamento)', min: 1 },
              { key: 'at_risk_after_days', label: 'Em risco após (dias sem agendamento)', min: 1 },
              { key: 'recurring_min_appointments', label: 'Recorrente: mín. agendamentos', min: 1 },
              { key: 'vip_min_appointments', label: 'VIP: mín. agendamentos', min: 1 },
              { key: 'vip_min_total_spent', label: 'VIP: gasto mínimo (R$)', min: 0 },
            ] as const).map(({ key, label, min }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-slate-600">{label}</label>
                <input
                  type="number"
                  min={min}
                  className="input w-full"
                  value={settingsForm[key] ?? settings[key]}
                  onChange={e => setSettingsForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowSettings(false)}>Cancelar</button>
            <button className="btn-primary" onClick={() => saveSettingsMut.mutate()} disabled={saveSettingsMut.isPending}>
              {saveSettingsMut.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Customer list */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            {activeStatus ? `Clientes — ${STATUS_CONFIG[activeStatus]?.label}` : 'Todos os clientes'}
          </h2>
          {activeStatus && (
            <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => setActiveStatus(null)}>
              Limpar filtro
            </button>
          )}
        </div>

        {loadingCustomers ? (
          <div className="p-8 flex justify-center"><LoadingState /></div>
        ) : (customers || []).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Nenhum cliente encontrado</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {(customers || []).map((c: Customer) => {
              const cfg = STATUS_CONFIG[c.lifecycle_status]
              const initials = c.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
              return (
                <Link
                  key={c.tenant_customer_id}
                  to={`/app/customers/${c.tenant_customer_id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-700">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${cfg?.bg} ${cfg?.color}`}>
                          {cfg?.label || c.lifecycle_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Phone className="w-3 h-3" />{c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                            <Mail className="w-3 h-3" />{c.email}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.appointments_count} agendamentos · R$ {Number(c.total_spent).toFixed(0)} gasto
                        {c.customer_since && ` · desde ${format(new Date(c.customer_since), 'MM/yyyy', { locale: ptBR })}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {c.no_show_count > 0 && (
                      <p className="text-[11px] text-amber-600 font-medium">{c.no_show_count} no-show</p>
                    )}
                    {c.last_appointment_at && (
                      <p className="text-xs text-slate-400">
                        Último: {format(new Date(c.last_appointment_at), 'dd/MM/yy', { locale: ptBR })}
                      </p>
                    )}
                    {c.next_appointment_at && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Próximo: {format(new Date(c.next_appointment_at), 'dd/MM', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
