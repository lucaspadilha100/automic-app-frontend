import { apiClient } from './client'
import type { Unit, UnitCreate, WaitlistEntry } from '@/types'

export const unitsApi = {
  list: async () => { const r = await apiClient.get<Unit[]>('/units'); return r.data },
  create: async (data: UnitCreate) => { const r = await apiClient.post<Unit>('/units', data); return r.data },
  get: async (id: string) => { const r = await apiClient.get<Unit>(`/units/${id}`); return r.data },
  update: async (id: string, data: UnitCreate) => { const r = await apiClient.put<Unit>(`/units/${id}`, data); return r.data },
  delete: async (id: string) => { const r = await apiClient.delete(`/units/${id}`); return r.data },
  listWaitlist: async (params?: { status?: string }) => { const r = await apiClient.get<WaitlistEntry[]>('/waitlist', { params }); return r.data },
  addToWaitlist: async (params: { customer_account_id: string; preferred_period?: string; preferred_professional_id?: string }) => {
    const r = await apiClient.post('/waitlist', null, { params }); return r.data
  },
  updateWaitlistStatus: async (id: string, status: string) => {
    const r = await apiClient.patch(`/waitlist/${id}/status`, null, { params: { status } }); return r.data
  },
}
