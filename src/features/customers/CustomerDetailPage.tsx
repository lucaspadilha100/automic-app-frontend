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
import { ExternalLink, Plus, Tag } from 'lucide-react'

const TAG_FALLBACK_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const qc = useQueryClient()
  const [noteText, setNoteText] = useState('')
  const [isInternal, setIsInternal] = useState(true)

  // Tags state
  const [showTagPanel, setShowTagPanel] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366f1')

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
  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => customersApi.getTags(),
    enabled: showTagPanel,
  })

  const noteMutation = useMutation({
    mutationFn: () => customersApi.addNote(customerId!, { content: noteText, is_internal: isInternal }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer-notes', customerId] }); setNoteText(''); toast.success('Nota adicionada') },
  })

  const invalidateCustomerAndTags = () => {
    qc.invalidateQueries({ queryKey: ['customer', customerId] })
    qc.invalidateQueries({ queryKey: ['tags'] })
  }

  const linkTagMut = useMutation({
    mutationFn: (tagId: string) => customersApi.linkTag(customerId!, tagId),
    onSuccess: invalidateCustomerAndTags,
    onError: () => toast.error('Erro ao adicionar tag'),
  })

  const unlinkTagMut = useMutation({
    mutationFn: (tagId: string) => customersApi.unlinkTag(customerId!, tagId),
    onSuccess: invalidateCustomerAndTags,
    onError: () => toast.error('Erro ao remover tag'),
  })

  const createTagMut = useMutation({
    mutationFn: () => customersApi.createTag({ name: newTagName.trim(), color: newTagColor }),
    onSuccess: async (tag: { id: string }) => {
      await customersApi.linkTag(customerId!, tag.id)
      invalidateCustomerAndTags()
      setNewTagName('')
      setNewTagColor('#6366f1')
      toast.success('Tag criada e aplicada')
    },
    onError: () => toast.error('Erro ao criar tag'),
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

      {/* Tags card */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-slate-400" /> Tags
          </h3>
          <button
            className="btn-secondary text-xs py-1 px-2.5"
            onClick={() => setShowTagPanel(v => !v)}
          >
            {showTagPanel ? 'Fechar' : 'Adicionar tag'}
          </button>
        </div>

        {/* Current tags */}
        <div className="flex flex-wrap gap-2 min-h-[24px]">
          {customer.tags && customer.tags.length > 0 ? customer.tags.map((t: { id: string; name: string; color: string }, i: number) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: t.color || TAG_FALLBACK_COLORS[i % TAG_FALLBACK_COLORS.length] }}
            >
              {t.name}
            </span>
          )) : (
            <p className="text-xs text-slate-400">Nenhuma tag aplicada</p>
          )}
        </div>

        {/* Tag panel */}
        {showTagPanel && (
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
            {/* Toggle existing tags */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Selecionar tags</p>
              <div className="flex flex-wrap gap-2">
                {(allTags ?? []).map((t: { id: string; name: string; color: string }, i: number) => {
                  const applied = customer.tags?.some((ct: { id: string }) => ct.id === t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => applied ? unlinkTagMut.mutate(t.id) : linkTagMut.mutate(t.id)}
                      disabled={linkTagMut.isPending || unlinkTagMut.isPending}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-opacity ${applied ? 'text-white border-transparent' : 'text-slate-700 bg-white border-slate-200 opacity-60 hover:opacity-100'}`}
                      style={applied ? { backgroundColor: t.color || TAG_FALLBACK_COLORS[i % TAG_FALLBACK_COLORS.length] } : {}}
                    >
                      {applied && <span className="text-white">✓</span>} {t.name}
                    </button>
                  )
                })}
                {(allTags ?? []).length === 0 && <p className="text-xs text-slate-400">Nenhuma tag disponível</p>}
              </div>
            </div>

            {/* Create new tag */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Nova tag</p>
              <div className="flex items-center gap-2">
                <input
                  className="input text-sm flex-1"
                  placeholder="Nome da tag..."
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                />
                <div className="flex gap-1.5">
                  {TAG_FALLBACK_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewTagColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: newTagColor === c ? '#1e293b' : 'transparent' }}
                    />
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-sm py-1 px-3 whitespace-nowrap"
                  onClick={() => createTagMut.mutate()}
                  disabled={!newTagName.trim() || createTagMut.isPending}
                >
                  <Plus className="w-3 h-3" /> Criar
                </button>
              </div>
            </div>
          </div>
        )}
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
