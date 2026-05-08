import { Lock } from 'lucide-react'

interface Props {
  enabled: boolean
  featureName?: string
  children: React.ReactNode
}
export function FeatureGate({ enabled, featureName, children }: Props) {
  if (enabled) return <>{children}</>
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
        <Lock className="w-6 h-6 text-amber-500" />
      </div>
      <div>
        <p className="font-semibold text-gray-700">Recurso não disponível</p>
        <p className="text-sm text-gray-500 mt-1">
          {featureName ? `O recurso "${featureName}"` : 'Este recurso'} não está disponível no seu plano atual.
        </p>
      </div>
      <a href="/app/settings" className="btn btn-secondary btn-sm mt-2">Ver plano</a>
    </div>
  )
}
