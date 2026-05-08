import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { customerAuthApi } from '@/api/customerAuth.api'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import { extractApiError, CUSTOMER_TOKEN_KEY } from '@/api/client'
import { Calendar, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CustomerLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const redirectTo = params.get('redirect') || '/'
  const { setAuth } = useCustomerAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tokens = await customerAuthApi.login({ email, password })
      const customer = await customerAuthApi.me()
      setAuth(customer, tokens.access_token)
      navigate(redirectTo)
    } catch (err) {
      setError(extractApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Minha Conta</h1>
          <p className="text-sm text-slate-500 mt-1">Acesse seus agendamentos</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" className="absolute right-3 top-2.5 text-slate-400" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">{error}</div>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-sm text-slate-500 text-center mt-5">
            Não tem conta? <Link to={`/customer/register?redirect=${redirectTo}`} className="text-primary-600 hover:underline font-semibold">Cadastrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
