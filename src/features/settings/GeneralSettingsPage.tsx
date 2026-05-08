import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
import { useForm } from 'react-hook-form'
import { LoadingState } from '@/components/feedback/LoadingState'
import { FormSection } from '@/components/forms/FormSection'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function GeneralSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get() })
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (data?.settings) reset(data.settings) }, [data, reset])
  const mutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updateGeneral(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Configurações salvas') },
  })
  if (isLoading) return <LoadingState />
  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Página pública">
            <div>
              <label className="label">Título da página</label>
              <input {...register('homepage_title')} className="input" placeholder="Agende seu horário" />
            </div>
            <div>
              <label className="label">Subtítulo</label>
              <input {...register('homepage_subtitle')} className="input" />
            </div>
            <div>
              <label className="label">Mensagem de confirmação</label>
              <textarea {...register('confirmation_message')} className="input" rows={2} />
            </div>
          </FormSection>
          <FormSection title="Opções de exibição">
            {[
              { name: 'show_prices', label: 'Mostrar preços' },
              { name: 'show_duration', label: 'Mostrar duração' },
              { name: 'allow_professional_choice', label: 'Permitir escolha de profissional' },
              { name: 'allow_multiple_services', label: 'Permitir múltiplos serviços' },
              { name: 'allow_customer_cancel', label: 'Permitir cancelamento pelo cliente' },
              { name: 'allow_customer_reschedule', label: 'Permitir reagendamento pelo cliente' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input {...register(name)} type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </FormSection>
          <div className="flex justify-end">
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">
              {mutation.isPending ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
