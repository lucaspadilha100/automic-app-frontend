import { apiClient } from './client'
import type { AuditLog } from '@/types'

export const auditApi = {
  list: async (params?: { action?: string; entity_type?: string; date_from?: string; date_to?: string; skip?: number; limit?: number }) => {
    const r = await apiClient.get<{ total: number; items: AuditLog[] }>('/audit-logs', { params })
    return r.data
  },
  listActions: async () => { const r = await apiClient.get<string[]>('/audit-logs/actions'); return r.data },
}
