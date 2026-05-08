import { apiClient } from './client'
import type { Resource } from '@/types'

export const resourcesApi = {
  list: async () => { const r = await apiClient.get<Resource[]>('/resources'); return r.data },
  create: async (data: { name: string; type?: string; description?: string; unit_id?: string }) => { const r = await apiClient.post<Resource>('/resources', data); return r.data },
  get: async (id: string) => { const r = await apiClient.get<Resource>(`/resources/${id}`); return r.data },
  update: async (id: string, data: { name: string; type?: string; description?: string }) => { const r = await apiClient.put<Resource>(`/resources/${id}`, data); return r.data },
  delete: async (id: string) => { const r = await apiClient.delete(`/resources/${id}`); return r.data },
  linkToService: async (serviceId: string, resourceId: string) => { const r = await apiClient.post(`/resources/services/${serviceId}/resources/${resourceId}`); return r.data },
  unlinkFromService: async (serviceId: string, resourceId: string) => { const r = await apiClient.delete(`/resources/services/${serviceId}/resources/${resourceId}`); return r.data },
  getServiceResources: async (serviceId: string) => { const r = await apiClient.get(`/resources/services/${serviceId}/resources`); return r.data },
}
