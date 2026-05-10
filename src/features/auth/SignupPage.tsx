import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import { extractApiError } from '@/api/client'
import toast from 'react-hot-toast'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function SignupPage() {
  const [form, setForm] = useState({
    company_name: '',
    slug: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    phone: '',
  })
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleCompanyNameChange(value: string) {
    setForm(f => ({
      ...f,
      company_name: value,
      slug: slugEdited ? f.slug : slugify(value),
    }))
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true)
    setForm(f => ({ ...f, slug: slugify(value) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.owner_password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      await authApi.signup({
        company_name: form.company_name,
        slug: form.slug,
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_password: form.owner_password,
        phone: form.phone || undefined,
      })
      setSuccess(true)
    } catch (err) {
      toast.error(extractApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Conta criada!</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Acesse o sistema com seu email e senha.
          </p>
          <Link to="/login" className="btn-primary mt-6 inline-block px-8 py-3 rounded-xl font-bold text-sm">
            Fazer login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      {/* bg decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-400/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-400/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-400 flex items-center justify-center mb-4">
            <span className="text-slate-900 font-black text-xl">A</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AUTOMIC</h1>
          <p className="text-sm text-slate-500 mt-1">Crie sua conta gratuitamente</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome da empresa *</label>
              <input
                type="text"
                className="input"
                placeholder="Minha Empresa"
                value={form.company_name}
                onChange={e => handleCompanyNameChange(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">URL personalizada *</label>
              <input
                type="text"
                className="input"
                placeholder="minha-empresa"
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
                required
              />
              {form.slug && (
                <p className="text-xs text-slate-400 mt-1">
                  automic.tech.com.br/<span className="text-primary-600 font-medium">{form.slug}</span>
                </p>
              )}
            </div>

            <div>
              <label className="label">Seu nome *</label>
              <input
                type="text"
                className="input"
                placeholder="João Silva"
                value={form.owner_name}
                onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                placeholder="voce@exemplo.com"
                value={form.owner_email}
                onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Senha * <span className="text-slate-400 font-normal">(mín. 8 caracteres)</span></label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.owner_password}
                onChange={e => setForm(f => ({ ...f, owner_password: e.target.value }))}
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="label">Telefone</label>
              <input
                type="tel"
                className="input"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">
            Fazer login
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400 mt-4">
          AUTOMIC Booking • Plataforma de agendamento
        </p>
      </div>
    </div>
  )
}
