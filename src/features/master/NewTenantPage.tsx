import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormSection } from '@/components/forms/FormSection'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  timezone: z.string().min(1),
  status: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  owner_name: z.string().optional(),
  owner_email: z.string().email().optional().or(z.literal('')),
  owner_password: z.string().min(6).optional().or(z.literal('')),
})
type Form = z.infer<typeof schema>

export default function NewTenantPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { timezone: 'America/Sao_Paulo', status: 'trial' } })

  const mutation = useMutation({
    mutationFn: (d: Form) => masterApi.createTenant(d),
    onSuccess: (tenant) => { qc.invalidateQueries({ queryKey: ['master', 'tenants'] }); toast.success('Empresa criada'); navigate(`/master/tenants/${tenant.id}`) },
    onError: (e) => toast.error(extractApiError(e)),
  })

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nova Empresa" />
      <div className="card bg-white border-slate-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-0">
          <FormSection title="Dados da empresa">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-slate-600">Nome</label>
                <input {...register('name')} className="input bg-white border-slate-200 text-slate-900" placeholder="Meu Salão" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label text-slate-600">Slug (URL)</label>
                <input {...register('slug')} className="input bg-white border-slate-200 text-slate-900" placeholder="meu-salao" />
                {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-slate-600">E-mail</label>
                <input {...register('email')} type="email" className="input bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <label className="label text-slate-600">Telefone</label>
                <input {...register('phone')} className="input bg-white border-slate-200 text-slate-900" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-slate-600">Status inicial</label>
                <select {...register('status')} className="input bg-white border-slate-200 text-slate-900">
                  <option value="trial">Trial</option>
                  <option value="active">Ativo</option>
                </select>
              </div>
              <div>
                <label className="label text-slate-600">Fuso horário</label>
                <select {...register('timezone')} className="input bg-white border-slate-200 text-slate-900">
                  <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                  <option value="America/Manaus">Manaus (AMT)</option>
                  <option value="America/Belem">Belém (BRT)</option>
                  <option value="America/Fortaleza">Fortaleza (BRT)</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Proprietário (opcional)" description="Cria um usuário tenant_owner automaticamente">
            <div>
              <label className="label text-slate-600">Nome do proprietário</label>
              <input {...register('owner_name')} className="input bg-white border-slate-200 text-slate-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label text-slate-600">E-mail do proprietário</label>
                <input {...register('owner_email')} type="email" className="input bg-white border-slate-200 text-slate-900" />
              </div>
              <div>
                <label className="label text-slate-600">Senha</label>
                <input {...register('owner_password')} type="password" className="input bg-white border-slate-200 text-slate-900" />
              </div>
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/master/tenants')} className="btn btn-secondary btn-md bg-white border-slate-200 text-slate-600">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">
              {mutation.isPending ? 'Criando...' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
