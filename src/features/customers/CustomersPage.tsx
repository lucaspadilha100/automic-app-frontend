import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api/customers.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Link } from 'react-router-dom'
import { Plus, User, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function CustomersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => customersApi.list({ search: debouncedSearch || undefined }),
  })

  const createMut = useMutation({
    mutationFn: () => customersApi.create({ name: form.name, phone: form.phone, email: form.email || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setShowForm(false); setForm({ name:'',phone:'',email:'' }); toast.success('Cliente criado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <div><PageHeader title="Clientes" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${data?.length || 0} clientes`}
        actions={<button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Novo cliente</button>}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nome, telefone ou e-mail..." />
      </div>

      <div className="table-wrap">
        {!data?.length ? (
          <EmptyState icon={User} title="Nenhum cliente encontrado" description={search ? 'Tente outro termo' : 'Cadastre o primeiro cliente'} action={!search && <button className="btn-primary" onClick={() => setShowForm(true)}>Cadastrar cliente</button>} />
        ) : (
          <table className="table">
            <thead className="thead"><tr>
              <th className="th">Cliente</th>
              <th className="th">Telefone</th>
              <th className="th hidden sm:table-cell">E-mail</th>
              <th className="th hidden sm:table-cell">Cliente desde</th>
              <th className="th"></th>
            </tr></thead>
            <tbody>
              {data.map((c: Record<string,unknown>) => (
                <tr key={c.id as string} className="tr">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-slate-500">{(c.name as string).charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{c.name as string}</p>
                        <p className="text-xs text-slate-400 sm:hidden">{c.phone as string}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td text-slate-600">{c.phone as string}</td>
                  <td className="td text-slate-500 hidden sm:table-cell">{c.email as string || '—'}</td>
                  <td className="td text-slate-400 text-xs hidden sm:table-cell">
                    {c.created_at ? format(new Date(c.created_at as string), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </td>
                  <td className="td">
                    <Link to={`/app/customers/${c.id}`} className="text-xs text-primary-600 hover:underline font-medium">Ver detalhes</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold text-slate-900">Novo cliente</h3><button onClick={() => setShowForm(false)}>✕</button></div>
            <div className="p-6 space-y-4">
              <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Nome completo" /></div>
              <div><label className="label">Telefone/WhatsApp *</label><input className="input" type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="11999999999" /></div>
              <div><label className="label">E-mail (opcional)</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="cliente@email.com" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => createMut.mutate()} disabled={!form.name || !form.phone || createMut.isPending}>Criar cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
