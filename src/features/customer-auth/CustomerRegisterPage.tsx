import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { customerAuthApi } from '@/api/customerAuth.api'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import { extractApiError } from '@/api/client'
import { Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CustomerRegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirectTo = params.get('redirect') || '/'
  const { setAuth } = useCustomerAuthStore()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tokens = await customerAuthApi.register({ name: form.name, phone: form.phone, email: form.email || undefined, password: form.password })
      const customer = await customerAuthApi.me()
      setAuth(customer, tokens.access_token)
      navigate(redirectTo)
    } catch (err) {
      setError(extractApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Criar Conta</h1>
          <p className="text-sm text-slate-500 mt-1">Cadastre-se para agendar</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo *</label>
              <input className="input" placeholder="Maria Silva" required {...f('name')} />
            </div>
            <div>
              <label className="label">WhatsApp *</label>
              <input type="tel" className="input" placeholder="11999999999" required {...f('phone')} />
            </div>
            <div>
              <label className="label">E-mail (opcional)</label>
              <input type="email" className="input" placeholder="seu@email.com" {...f('email')} />
            </div>
            <div>
              <label className="label">Senha *</label>
              <input type="password" className="input" placeholder="Mínimo 6 caracteres" required minLength={6} {...f('password')} />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">{error}</div>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
          <p className="text-sm text-slate-500 text-center mt-5">
            Já tem conta? <Link to={`/customer/login?redirect=${redirectTo}`} className="text-primary-600 hover:underline font-semibold">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
