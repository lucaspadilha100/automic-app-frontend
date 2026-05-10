import { apiClient } from './client'

export const termsApi = {
  list: async (params?: { is_active?: boolean }) =>
    (await apiClient.get('/admin/terms', { params })).data,
  create: async (data: { term_type: string; title: string; content: string; version?: string }) =>
    (await apiClient.post('/admin/terms', data)).data,
  update: async (id: string, data: { title?: string; content?: string; version?: string }) =>
    (await apiClient.put(`/admin/terms/${id}`, data)).data,
  setStatus: async (id: string, is_active: boolean) =>
    (await apiClient.patch(`/admin/terms/${id}/status`, { is_active })).data,
}
