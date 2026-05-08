import { AlertTriangle } from 'lucide-react'
import { extractApiError } from '@/api/client'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = extractApiError(error)
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <p className="font-medium text-gray-700">Ocorreu um erro</p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm mt-2">Tentar novamente</button>
      )}
    </div>
  )
}
