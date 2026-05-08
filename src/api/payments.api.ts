import { apiClient } from './client'
import type { Payment, PaymentSummaryRow } from '@/types'

// Backend POST /payments/appointments/:id/payments uses QUERY PARAMS (amount, payment_method, provider, provider_payment_id)
// Backend POST .../refund uses QUERY PARAM (reason)
// Backend GET /payments/summary uses QUERY PARAMS (date_from, date_to) as plain strings

export const paymentsApi = {
  list: async (appointmentId: string) => {
    const r = await apiClient.get<Payment[]>(`/payments/appointments/${appointmentId}/payments`)
    return r.data
  },

  // Backend: query params only
  register: async (appointmentId: string, params: {
    amount: number
    payment_method?: string
    provider?: string
    provider_payment_id?: string
  }) => {
    const r = await apiClient.post(
      `/payments/appointments/${appointmentId}/payments`,
      null,
      { params }
    )
    return r.data
  },

  // Backend: query param `reason`
  refund: async (appointmentId: string, paymentId: string, reason?: string) => {
    const r = await apiClient.post(
      `/payments/appointments/${appointmentId}/payments/${paymentId}/refund`,
      null,
      { params: { reason } }
    )
    return r.data
  },

  // Backend accepts date_from and date_to as plain strings (e.g. "2024-01-01")
  getSummary: async (params?: { date_from?: string; date_to?: string }) => {
    const r = await apiClient.get<PaymentSummaryRow[]>('/payments/summary', { params })
    return r.data
  },
}
