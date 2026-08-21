import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { FormSection } from '@/components/forms/FormSection'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

// An empty numeric input yields NaN through valueAsNumber; for a limit that means
// "no limit", which the API expects as null.
const optionalLimit = z.preprocess(
  (v) => (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v)) ? null : v),
  z.number().int().min(0).nullable(),
)

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  price_monthly: z.preprocess(
    (v) => (typeof v === 'number' && Number.isNaN(v) ? 0 : v),
    z.number().min(0, 'Preço não pode ser negativo'),
  ),
  max_services: optionalLimit,
  max_professionals: optionalLimit,
  max_users: optionalLimit,
  max_appointments_per_month: optionalLimit,
  max_packages: optionalLimit,
  max_units: z.preprocess(
    (v) => (typeof v === 'number' && Number.isNaN(v) ? 1 : v),
    z.number().int().min(1, 'Mínimo de 1 unidade'),
  ),
  allow_online_payment: z.boolean(),
  allow_packages: z.boolean(),
  allow_custom_terms: z.boolean(),
  allow_advanced_reports: z.boolean(),
  allow_crm_integration: z.boolean(),
  allow_before_after_photos: z.boolean(),
  allow_multi_unit: z.boolean(),
  allow_waitlist: z.boolean(),
  allow_physical_resources: z.boolean(),
  allow_webhooks: z.boolean(),
  allow_custom_forms: z.boolean(),
  allow_customer_lifecycle: z.boolean(),
  allow_automation_rules: z.boolean(),
  allow_whatsapp_integration: z.boolean(),
  allow_commissions: z.boolean(),
})
type Form = z.infer<typeof schema>

const LIMITS: { name: keyof Form; label: string; hint?: string }[] = [
  { name: 'max_services', label: 'Máx. serviços' },
  { name: 'max_professionals', label: 'Máx. profissionais' },
  { name: 'max_users', label: 'Máx. usuários' },
  { name: 'max_appointments_per_month', label: 'Máx. agendamentos/mês' },
  { name: 'max_packages', label: 'Máx. pacotes' },
]

const FEATURES: { name: keyof Form; label: string }[] = [
  { name: 'allow_packages', label: 'Pacotes de sessões' },
  { name: 'allow_online_payment', label: 'Pagamento online' },
  { name: 'allow_multi_unit', label: 'Múltiplas unidades' },
  { name: 'allow_waitlist', label: 'Lista de espera' },
  { name: 'allow_advanced_reports', label: 'Relatórios avançados' },
  { name: 'allow_crm_integration', label: 'Integração CRM' },
  { name: 'allow_before_after_photos', label: 'Fotos antes/depois' },
  { name: 'allow_physical_resources', label: 'Recursos físicos' },
  { name: 'allow_webhooks', label: 'Webhooks' },
  { name: 'allow_custom_forms', label: 'Formulários personalizados' },
  { name: 'allow_custom_terms', label: 'Termos personalizados' },
  { name: 'allow_customer_lifecycle', label: 'Ciclo de vida do cliente' },
  { name: 'allow_automation_rules', label: 'Regras de automação' },
  { name: 'allow_whatsapp_integration', label: 'Integração WhatsApp' },
  { name: 'allow_commissions', label: 'Comissões' },
]

// Mirrors the server defaults in PlanCreate, so a new plan starts from the same
// baseline the API would apply.
const DEFAULTS: Form = {
  name: '', description: '', price_monthly: 0,
  max_services: null, max_professionals: null, max_users: null,
  max_appointments_per_month: null, max_packages: null, max_units: 1,
  allow_packages: true,
  allow_online_payment: false, allow_custom_terms: false, allow_advanced_reports: false,
  allow_crm_integration: false, allow_before_after_photos: false, allow_multi_unit: false,
  allow_waitlist: false, allow_physical_resources: false, allow_webhooks: false,
  allow_custom_forms: false, allow_customer_lifecycle: false, allow_automation_rules: false,
  allow_whatsapp_integration: false, allow_commissions: false,
}

export default function PlanFormPage() {
  const { planId } = useParams<{ planId: string }>()
  const isEdit = !!planId
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: plan, isLoading } = useQuery({
    queryKey: ['master', 'plan', planId],
    queryFn: () => masterApi.getPlan(planId!),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })

  useEffect(() => { if (plan) reset({ ...DEFAULTS, ...plan }) }, [plan, reset])

  const mutation = useMutation({
    // PUT /plans/{id} takes the same full body as POST, so the form always sends
    // every field rather than a partial patch.
    mutationFn: (d: Form) => isEdit ? masterApi.updatePlan(planId!, d) : masterApi.createPlan(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master', 'plans'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['master', 'plan', planId] })
      toast.success(isEdit ? 'Plano atualizado' : 'Plano criado')
      navigate('/master/plans')
    },
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isEdit && isLoading) return <LoadingState />

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Editar plano' : 'Novo plano'}
        subtitle={isEdit ? plan?.name : 'Defina preço, limites e o que o plano libera'}
      />
      <div className="card bg-white border-slate-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-0">
          <FormSection title="Identificação">
            <div>
              <label className="label text-slate-600">Nome</label>
              <input {...register('name')} className="input bg-white border-slate-200 text-slate-900" placeholder="Starter" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label text-slate-600">Descrição</label>
              <textarea {...register('description')} rows={2} className="input bg-white border-slate-200 text-slate-900" />
            </div>
            <div>
              <label className="label text-slate-600">Preço mensal (R$)</label>
              <input {...register('price_monthly', { valueAsNumber: true })} type="number" step="0.01" min="0"
                className="input bg-white border-slate-200 text-slate-900" />
              {errors.price_monthly && <p className="text-xs text-red-500 mt-1">{errors.price_monthly.message}</p>}
            </div>
          </FormSection>

          <FormSection title="Limites" description="Deixe em branco para não limitar">
            <div className="grid grid-cols-2 gap-4">
              {LIMITS.map(({ name, label }) => (
                <div key={name}>
                  <label className="label text-slate-600">{label}</label>
                  <input {...register(name, { valueAsNumber: true })} type="number" min="0"
                    className="input bg-white border-slate-200 text-slate-900" placeholder="Sem limite" />
                </div>
              ))}
              <div>
                <label className="label text-slate-600">Máx. unidades</label>
                <input {...register('max_units', { valueAsNumber: true })} type="number" min="1"
                  className="input bg-white border-slate-200 text-slate-900" />
                {errors.max_units && <p className="text-xs text-red-500 mt-1">{errors.max_units.message}</p>}
              </div>
            </div>
          </FormSection>

          <FormSection title="Recursos liberados">
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input {...register(name)} type="checkbox" className="rounded border-slate-300" />
                  {label}
                </label>
              ))}
            </div>
          </FormSection>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/master/plans')} className="btn btn-secondary btn-md">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">
              {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
