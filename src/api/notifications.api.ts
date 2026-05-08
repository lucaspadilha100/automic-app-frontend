import { apiClient } from './client'
import type { NotificationLog } from '@/types'

export const notificationsApi = {
  getLogs: async (params?: { event_type?: string; status?: string; skip?: number; limit?: number }) => {
    const r = await apiClient.get<NotificationLog[]>('/notifications/logs', { params })
    return r.data
  },
}
