import { apiClient } from './client'
import type { BusinessHour, BlockedTime } from '@/types'

export const scheduleApi = {
  getBusinessHours: async (unit_id?: string) => {
    const r = await apiClient.get<BusinessHour[]>('/schedule/business-hours', { params: { unit_id } })
    return r.data
  },
  setBusinessHours: async (data: Partial<BusinessHour>[], unit_id?: string) => {
    const r = await apiClient.put('/schedule/business-hours', data, { params: { unit_id } })
    return r.data
  },
  listBlockedTimes: async (params?: { professional_id?: string }) => {
    const r = await apiClient.get<BlockedTime[]>('/schedule/blocked-times', { params })
    return r.data
  },
  createBlockedTime: async (data: { professional_id?: string; start_datetime: string; end_datetime: string; reason?: string; block_type?: string }) => {
    const r = await apiClient.post<BlockedTime>('/schedule/blocked-times', data)
    return r.data
  },
  deleteBlockedTime: async (id: string) => { const r = await apiClient.delete(`/schedule/blocked-times/${id}`); return r.data },
}
