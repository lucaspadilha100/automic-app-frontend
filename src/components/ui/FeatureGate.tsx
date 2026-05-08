interface FeatureGateProps {
  enabled: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}
export function FeatureGate({ enabled, children, fallback = null }: FeatureGateProps) {
  return enabled ? <>{children}</> : <>{fallback}</>
}

export function FeatureUnavailable({ feature }: { feature?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
        <span className="text-2xl">🔒</span>
      </div>
      <p className="font-display font-semibold text-gray-700">Recurso não disponível</p>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        {feature ? `A funcionalidade "${feature}" não está disponível no seu plano atual.` : 'Esta funcionalidade não está disponível no seu plano atual.'}
        <br />Entre em contato para upgrade.
      </p>
    </div>
  )
}
