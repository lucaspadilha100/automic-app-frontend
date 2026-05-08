import { apiClient } from './client'
import type { Package, PackageCreate, CustomerPackage } from '@/types'

export const packagesApi = {
  list: async () => { const r = await apiClient.get<Package[]>('/packages'); return r.data },
  create: async (data: PackageCreate) => { const r = await apiClient.post<Package>('/packages', data); return r.data },
  get: async (id: string) => { const r = await apiClient.get<Package>(`/packages/${id}`); return r.data },
  update: async (id: string, data: Partial<PackageCreate>) => { const r = await apiClient.put<Package>(`/packages/${id}`, data); return r.data },
  delete: async (id: string) => { const r = await apiClient.delete(`/packages/${id}`); return r.data },
  getServices: async (id: string) => { const r = await apiClient.get(`/packages/${id}/services`); return r.data },
  addServices: async (id: string, service_ids: string[]) => { const r = await apiClient.post(`/packages/${id}/services`, { service_ids }); return r.data },
  removeService: async (pkgId: string, svcId: string) => { const r = await apiClient.delete(`/packages/${pkgId}/services/${svcId}`); return r.data },
  getCustomerPackage: async (id: string) => { const r = await apiClient.get<CustomerPackage>(`/packages/customer-packages/${id}`); return r.data },
  updateCustomerPackagePayment: async (id: string, payment_status: string) => {
    const r = await apiClient.patch(`/packages/customer-packages/${id}/payment`, null, { params: { payment_status } }); return r.data
  },
  cancelCustomerPackage: async (id: string) => { const r = await apiClient.post(`/packages/customer-packages/${id}/cancel`); return r.data },
  getCustomerPackageSessions: async (id: string) => { const r = await apiClient.get(`/packages/customer-packages/${id}/sessions`); return r.data },
}
