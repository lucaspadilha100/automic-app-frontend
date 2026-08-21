import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { useForm } from 'react-hook-form'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import type { LimitOverride } from '@/types'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function TenantLimitsPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['master', 'tenant-limits', tenantId],
    queryFn: () => masterApi.getLimitOverrides(tenantId!),
  })

  const { register, handleSubmit, reset } = useForm<LimitOverride>()

  useEffect(() => { if (data) reset(data) }, [data, reset])

  const mutation = useMutation<unknown, Error, LimitOverride>({
    mutationFn: (d: LimitOverride) => masterApi.updateLimitOverrides(tenantId!, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master', 'tenant-limits', tenantId] }); toast.success('Limites atualizados') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <LoadingState />

  const fields: { name: keyof LimitOverride; label: string }[] = [
    { name: 'max_services', label: 'Máx. Serviços' },
    { name: 'max_professionals', label: 'Máx. Profissionais' },
    { name: 'max_users', label: 'Máx. Usuários' },
    { name: 'max_appointments_per_month', label: 'Máx. Agendamentos/mês' },
    { name: 'max_units', label: 'Máx. Unidades' },
    { name: 'max_packages', label: 'Máx. Pacotes' },
  ]

  return (
    <div>
      <PageHeader title="Limites personalizados" subtitle="Substitui os limites do plano para esta empresa" />
      <div className="card p-6 bg-white border-slate-200">
        {/* An emptied number input yields NaN from valueAsNumber; send an explicit
            null so the backend clears the override instead of receiving garbage. */}
        <form onSubmit={handleSubmit((d) => mutation.mutate(
          Object.fromEntries(
            Object.entries(d).map(([k, v]) => [k, typeof v === 'number' && Number.isNaN(v) ? null : v])
          ) as LimitOverride
        ))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ name, label }) => (
              <div key={name}>
                <label className="label text-slate-600">{label}</label>
                <input {...register(name, { valueAsNumber: true })} type="number" className="input bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" placeholder="Sem limite" />
              </div>
            ))}
          </div>
          <div>
            <label className="label text-slate-600">Observações internas</label>
            <textarea {...register('notes')} className="input bg-white border-slate-200 text-slate-900" rows={3} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">
              {mutation.isPending ? 'Salvando...' : 'Salvar limites'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
