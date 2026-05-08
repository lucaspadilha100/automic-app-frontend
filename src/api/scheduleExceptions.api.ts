import { apiClient } from './client'

export const scheduleExceptionsApi = {
  list: async (params?: { professional_id?: string; from_date?: string; to_date?: string }) =>
    (await apiClient.get('/schedule-exceptions', { params })).data,
  create: async (data: Record<string, unknown>) =>
    (await apiClient.post('/schedule-exceptions', data)).data,
  get: async (id: string) => (await apiClient.get(`/schedule-exceptions/${id}`)).data,
  update: async (id: string, data: Record<string, unknown>) =>
    (await apiClient.patch(`/schedule-exceptions/${id}`, data)).data,
  delete: async (id: string) => (await apiClient.delete(`/schedule-exceptions/${id}`)).data,
  bulkCancel: async (data: Record<string, unknown>) =>
    (await apiClient.post('/appointments/bulk-cancel', data)).data,
}
