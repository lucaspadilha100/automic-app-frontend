import { apiClient } from './client'
import type { Professional, ProfessionalCreate, ProfessionalAvailability } from '@/types'

export const professionalsApi = {
  list: async (params?: { active_only?: boolean }) => { const r = await apiClient.get<Professional[]>('/professionals', { params }); return r.data },
  create: async (data: ProfessionalCreate) => { const r = await apiClient.post<Professional>('/professionals', data); return r.data },
  get: async (id: string) => { const r = await apiClient.get<Professional>(`/professionals/${id}`); return r.data },
  update: async (id: string, data: Partial<ProfessionalCreate> & { is_active?: boolean }) => { const r = await apiClient.put<Professional>(`/professionals/${id}`, data); return r.data },
  delete: async (id: string) => { const r = await apiClient.delete(`/professionals/${id}`); return r.data },
  getServices: async (id: string) => { const r = await apiClient.get<{ service_ids: string[] }>(`/professionals/${id}/services`); return r.data },
  setServices: async (id: string, service_ids: string[]) => { const r = await apiClient.put(`/professionals/${id}/services`, { service_ids }); return r.data },
  getAvailability: async (id: string) => { const r = await apiClient.get<ProfessionalAvailability[]>(`/professionals/${id}/availability`); return r.data },
  setAvailability: async (id: string, data: ProfessionalAvailability[]) => { const r = await apiClient.put(`/professionals/${id}/availability`, data); return r.data },
}
