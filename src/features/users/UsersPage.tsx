import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extractApiError } from '@/api/client'
import { usersApi } from '@/api/users.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Users, Mail, Plus, X, Power } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type User = {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

type Invite = {
  id: string
  email: string
  role: string
  expires_at: string | null
  status: string
}

const ROLE_LABELS: Record<string, string> = {
  manager: 'Gerente',
  receptionist: 'Recepcionista',
  professional: 'Profissional',
  tenant_owner: 'Proprietário',
}

const ROLE_BADGE: Record<string, string> = {
  manager: 'bg-blue-50 text-blue-700',
  receptionist: 'bg-slate-100 text-slate-600',
  professional: 'bg-emerald-50 text-emerald-700',
  tenant_owner: 'bg-purple-50 text-purple-700',
}

const EMPTY_INVITE = { email: '', phone: '', role: 'receptionist' }

export default function UsersPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'users' | 'invites'>('users')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE)
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null)

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const { data: invites, isLoading: loadingInvites } = useQuery<Invite[]>({
    queryKey: ['user-invites'],
    queryFn: usersApi.listInvites,
    enabled: tab === 'invites',
  })

  const toggleMut = useMutation({
    mutationFn: (user: User) => usersApi.update(user.id, { is_active: !user.is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setConfirmDeactivate(null)
      toast.success('Status atualizado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const inviteMut = useMutation({
    mutationFn: () =>
      usersApi.sendInvite({
        email: inviteForm.email,
        phone: inviteForm.phone || undefined,
        role: inviteForm.role,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-invites'] })
      setShowInviteForm(false)
      setInviteForm(EMPTY_INVITE)
      toast.success('Convite enviado')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const isLoading = tab === 'users' ? loadingUsers : loadingInvites

  if (tab === 'users' && loadingUsers) return <LoadingState />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Usuários"
        subtitle="Gerencie usuários e convites da plataforma"
        actions={
          tab === 'invites' ? (
            <button className="btn-primary" onClick={() => setShowInviteForm(true)}>
              <Plus className="w-4 h-4" /> Convidar usuário
            </button>
          ) : null
        }
      />

      <div className="flex gap-1 border-b border-slate-200">
        {(['users', 'invites'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'users' ? 'Usuários' : 'Convites'}
          </button>
        ))}
      </div>

      {tab === 'invites' && showInviteForm && (
        <div className="card p-6 border-primary-200 border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Convidar usuário</h3>
            <button onClick={() => { setShowInviteForm(false); setInviteForm(EMPTY_INVITE) }} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">E-mail *</label>
              <input
                type="email"
                className="input w-full"
                placeholder="usuario@exemplo.com"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Telefone</label>
              <input
                type="tel"
                className="input w-full"
                placeholder="(00) 00000-0000"
                value={inviteForm.phone}
                onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Cargo *</label>
              <select
                className="input w-full"
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="manager">Gerente</option>
                <option value="receptionist">Recepcionista</option>
                <option value="professional">Profissional</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => { setShowInviteForm(false); setInviteForm(EMPTY_INVITE) }}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              disabled={inviteMut.isPending || !inviteForm.email}
              onClick={() => inviteMut.mutate()}
            >
              {inviteMut.isPending ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <>
          {!users?.length ? (
            <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Os usuários da plataforma aparecerão aqui" />
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${u.is_active ? 'bg-primary-50' : 'bg-slate-100'}`}>
                      <Users className={`w-4 h-4 ${u.is_active ? 'text-primary-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setConfirmDeactivate(u)}
                      className={`btn-icon btn ${u.is_active ? 'text-emerald-500 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}
                      title={u.is_active ? 'Desativar' : 'Ativar'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'invites' && (
        <>
          {loadingInvites ? (
            <LoadingState />
          ) : !invites?.length ? (
            <EmptyState
              icon={Mail}
              title="Nenhum convite pendente"
              description="Convide usuários para acessar a plataforma"
              action={
                <button className="btn-primary" onClick={() => setShowInviteForm(true)}>
                  <Plus className="w-4 h-4" /> Convidar usuário
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {invites.map(inv => (
                <div key={inv.id} className="card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{inv.email}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[inv.role] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ROLE_LABELS[inv.role] ?? inv.role}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          {inv.status}
                        </span>
                      </div>
                      {inv.expires_at && (
                        <p className="text-xs text-slate-500">
                          Expira em {format(new Date(inv.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {confirmDeactivate && (
        <div className="modal-overlay" onClick={() => setConfirmDeactivate(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-base font-bold text-slate-900">
                {confirmDeactivate.is_active ? 'Desativar usuário' : 'Ativar usuário'}
              </h3>
              <button onClick={() => setConfirmDeactivate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 px-6 py-4">
              {confirmDeactivate.is_active
                ? `Tem certeza que deseja desativar o usuário "${confirmDeactivate.name}"? Ele perderá o acesso à plataforma.`
                : `Deseja reativar o acesso do usuário "${confirmDeactivate.name}"?`}
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmDeactivate(null)}>Cancelar</button>
              <button
                className={confirmDeactivate.is_active ? 'btn-danger' : 'btn-primary'}
                disabled={toggleMut.isPending}
                onClick={() => toggleMut.mutate(confirmDeactivate)}
              >
                {toggleMut.isPending ? 'Salvando...' : confirmDeactivate.is_active ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
