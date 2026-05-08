import { apiClient } from './client'

const M = '/master'

export const masterApi = {
  // ---- Tenants ----
  listTenants: async (params?: { status?: string; skip?: number; limit?: number }) => {
    return (await apiClient.get(`${M}/tenants`, { params })).data
  },
  createTenant: async (data: Record<string, unknown>) => {
    const { owner_email, owner_name, owner_password, ...body } = data as Record<string, string>
    return (await apiClient.post(`${M}/tenants`, body, { params: { owner_email, owner_name, owner_password } })).data
  },
  getTenant: async (id: string) => (await apiClient.get(`${M}/tenants/${id}`)).data,
  updateTenant: async (id: string, data: Record<string, unknown>) => (await apiClient.put(`${M}/tenants/${id}`, data)).data,
  updateTenantStatus: async (id: string, status: string) => (await apiClient.patch(`${M}/tenants/${id}/status`, { status })).data,

  // ---- Plans ----
  listPlans: async () => (await apiClient.get(`${M}/plans`)).data,
  createPlan: async (data: Record<string, unknown>) => (await apiClient.post(`${M}/plans`, data)).data,
  updatePlan: async (id: string, data: Record<string, unknown>) => (await apiClient.put(`${M}/plans/${id}`, data)).data,

  // ---- Subscription ----
  updateSubscription: async (tenantId: string, data: Record<string, unknown>) =>
    (await apiClient.put(`${M}/tenants/${tenantId}/subscription`, data)).data,

  // ---- Limit Overrides ----
  getLimitOverrides: async (tenantId: string) => (await apiClient.get(`${M}/tenants/${tenantId}/limit-overrides`)).data,
  updateLimitOverrides: async (tenantId: string, data: Record<string, unknown>) =>
    (await apiClient.put(`${M}/tenants/${tenantId}/limit-overrides`, data)).data,

  // ---- Features ----
  getFeatures: async (tenantId: string) => (await apiClient.get(`${M}/tenants/${tenantId}/features`)).data,
  updateFeature: async (tenantId: string, feature_key: string, enabled: boolean) =>
    (await apiClient.put(`${M}/tenants/${tenantId}/features`, { feature_key, enabled, source: 'manual' })).data,

  // ---- Settings & Theme ----
  getTenantSettings: async (tenantId: string) => (await apiClient.get(`${M}/tenants/${tenantId}/settings`)).data,
  updateTenantSettings: async (tenantId: string, data: Record<string, unknown>) =>
    (await apiClient.put(`${M}/tenants/${tenantId}/settings`, data)).data,
  getTenantTheme: async (tenantId: string) => (await apiClient.get(`${M}/tenants/${tenantId}/theme`)).data,
  updateTenantTheme: async (tenantId: string, data: Record<string, unknown>) =>
    (await apiClient.put(`${M}/tenants/${tenantId}/theme`, data)).data,

  // ---- Audit Logs ----
  getTenantAuditLogs: async (tenantId: string, params?: { skip?: number; limit?: number }) =>
    (await apiClient.get(`${M}/tenants/${tenantId}/audit-logs`, { params })).data,

  // ---- Health ----
  getTenantsHealth: async () => (await apiClient.get(`${M}/health/tenants`)).data,

  // ---- Invoices ----
  listInvoices: async (params?: { tenant_id?: string; status?: string }) =>
    (await apiClient.get(`${M}/invoices`, { params })).data,
  getInvoice: async (id: string) => (await apiClient.get(`${M}/invoices/${id}`)).data,
  markInvoicePaid: async (id: string, data: Record<string, unknown>) =>
    (await apiClient.post(`${M}/invoices/${id}/mark-paid`, data)).data,
  cancelInvoice: async (id: string, reason: string) =>
    (await apiClient.post(`${M}/invoices/${id}/cancel`, { reason })).data,

  // ---- Billing mode & manual payment (Expansion 4) ----
  getBillingMode: async (tenantId: string) =>
    (await apiClient.get(`${M}/tenants/${tenantId}/billing-mode`)).data,
  updateBillingMode: async (tenantId: string, billing_mode: string) =>
    (await apiClient.patch(`${M}/tenants/${tenantId}/billing-mode`, { billing_mode })).data,
  manualPayment: async (tenantId: string, data: Record<string, unknown>) =>
    (await apiClient.post(`${M}/tenants/${tenantId}/manual-payment`, data)).data,

  // ---- Jobs ----
  runJob: async (jobName: string) => (await apiClient.post(`${M}/jobs/${jobName}`)).data,

  // ---- Task runs ----
  listTaskRuns: async (params?: { task_name?: string; status?: string; limit?: number; offset?: number }) =>
    (await apiClient.get(`${M}/tasks`, { params })).data,

  // ---- Notifications ----
  listNotifications: async () => (await apiClient.get(`${M}/notifications`)).data,
  getUnreadCount: async () => (await apiClient.get(`${M}/notifications/unread-count`)).data,
  markRead: async (id: string) => (await apiClient.patch(`${M}/notifications/${id}/read`)).data,
  markAllRead: async () => (await apiClient.post(`${M}/notifications/mark-all-read`)).data,

  // ---- Platform ----
  getPlatformSettings: async () => (await apiClient.get(`${M}/platform/settings`)).data,
  updatePlatformSettings: async (data: Record<string, unknown>) => (await apiClient.put(`${M}/platform/settings`, data)).data,
  getPlatformDocument: async (type: string) => (await apiClient.get(`${M}/platform/documents/${type}`)).data,
  updatePlatformDocument: async (type: string, data: Record<string, unknown>) =>
    (await apiClient.put(`${M}/platform/documents/${type}`, data)).data,

  // ---- Support ----
  listSupportTickets: async (params?: Record<string, unknown>) =>
    (await apiClient.get(`${M}/support/tickets`, { params })).data,
  getSupportTicket: async (id: string) => (await apiClient.get(`${M}/support/tickets/${id}`)).data,
  replyTicket: async (id: string, body: string) =>
    (await apiClient.post(`${M}/support/tickets/${id}/messages`, { body })).data,
  updateTicketStatus: async (id: string, status: string) =>
    (await apiClient.patch(`${M}/support/tickets/${id}/status`, { status })).data,

  // ---- MRR ----
  getMrr: async () => (await apiClient.get(`${M}/metrics/mrr`)).data,
}
