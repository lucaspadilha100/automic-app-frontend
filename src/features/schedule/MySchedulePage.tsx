import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Calendar, User, Phone, Clock, Scissors, FileText } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

interface Appointment {
  id: string
  start_datetime: string
  end_datetime: string
  status: string
  customer_notes?: string
  services: string[]
  customer_name: string
  customer_phone?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendado', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmado', color: 'text-green-700 bg-green-50 border-green-200' },
  in_progress: { label: 'Em andamento', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  completed: { label: 'Concluído', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  cancelled: { label: 'Cancelado', color: 'text-red-700 bg-red-50 border-red-200' },
  no_show: { label: 'Não compareceu', color: 'text-orange-700 bg-orange-50 border-orange-200' },
}

function getDayLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  return format(date, 'dd/MM', { locale: ptBR })
}

function groupByDay(appointments: Appointment[]): Record<string, Appointment[]> {
  return appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    const key = getDayLabel(appt.start_datetime)
    if (!acc[key]) acc[key] = []
    acc[key].push(appt)
    return acc
  }, {})
}

type FilterType = 'all' | 'today' | 'tomorrow'

function AppointmentCard({ appt }: { appt: Appointment }) {
  const queryClient = useQueryClient()
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')

  const saveNotesMutation = useMutation({
    mutationFn: async (internal_notes: string) => {
      await apiClient.put(`/appointments/${appt.id}/notes`, { internal_notes })
    },
    onSuccess: () => {
      toast.success('Observação salva!')
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      setNotesOpen(false)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        toast('Endpoint de observações não disponível.', { icon: '⚠️' })
      } else {
        toast.error(extractApiError(err))
      }
    },
  })

  const statusCfg = STATUS_CONFIG[appt.status] ?? { label: appt.status, color: 'text-slate-600 bg-slate-50 border-slate-200' }
  const startTime = format(parseISO(appt.start_datetime), 'HH:mm')
  const endTime = format(parseISO(appt.end_datetime), 'HH:mm')

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-900">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-sm">{startTime} – {endTime}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {appt.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {appt.services.map((svc, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2 py-0.5">
              <Scissors className="w-3 h-3" />
              {svc}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium">{appt.customer_name}</span>
        </div>
        {appt.customer_phone && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{appt.customer_phone}</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-2">
        <button
          onClick={() => setNotesOpen(v => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          {notesOpen ? 'Fechar observação' : 'Ver/Adicionar observação'}
        </button>
        {notesOpen && (
          <div className="mt-2 space-y-2">
            <textarea
              className="input text-sm resize-none"
              rows={3}
              placeholder="Observação interna..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button
              className="btn-primary text-xs py-1.5 px-3"
              disabled={saveNotesMutation.isPending}
              onClick={() => saveNotesMutation.mutate(notes)}
            >
              {saveNotesMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MySchedulePage() {
  const { user } = useAuthStore()
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const { data } = await apiClient.get('/professionals/me/appointments')
      return data
    },
    enabled: !!user,
  })

  const filtered = appointments.filter(appt => {
    if (filter === 'all') return true
    const date = parseISO(appt.start_datetime)
    if (filter === 'today') return isToday(date)
    if (filter === 'tomorrow') return isTomorrow(date)
    return true
  })

  const grouped = groupByDay(filtered)
  const dayKeys = Object.keys(grouped)

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'today', label: 'Hoje' },
    { key: 'tomorrow', label: 'Amanhã' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary-500" />
        <h1 className="text-xl font-bold text-slate-900">Minha Agenda</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === key
                ? 'bg-primary-400 text-slate-900 border-primary-400'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState text="Carregando agenda..." />
      ) : dayKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Calendar className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dayKeys.map(day => (
            <div key={day}>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{day}</h2>
              <div className="space-y-3">
                {grouped[day].map(appt => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
