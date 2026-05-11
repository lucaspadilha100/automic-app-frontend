import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { packagesApi } from '@/api/packages.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormSection } from '@/components/forms/FormSection'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { LoadingState } from '@/components/feedback/LoadingState'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  total_sessions: z.number().int().min(1, 'Mínimo 1 sessão'),
  price: z.number().min(0, 'Preço inválido'),
  validity_days: z.number().int().min(1).optional().or(z.literal(0)).transform(v => v || undefined),
  is_active: z.boolean(),
})
type Form = z.infer<typeof schema>

export default function PackageFormPage() {
  const { packageId } = useParams<{ packageId: string }>()
  const isEdit = !!packageId
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: pkg, isLoading } = useQuery({
    queryKey: ['package', packageId],
    queryFn: () => packagesApi.get(packageId!),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { total_sessions: 1, price: 0, is_active: true },
  })

  useEffect(() => {
    if (pkg) reset({
      name: pkg.name,
      description: pkg.description || '',
      total_sessions: pkg.total_sessions,
      price: Number(pkg.price),
      validity_days: pkg.validity_days || 0,
      is_active: pkg.is_active,
    })
  }, [pkg, reset])

  const mutation = useMutation({
    mutationFn: (d: Form) => {
      const { is_active, ...createFields } = d
      return isEdit
        ? packagesApi.update(packageId!, d)
        : packagesApi.create(createFields)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packages'] })
      toast.success(isEdit ? 'Pacote atualizado' : 'Pacote criado')
      navigate('/app/packages')
    },
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isEdit && isLoading) return <LoadingState />

  return (
    <div className="max-w-2xl">
      <PageHeader title={isEdit ? 'Editar pacote' : 'Novo pacote'} />
      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Informações básicas">
            <div>
              <label className="label">Nome do pacote</label>
              <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Ex: Pacote 10 sessões" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea {...register('description')} className="input" rows={3} placeholder="Descreva o pacote..." />
            </div>
          </FormSection>

          <FormSection title="Sessões e preço">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Número de sessões</label>
                <input {...register('total_sessions', { valueAsNumber: true })} type="number" min={1} className={`input ${errors.total_sessions ? 'input-error' : ''}`} />
                {errors.total_sessions && <p className="text-xs text-red-500 mt-1">{errors.total_sessions.message}</p>}
              </div>
              <div>
                <label className="label">Preço (R$)</label>
                <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" min={0} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Validade (dias) — deixe em branco para sem prazo</label>
              <input {...register('validity_days', { valueAsNumber: true })} type="number" min={0} className="input" placeholder="Ex: 180" />
            </div>
          </FormSection>

          {isEdit && (
            <FormSection title="Status">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('is_active')} type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-700">Pacote ativo</span>
              </label>
            </FormSection>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => navigate('/app/packages')} className="btn btn-secondary btn-md">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">
              {mutation.isPending ? 'Salvando...' : 'Salvar pacote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
