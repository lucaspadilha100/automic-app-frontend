import { apiClient } from './client'

export const suppliesApi = {
  list: async (params?: { is_active?: boolean }) =>
    (await apiClient.get('/supplies', { params })).data,
  get: async (id: string) => (await apiClient.get(`/supplies/${id}`)).data,
  create: async (data: Record<string, unknown>) => (await apiClient.post('/supplies', data)).data,
  update: async (id: string, data: Record<string, unknown>) =>
    (await apiClient.put(`/supplies/${id}`, data)).data,
  delete: async (id: string) => (await apiClient.delete(`/supplies/${id}`)).data,
  adjustStock: async (id: string, adjustment: number, reason?: string) =>
    (await apiClient.post(`/supplies/${id}/adjust-stock`, { adjustment, reason })).data,

  getAppointmentUsage: async (appointmentId: string) =>
    (await apiClient.get(`/appointments/${appointmentId}/supply-usage`)).data,
  addUsage: async (appointmentId: string, data: { supply_id: string; quantity_used: number; notes?: string }) =>
    (await apiClient.post(`/appointments/${appointmentId}/supply-usage`, data)).data,
  removeUsage: async (appointmentId: string, usageId: string) =>
    (await apiClient.delete(`/appointments/${appointmentId}/supply-usage/${usageId}`)).data,
}
