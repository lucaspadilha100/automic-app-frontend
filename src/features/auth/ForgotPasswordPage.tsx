import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth.api'
import { extractApiError } from '@/api/client'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'

const schema = z.object({ email: z.string().email('E-mail inválido') })
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: Form) => authApi.forgotPassword(d.email),
    onSuccess: () => setSent(true),
    onError: (e) => toast.error(extractApiError(e)),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
              <h2 className="font-semibold text-slate-900 mb-2">E-mail enviado</h2>
              <p className="text-sm text-slate-500">Se o e-mail existir, você receberá as instruções de redefinição.</p>
              <Link to="/login" className="btn btn-secondary btn-md mt-6 w-full">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Link>
              <h1 className="text-xl font-semibold text-slate-900 mb-1 font-display">Recuperar senha</h1>
              <p className="text-sm text-slate-500 mb-6">Informe seu e-mail para receber as instruções.</p>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <input {...register('email')} type="email" className={`input ${errors.email ? 'input-error' : ''}`} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md w-full">
                  {mutation.isPending ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
