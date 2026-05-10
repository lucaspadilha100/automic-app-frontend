import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extractApiError } from '@/api/client'
import { termsApi } from '@/api/terms.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { FileText, Plus, X, Power } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

type Term = {
  id: string
  term_type: string
  title: string
  content: string
  version: string | null
  is_active: boolean
}

const TERM_TYPE_LABELS: Record<string, string> = {
  booking_consent: 'Consentimento de Agendamento',
  privacy_policy: 'Política de Privacidade',
  service_terms: 'Termos de Serviço',
}

const EMPTY_FORM = {
  term_type: 'booking_consent',
  title: '',
  content: '',
  version: '',
}

export default function TermsPage() {
  const qc = useQueryClient()
  const [showPanel, setShowPanel] = useState(false)
  const [editing, setEditing] = useState<Term | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery<Term[]>({
    queryKey: ['terms'],
    queryFn: () => termsApi.list(),
  })

  const createMut = useMutation({
    mutationFn: () =>
      termsApi.create({
        term_type: form.term_type,
        title: form.title,
        content: form.content,
        version: form.version || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms'] })
      closePanel()
      toast.success('Termo criado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      termsApi.update(editing!.id, {
        title: form.title,
        content: form.content,
        version: form.version || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms'] })
      closePanel()
      toast.success('Termo atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      termsApi.setStatus(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms'] })
      toast.success('Status atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowPanel(true)
  }

  function openEdit(t: Term) {
    setEditing(t)
    setForm({
      term_type: t.term_type,
      title: t.title,
      content: t.content,
      version: t.version ?? '',
    })
    setShowPanel(true)
  }

  function closePanel() {
    setShowPanel(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Termos e Consentimentos"
        subtitle="Gerencie os termos de uso e políticas da plataforma"
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="w-4 h-4" /> Novo termo
          </button>
        }
      />

      {showPanel && (
        <div className="card p-6 border-primary-200 border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{editing ? 'Editar termo' : 'Novo termo'}</h3>
            <button onClick={closePanel} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipo *</label>
              <select
                className="input w-full"
                value={form.term_type}
                disabled={!!editing}
                onChange={e => setForm(f => ({ ...f, term_type: e.target.value }))}
              >
                <option value="booking_consent">Consentimento de Agendamento</option>
                <option value="privacy_policy">Política de Privacidade</option>
                <option value="service_terms">Termos de Serviço</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Versão</label>
              <input
                className="input w-full"
                placeholder="1.0"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Título *</label>
              <input
                className="input w-full"
                placeholder="Título do termo"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Conteúdo *</label>
              <textarea
                rows={8}
                className="input w-full resize-y"
                placeholder="Texto completo do termo..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={closePanel}>Cancelar</button>
            <button
              className="btn-primary"
              disabled={createMut.isPending || updateMut.isPending || !form.title || !form.content}
              onClick={() => (editing ? updateMut.mutate() : createMut.mutate())}
            >
              {(createMut.isPending || updateMut.isPending) ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar termo'}
            </button>
          </div>
        </div>
      )}

      {!data?.length ? (
        <EmptyState
          icon={FileText}
          title="Nenhum termo criado"
          description="Crie termos de uso e políticas para sua plataforma"
          action={
            <button className="btn-primary" onClick={openNew}>
              <Plus className="w-4 h-4" /> Criar termo
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {data.map(t => (
            <div
              key={t.id}
              className="card p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-primary-200 transition-colors"
              onClick={() => openEdit(t)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                  <FileText className={`w-4 h-4 ${t.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{t.title}</p>
                    {t.version && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        v{t.version}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{TERM_TYPE_LABELS[t.term_type] ?? t.term_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); statusMut.mutate({ id: t.id, is_active: !t.is_active }) }}
                  className={`btn-icon btn ${t.is_active ? 'text-emerald-500 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}
                  title={t.is_active ? 'Desativar' : 'Ativar'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
