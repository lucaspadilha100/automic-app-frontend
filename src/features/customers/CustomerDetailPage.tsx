import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api/customers.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { ExternalLink } from 'lucide-react'
import { Plus } from 'lucide-react'

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const qc = useQueryClient()
  const [noteText, setNoteText] = useState('')
  const [isInternal, setIsInternal] = useState(true)

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.get(customerId!),
    enabled: customerId !== 'new',
  })
  const { data: notes } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: () => customersApi.getNotes(customerId!),
    enabled: !!customerId && customerId !== 'new',
  })
  const { data: appointments } = useQuery({
    queryKey: ['customer-appointments', customerId],
    queryFn: () => customersApi.getAppointments(customerId!),
    enabled: !!customerId && customerId !== 'new',
  })

  const noteMutation = useMutation({
    mutationFn: () => customersApi.addNote(customerId!, { content: noteText, is_internal: isInternal }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer-notes', customerId] }); setNoteText(''); toast.success('Nota adicionada') },
  })

  const { user } = useAuthStore()

  if (isLoading || !customer) return <LoadingState />

  const portalUrl = user?.tenant_slug
    ? `${window.location.origin}/customer/login?slug=${user.tenant_slug}`
    : null

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={customer.name}
        subtitle={customer.phone}
        actions={portalUrl && customer.email ? (
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Abrir portal do cliente">
            <ExternalLink className="w-3.5 h-3.5" />
            Portal do cliente
          </a>
        ) : undefined}
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase mb-1">E-mail</p>
          <p className="text-sm font-medium">{customer.email || '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase mb-1">CPF</p>
          <p className="text-sm font-medium">{customer.cpf || '—'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 uppercase mb-1">Cliente desde</p>
          <p className="text-sm font-medium">{format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Agendamentos recentes</h3>
          {(appointments as Array<Record<string, unknown>>)?.length > 0 ? (
            <div className="space-y-2">
              {(appointments as Array<Record<string, unknown>>).slice(0, 5).map((a, i) => (
                <div key={String(a.id ?? i)} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-700">{format(new Date(String(a.start_datetime)), 'dd/MM/yy HH:mm')}</span>
                  <StatusBadge status={String(a.status)} />
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400">Nenhum agendamento</p>}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Notas</h3>
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {notes?.map((n) => (
              <div key={n.id} className="bg-slate-50 rounded-lg p-2.5 text-sm">
                <p className="text-slate-700">{n.content}</p>
                <p className="text-xs text-slate-400 mt-1">{n.is_internal ? 'Interna' : 'Visível ao cliente'}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="input text-sm"
              rows={2}
              placeholder="Nova nota..."
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
                Nota interna
              </label>
              <button
                onClick={() => noteMutation.mutate()}
                disabled={!noteText || noteMutation.isPending}
                className="btn btn-primary btn-sm py-1 px-3"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
