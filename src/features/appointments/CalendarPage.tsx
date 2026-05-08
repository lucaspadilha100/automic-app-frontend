import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { appointmentsApi } from '@/api/appointments.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  in_progress: 'bg-violet-100 text-violet-800 border-violet-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
  no_show: 'bg-orange-100 text-orange-700 border-orange-200',
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const dateFrom = format(weekStart, 'yyyy-MM-dd')
  const dateTo = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['appointments-calendar', dateFrom, dateTo],
    queryFn: () => appointmentsApi.list({ date_from: dateFrom, date_to: dateTo, limit: 200 }),
  })

  const getAppsForDay = (day: Date) =>
    (data || []).filter((a: {start_datetime: string}) => isSameDay(new Date(a.start_datetime), day))

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Agenda"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              <button onClick={() => setCurrentDate(d => subWeeks(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm font-semibold text-slate-700 px-2 min-w-48 text-center">
                {format(weekStart, "dd/MM", { locale: ptBR })} – {format(addDays(weekStart, 6), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentDate(d => addWeeks(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="btn-secondary btn-sm">Hoje</button>
            <Link to="/app/appointments/new" className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Novo
            </Link>
          </div>
        }
      />

      <div className="card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()} className={`px-2 py-3 text-center border-r border-slate-200 last:border-0 ${isToday ? 'bg-primary-50' : ''}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{format(day, 'EEE', { locale: ptBR })}</p>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 ${isToday ? 'bg-primary-400' : ''}`}>
                  <p className={`text-sm font-bold ${isToday ? 'text-slate-900' : 'text-slate-700'}`}>{format(day, 'd')}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 min-h-80">
          {weekDays.map(day => {
            const apps = getAppsForDay(day)
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toISOString()}
                className={`border-r border-slate-100 last:border-0 min-h-32 p-1.5 ${isToday ? 'bg-primary-50/40' : 'hover:bg-slate-50/60'} transition-colors cursor-pointer group`}
                onClick={() => navigate(`/app/appointments/new`)}>
                <div className="space-y-1">
                  {apps.map((a: Record<string,unknown>) => (
                    <Link key={a.id as string}
                      to={`/app/appointments/${a.id}`}
                      onClick={e => e.stopPropagation()}
                      className={`block p-1.5 rounded-lg border text-left hover:shadow-sm transition-all ${STATUS_COLORS[a.status as string] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      <p className="text-[10px] font-bold leading-tight">
                        {format(new Date(a.start_datetime as string), 'HH:mm')}
                      </p>
                      <p className="text-[10px] truncate leading-tight mt-0.5">
                        {(a.appointment_services as {service_name_snapshot:string}[])?.[0]?.service_name_snapshot || 'Agend.'}
                      </p>
                      {a.customer_name && (
                        <p className="text-[10px] truncate opacity-70">{a.customer_name as string}</p>
                      )}
                    </Link>
                  ))}
                  {apps.length === 0 && (
                    <div className="invisible group-hover:visible flex items-center justify-center h-8 text-[10px] text-slate-400">
                      <Plus className="w-3 h-3 mr-0.5" /> Novo
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: list view */}
      <div className="sm:hidden space-y-2">
        {weekDays.map(day => {
          const apps = getAppsForDay(day)
          if (!apps.length) return null
          return (
            <div key={day.toISOString()} className="card overflow-hidden">
              <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wide ${isSameDay(day, new Date()) ? 'bg-primary-400 text-slate-900' : 'bg-slate-50 text-slate-500'}`}>
                {format(day, "EEEE, dd/MM", { locale: ptBR })}
              </div>
              {apps.map((a: Record<string,unknown>) => (
                <Link key={a.id as string} to={`/app/appointments/${a.id}`}
                  className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {format(new Date(a.start_datetime as string), 'HH:mm')} · {(a.appointment_services as {service_name_snapshot:string}[])?.[0]?.service_name_snapshot}
                    </p>
                    {a.customer_name && <p className="text-xs text-slate-400">{a.customer_name as string}</p>}
                  </div>
                  <StatusBadge status={a.status as string} />
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
