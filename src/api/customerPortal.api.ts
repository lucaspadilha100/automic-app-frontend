import { customerApiClient } from './client'
import type { CustomerAccount, CustomerPortalProfile, Appointment, CustomerPackage, ProcedureHistory } from '@/types'

export const customerPortalApi = {
  getMe: async () => { const r = await customerApiClient.get<CustomerAccount>('/customer/me'); return r.data },
  updateMe: async (data: { name?: string; email?: string; phone?: string }) => { const r = await customerApiClient.put<CustomerAccount>('/customer/me', data); return r.data },
  getProfile: async (slug: string) => { const r = await customerApiClient.get<CustomerPortalProfile>(`/customer/tenants/${slug}/profile`); return r.data },
  updateProfile: async (slug: string, data: Partial<CustomerPortalProfile>) => { const r = await customerApiClient.put(`/customer/tenants/${slug}/profile`, data); return r.data },
  getAppointments: async (slug: string) => { const r = await customerApiClient.get<Appointment[]>(`/customer/tenants/${slug}/appointments`); return r.data },
  getAppointment: async (slug: string, id: string) => { const r = await customerApiClient.get<Appointment>(`/customer/tenants/${slug}/appointments/${id}`); return r.data },
  cancelAppointment: async (slug: string, id: string, reason?: string) => { const r = await customerApiClient.post(`/customer/tenants/${slug}/appointments/${id}/cancel`, { reason }); return r.data },
  rescheduleAppointment: async (slug: string, id: string, data: { new_start_datetime: string; reason?: string }) => { const r = await customerApiClient.post(`/customer/tenants/${slug}/appointments/${id}/reschedule`, data); return r.data },
  getPackages: async (slug: string) => { const r = await customerApiClient.get<CustomerPackage[]>(`/customer/tenants/${slug}/packages`); return r.data },
  getPackage: async (slug: string, id: string) => { const r = await customerApiClient.get<CustomerPackage>(`/customer/tenants/${slug}/packages/${id}`); return r.data },
  getProcedureHistory: async (slug: string) => { const r = await customerApiClient.get<ProcedureHistory[]>(`/customer/tenants/${slug}/procedure-history`); return r.data },
  getAppointmentReview: async (slug: string, appointmentId: string) => {
    const r = await customerApiClient.get(`/customer/tenants/${slug}/appointments/${appointmentId}/review`)
    return r.data as { id: string; rating: number; comment: string | null } | null
  },
  submitReview: async (slug: string, appointmentId: string, data: { rating: number; comment?: string }) => {
    const r = await customerApiClient.post(`/customer/tenants/${slug}/appointments/${appointmentId}/review`, data)
    return r.data
  },
}
