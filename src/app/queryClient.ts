import { QueryClient } from '@tanstack/react-query'
import { extractApiError, getErrorCode } from '@/api/client'
import toast from 'react-hot-toast'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: (failureCount, error) => {
        const code = getErrorCode(error)
        if (['UNAUTHORIZED', 'FORBIDDEN', 'FEATURE_DISABLED'].includes(code || '')) return false
        return failureCount < 2
      },
    },
    mutations: {
      onError: (error) => {
        const code = getErrorCode(error)
        const message = extractApiError(error)
        if (code === 'APPOINTMENT_CONFLICT') {
          toast.error('Este horário não está mais disponível. Por favor, escolha outro horário.')
        } else if (code === 'FEATURE_DISABLED') {
          toast.error('Recurso não disponível no seu plano.')
        } else if (code === 'PLAN_LIMIT_REACHED' || code?.includes('_LIMIT_REACHED')) {
          toast.error('Limite do plano atingido. Entre em contato para ampliar.')
        } else if (code !== 'UNAUTHORIZED') {
          toast.error(message)
        }
      },
    },
  },
})
