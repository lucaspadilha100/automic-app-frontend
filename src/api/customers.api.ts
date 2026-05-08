import { apiClient } from './client'
import type { Customer, CustomerNote, CustomerTag, ProcedureHistory, CustomerPackage } from '@/types'

// Backend POST /customers uses query params (name, phone, email, cpf, notes)
// Backend PUT /customers/:id uses query params (cpf, notes, internal_notes, marketing_consent)
// Backend POST /customers/:id/notes uses JSON body: CustomerNoteCreate { content?, note?, is_internal, visibility?, note_type }

export const customersApi = {
  list: async (params?: { search?: string; skip?: number; limit?: number }) => {
    const r = await apiClient.get<Customer[]>('/customers', { params })
    return r.data
  },

  // Backend: query params, not body
  create: async (data: { name: string; phone: string; email?: string; cpf?: string; notes?: string }) => {
    const r = await apiClient.post<Customer>('/customers', null, { params: data })
    return r.data
  },

  get: async (id: string) => {
    const r = await apiClient.get<Customer>(`/customers/${id}`)
    return r.data
  },

  // Backend: query params
  update: async (id: string, data: { cpf?: string; notes?: string; internal_notes?: string; marketing_consent?: boolean }) => {
    const r = await apiClient.put(`/customers/${id}`, null, { params: data })
    return r.data
  },

  getNotes: async (id: string) => {
    const r = await apiClient.get<CustomerNote[]>(`/customers/${id}/notes`)
    return r.data
  },

  // Backend body: { content?: string, note?: string, is_internal: bool, visibility?, note_type: string }
  addNote: async (id: string, data: { content: string; is_internal?: boolean; note_type?: string }) => {
    const r = await apiClient.post(`/customers/${id}/notes`, {
      content: data.content,
      note: data.content,
      is_internal: data.is_internal ?? true,
      note_type: data.note_type ?? 'manual',
    })
    return r.data
  },

  // Tags — note: /customers/tags order matters (before /:id routes)
  getTags: async () => {
    const r = await apiClient.get<CustomerTag[]>('/customers/tags')
    return r.data
  },

  createTag: async (data: { name: string; color?: string }) => {
    const r = await apiClient.post<CustomerTag>('/customers/tags', data)
    return r.data
  },

  linkTag: async (customerId: string, tagId: string) => {
    const r = await apiClient.post(`/customers/${customerId}/tags/${tagId}`)
    return r.data
  },

  unlinkTag: async (customerId: string, tagId: string) => {
    const r = await apiClient.delete(`/customers/${customerId}/tags/${tagId}`)
    return r.data
  },

  getProcedures: async (id: string) => {
    const r = await apiClient.get<ProcedureHistory[]>(`/customers/${id}/procedures`)
    return r.data
  },

  // Backend body: ProcedureHistoryCreate { title, description?, procedure_date, public_notes?, internal_notes?, recommended_return_date?, service_id?, professional_id? }
  addProcedure: async (id: string, data: {
    title: string
    description?: string
    procedure_date: string
    public_notes?: string
    internal_notes?: string
    recommended_return_date?: string
    service_id?: string
    professional_id?: string
  }) => {
    const r = await apiClient.post<ProcedureHistory>(`/customers/${id}/procedures`, data)
    return r.data
  },

  getAppointments: async (id: string) => {
    const r = await apiClient.get(`/customers/${id}/appointments`)
    return r.data
  },

  getPackages: async (id: string) => {
    const r = await apiClient.get<CustomerPackage[]>(`/customers/${id}/packages`)
    return r.data
  },

  // Backend body: CustomerPackageCreate { customer_account_id, package_id, price_paid?, purchase_price?, payment_status, notes? }
  assignPackage: async (id: string, data: {
    package_id: string
    customer_account_id: string
    payment_status?: string
    price_paid?: number
    notes?: string
  }) => {
    const r = await apiClient.post<CustomerPackage>(`/customers/${id}/packages`, {
      customer_account_id: data.customer_account_id,
      package_id: data.package_id,
      payment_status: data.payment_status ?? 'pending',
      price_paid: data.price_paid,
    })
    return r.data
  },
}
