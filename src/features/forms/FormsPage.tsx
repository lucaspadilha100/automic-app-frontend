import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClipboardList, Plus, Power, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const FIELD_TYPES = ['text','textarea','select','checkbox','date','phone','cpf']

export default function FormsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Record<string,unknown> | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [newField, setNewField] = useState({ label: '', field_type: 'text', required: false, options: '' })

  const { data: forms, isLoading } = useQuery({
    queryKey: ['custom-forms'],
    queryFn: async () => (await apiClient.get('/admin/forms')).data,
  })

  const { data: fields } = useQuery({
    queryKey: ['form-fields', selected?.id],
    queryFn: async () => (await apiClient.get(`/admin/forms/${selected!.id}`)).data,
    enabled: !!selected,
  })

  const createFormMut = useMutation({
    mutationFn: (d: typeof formData) => apiClient.post('/admin/forms', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['custom-forms'] }); setShowForm(false); toast.success('Formulário criado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const addFieldMut = useMutation({
    mutationFn: (d: typeof newField) => apiClient.post(`/admin/forms/${selected!.id}/fields`, {
      ...d, options: d.options ? d.options.split(',').map(o => o.trim()) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['form-fields', selected?.id] }); setNewField({ label: '', field_type: 'text', required: false, options: '' }); toast.success('Campo adicionado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => apiClient.patch(`/admin/forms/${id}/status`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-forms'] }),
  })

  if (isLoading) return <div><PageHeader title="Formulários" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Formulários"
        subtitle="Fichas de anamnese e questionários personalizados"
        actions={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Novo formulário</button>}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Form list */}
        <div className="space-y-2">
          {!forms?.length ? (
            <EmptyState icon={ClipboardList} title="Nenhum formulário" description="Crie fichas de anamnese para seus clientes" action={<button className="btn-primary" onClick={() => setShowForm(true)}>Criar</button>} />
          ) : forms?.map((f: Record<string,unknown>) => (
            <div key={f.id as string}
              onClick={() => setSelected(f)}
              className={`card p-4 cursor-pointer transition-all ${selected?.id === f.id ? 'border-primary-400 ring-1 ring-primary-200' : 'hover:border-slate-300'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{f.name as string}</p>
                <StatusBadge status={f.is_active ? 'active' : 'inactive'} />
              </div>
              {f.description && <p className="text-xs text-slate-400 mt-1 truncate">{f.description as string}</p>}
              <div className="flex gap-2 mt-3">
                <button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); toggleMut.mutate({ id: f.id as string, is_active: !f.is_active }) }}>
                  <Power className="w-3.5 h-3.5" /> {f.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Fields editor */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Campos de {(fields as Record<string,unknown>)?.name as string || selected.name as string}</h3>
              <div className="space-y-2 mb-4">
                {((fields as Record<string,unknown>)?.fields as Record<string,unknown>[] || []).map((field: Record<string,unknown>) => (
                  <div key={field.id as string} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{field.label as string}</p>
                      <p className="text-xs text-slate-400">{field.field_type as string}{field.required ? ' · obrigatório' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Adicionar campo</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="label">Label</label>
                    <input className="input" value={newField.label} onChange={e => setNewField(f => ({...f, label: e.target.value}))} placeholder="Nome do campo" />
                  </div>
                  <div>
                    <label className="label">Tipo</label>
                    <select className="select" value={newField.field_type} onChange={e => setNewField(f => ({...f, field_type: e.target.value}))}>
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {(newField.field_type === 'select' || newField.field_type === 'checkbox') && (
                    <div className="col-span-2">
                      <label className="label">Opções (separadas por vírgula)</label>
                      <input className="input" value={newField.options} onChange={e => setNewField(f => ({...f, options: e.target.value}))} placeholder="Opção 1, Opção 2, Opção 3" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 col-span-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-primary-400" checked={newField.required} onChange={e => setNewField(f => ({...f, required: e.target.checked}))} />
                    <span className="text-sm text-slate-600">Campo obrigatório</span>
                  </label>
                </div>
                <button className="btn-primary btn-sm" onClick={() => addFieldMut.mutate(newField)} disabled={!newField.label || addFieldMut.isPending}>
                  <Plus className="w-3.5 h-3.5" /> Adicionar campo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Novo formulário</h3><button onClick={() => setShowForm(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Nome</label><input className="input" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} placeholder="Ficha de anamnese" /></div>
              <div><label className="label">Descrição</label><textarea className="input" rows={2} value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => createFormMut.mutate(formData)} disabled={!formData.name || createFormMut.isPending}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
