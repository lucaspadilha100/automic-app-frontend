import { apiClient } from './client'
import type { Payment, PaymentSummaryRow } from '@/types'

export interface PaymentDetail {
  id: string
  amount: number
  status: string
  payment_method: string
  paid_at: string | null
  customer_name: string | null
  service_name: string | null
  appointment_id: string
  registered_by_name: string | null
  registered_by_role: string | null
}

export const paymentsApi = {
  listAll: async (params?: { date?: string; date_from?: string; date_to?: string; status?: string }) => {
    const r = await apiClient.get<PaymentDetail[]>('/payments', { params })
    return r.data
  },

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
