import { apiClient } from './client'
import type { Service, ServiceCreate, ServiceCategory } from '@/types'

export const servicesApi = {
  listCategories: async () => { const r = await apiClient.get<ServiceCategory[]>('/services/categories'); return r.data },
  createCategory: async (data: { name: string; description?: string; sort_order?: number }) => { const r = await apiClient.post<ServiceCategory>('/services/categories', data); return r.data },
  updateCategory: async (id: string, data: { name: string; description?: string; sort_order?: number }) => { const r = await apiClient.put<ServiceCategory>(`/services/categories/${id}`, data); return r.data },
  deleteCategory: async (id: string) => { const r = await apiClient.delete(`/services/categories/${id}`); return r.data },
  list: async (params?: { category_id?: string; active_only?: boolean }) => { const r = await apiClient.get<Service[]>('/services', { params }); return r.data },
  create: async (data: ServiceCreate) => { const r = await apiClient.post<Service>('/services', data); return r.data },
  get: async (id: string) => { const r = await apiClient.get<Service>(`/services/${id}`); return r.data },
  update: async (id: string, data: Partial<ServiceCreate>) => { const r = await apiClient.put<Service>(`/services/${id}`, data); return r.data },
  delete: async (id: string) => { const r = await apiClient.delete(`/services/${id}`); return r.data },
}
