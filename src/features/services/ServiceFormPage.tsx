import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/api/services.api'
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
  duration_minutes: z.number().min(1, 'Duração obrigatória'),
  price: z.number().min(0),
  buffer_before_minutes: z.number().min(0),
  buffer_after_minutes: z.number().min(0),
  category_id: z.string().optional().or(z.literal('')),
  requires_deposit: z.boolean(),
})
type Form = z.infer<typeof schema>

export default function ServiceFormPage() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const isEdit = !!serviceId
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: categories } = useQuery({ queryKey: ['service-categories'], queryFn: () => servicesApi.listCategories() })
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId], queryFn: () => servicesApi.get(serviceId!), enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { buffer_before_minutes: 0, buffer_after_minutes: 0, requires_deposit: false, price: 0 },
  })

  useEffect(() => {
    if (service) reset({
      name: service.name, description: service.description || '',
      duration_minutes: service.duration_minutes, price: Number(service.price),
      buffer_before_minutes: service.buffer_before_minutes, buffer_after_minutes: service.buffer_after_minutes,
      category_id: service.category_id || '', requires_deposit: service.requires_deposit,
    })
  }, [service, reset])

  const mutation = useMutation({
    mutationFn: (d: Form) => isEdit ? servicesApi.update(serviceId!, d as Parameters<typeof servicesApi.update>[1]) : servicesApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success(isEdit ? 'Serviço atualizado' : 'Serviço criado')
      navigate('/app/services')
    },
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isEdit && isLoading) return <LoadingState />

  return (
    <div className="max-w-2xl">
      <PageHeader title={isEdit ? 'Editar serviço' : 'Novo serviço'} />
      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Informações básicas">
            <div>
              <label className="label">Nome do serviço</label>
              <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Ex: Corte de cabelo" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea {...register('description')} className="input" rows={3} placeholder="Descreva o serviço..." />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select {...register('category_id')} className="input">
                <option value="">Sem categoria</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </FormSection>

          <FormSection title="Duração e preço">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Duração (minutos)</label>
                <input {...register('duration_minutes', { valueAsNumber: true })} type="number" min={1} className="input" />
                {errors.duration_minutes && <p className="text-xs text-red-500 mt-1">{errors.duration_minutes.message}</p>}
              </div>
              <div>
                <label className="label">Preço (R$)</label>
                <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" min={0} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Buffer antes (min)</label>
                <input {...register('buffer_before_minutes', { valueAsNumber: true })} type="number" min={0} className="input" />
              </div>
              <div>
                <label className="label">Buffer depois (min)</label>
                <input {...register('buffer_after_minutes', { valueAsNumber: true })} type="number" min={0} className="input" />
              </div>
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => navigate('/app/services')} className="btn btn-secondary btn-md">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">
              {mutation.isPending ? 'Salvando...' : 'Salvar serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
