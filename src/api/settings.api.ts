import { apiClient } from './client'
import type { TenantSettings, TenantTheme, TenantPaymentSettings, NotificationTemplate, Webhook } from '@/types'

export const settingsApi = {
  get: async () => { const r = await apiClient.get('/settings'); return r.data },
  updateGeneral: async (data: Partial<TenantSettings>) => { const r = await apiClient.put('/settings/general', data); return r.data },
  updateTheme: async (data: Partial<TenantTheme>) => { const r = await apiClient.put('/settings/theme', data); return r.data },
  updateBookingPolicy: async (data: Record<string, unknown>) => { const r = await apiClient.put('/settings/booking-policy', data); return r.data },
  getPayment: async () => { const r = await apiClient.get<TenantPaymentSettings>('/settings/payment'); return r.data },
  updatePayment: async (data: Partial<TenantPaymentSettings>) => { const r = await apiClient.put('/settings/payment', data); return r.data },
  listNotificationTemplates: async () => { const r = await apiClient.get<NotificationTemplate[]>('/settings/notifications'); return r.data },
  createNotificationTemplate: async (data: { event_type: string; channel: string; subject?: string; body: string }) => { const r = await apiClient.post('/settings/notifications', data); return r.data },
  updateNotificationTemplate: async (id: string, data: { event_type: string; channel: string; body: string }) => { const r = await apiClient.put(`/settings/notifications/${id}`, data); return r.data },
  listWebhooks: async () => { const r = await apiClient.get<Webhook[]>('/settings/webhooks'); return r.data },
  createWebhook: async (data: { url: string; secret?: string; event_types?: string[]; is_active?: boolean }) => { const r = await apiClient.post<Webhook>('/settings/webhooks', data); return r.data },
  updateWebhook: async (id: string, data: { url: string; is_active?: boolean }) => { const r = await apiClient.put<Webhook>(`/settings/webhooks/${id}`, data); return r.data },
  deleteWebhook: async (id: string) => { const r = await apiClient.delete(`/settings/webhooks/${id}`); return r.data },
}
