import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { customerPortalApi } from '@/api/customerPortal.api'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ChevronLeft, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function CustomerProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const { customer, clearAuth } = useCustomerAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: customer?.name || '', phone: customer?.phone || '', email: customer?.email || '' })

  const { data: profile } = useQuery({
    queryKey: ['customer-profile', slug],
    queryFn: () => customerPortalApi.getProfile(slug!),
  })

  const updateMut = useMutation({
    mutationFn: () => customerPortalApi.updateProfile(slug!, { name: form.name, phone: form.phone, email: form.email }),
    onSuccess: () => { setEditing(false); toast.success('Perfil atualizado') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const handleLogout = () => { clearAuth(); window.location.href = `/${slug}` }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link to={`/${slug}`} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-slate-900">Meu perfil</h1>
        <button onClick={handleLogout} className="ml-auto text-slate-400 hover:text-red-500 flex items-center gap-1 text-sm">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="flex justify-center py-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-black text-3xl">{customer?.name?.charAt(0) || 'C'}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          {!editing ? (
            <>
              <div className="space-y-4">
                {[
                  { label: 'Nome', value: profile?.name || customer?.name },
                  { label: 'WhatsApp', value: profile?.phone || customer?.phone },
                  { label: 'E-mail', value: profile?.email || customer?.email },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
                  </div>
                ))}
              </div>
              <button className="btn-secondary w-full mt-5" onClick={() => { setForm({ name: profile?.name || customer?.name || '', phone: profile?.phone || customer?.phone || '', email: profile?.email || customer?.email || '' }); setEditing(true) }}>
                Editar perfil
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
              <div><label className="label">WhatsApp</label><input className="input" type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} /></div>
              <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} /></div>
              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setEditing(false)}>Cancelar</button>
                <button className="btn-primary flex-1" onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
                  {updateMut.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to={`/customer/tenants/${slug}/appointments`} className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-primary-300 transition-colors">
            <p className="text-2xl font-black text-primary-600">📅</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Agendamentos</p>
          </Link>
          <Link to={`/customer/tenants/${slug}/packages`} className="bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-primary-300 transition-colors">
            <p className="text-2xl font-black text-primary-600">📦</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Pacotes</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
