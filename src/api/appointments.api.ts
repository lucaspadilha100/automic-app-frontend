import { apiClient } from './client'

export const appointmentsApi = {
  list: async (params?: Record<string, unknown>) =>
    (await apiClient.get('/appointments', { params })).data,
  get: async (id: string) => (await apiClient.get(`/appointments/${id}`)).data,
  create: async (data: Record<string, unknown>) =>
    (await apiClient.post('/appointments', data)).data,
  confirm: async (id: string) => (await apiClient.post(`/appointments/${id}/confirm`)).data,
  start: async (id: string) => (await apiClient.post(`/appointments/${id}/start`)).data,
  complete: async (id: string, notes?: string) =>
    (await apiClient.post(`/appointments/${id}/complete`, notes ? { notes } : {})).data,
  cancel: async (id: string, reason: string) =>
    (await apiClient.post(`/appointments/${id}/cancel`, { reason })).data,
  noShow: async (id: string) => (await apiClient.post(`/appointments/${id}/no-show`)).data,
  reschedule: async (id: string, new_start_datetime: string, reason?: string) =>
    (await apiClient.post(`/appointments/${id}/reschedule`, { new_start_datetime, reason })).data,
  statusHistory: async (id: string) =>
    (await apiClient.get(`/appointments/${id}/status-history`)).data,
  slots: async (params: { date: string; service_ids: string[]; professional_id?: string }) => {
    // Backend expects: target_date, service_ids as repeated query params, professional_id
    const searchParams = new URLSearchParams()
    searchParams.set('target_date', params.date)
    params.service_ids.forEach(id => searchParams.append('service_ids', id))
    if (params.professional_id) searchParams.set('professional_id', params.professional_id)
    return (await apiClient.get(`/availability/slots?${searchParams.toString()}`)).data
  },
  publicSlots: async (slug: string, params: Record<string, unknown>) =>
    (await apiClient.get(`/public/${slug}/availability`, { params })).data,
}
