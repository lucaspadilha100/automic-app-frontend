import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { LoadingState } from '@/components/feedback/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import toast from 'react-hot-toast'

const ALL_FEATURES = [
  { key: 'packages', label: 'Pacotes de sessões' },
  { key: 'custom_terms', label: 'Termos personalizados' },
  { key: 'before_after_photos', label: 'Fotos antes/depois' },
  { key: 'commissions', label: 'Comissões' },
  { key: 'custom_forms', label: 'Formulários personalizados' },
  { key: 'automation_rules', label: 'Regras de automação' },
  { key: 'whatsapp_integration', label: 'Integração WhatsApp' },
  { key: 'multi_unit', label: 'Multi-unidade' },
  { key: 'waitlist', label: 'Lista de espera' },
  { key: 'physical_resources', label: 'Recursos físicos' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'advanced_reports', label: 'Relatórios avançados' },
]

export default function TenantFeaturesPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const qc = useQueryClient()

  const { data: features, isLoading } = useQuery({
    queryKey: ['master', 'tenant-features', tenantId],
    queryFn: () => masterApi.getFeatures(tenantId!),
  })

  const mutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      masterApi.updateFeature(tenantId!, key, enabled),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master', 'tenant-features', tenantId] }); toast.success('Feature atualizada') },
  })

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader title="Feature Flags" subtitle="Ative ou desative funcionalidades para esta empresa" />
      <div className="card p-6 bg-white border-slate-200">
        <div className="space-y-4">
          {ALL_FEATURES.map(({ key, label }) => {
            const enabled = features?.[key] ?? false
            return (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-gray-500 font-mono">{key}</p>
                </div>
                <button
                  onClick={() => mutation.mutate({ key, enabled: !enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
