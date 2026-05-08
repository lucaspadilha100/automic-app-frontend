import { apiClient } from './client'
import type { DashboardSummary, AppointmentsByStatus, RevenueByProfessional, RevenueByService, NewCustomersOverTime } from '@/types'

export const dashboardApi = {
  getSummary: async (params?: { date_from?: string; date_to?: string; professional_id?: string }) => {
    const res = await apiClient.get<DashboardSummary>('/dashboard', { params })
    return res.data
  },
  getAppointmentsByStatus: async (params?: { date_from?: string; date_to?: string }) => {
    const res = await apiClient.get<AppointmentsByStatus[]>('/reports/appointments-by-status', { params })
    return res.data
  },
  getRevenueByProfessional: async (params?: { date_from?: string; date_to?: string }) => {
    const res = await apiClient.get<RevenueByProfessional[]>('/reports/revenue-by-professional', { params })
    return res.data
  },
  getRevenueByService: async (params?: { date_from?: string; date_to?: string }) => {
    const res = await apiClient.get<RevenueByService[]>('/reports/revenue-by-service', { params })
    return res.data
  },
  getNewCustomersOverTime: async () => {
    const res = await apiClient.get<NewCustomersOverTime[]>('/reports/new-customers-over-time')
    return res.data
  },
  getOccupancyRate: async (params: { date_from: string; date_to: string; professional_id?: string }) => {
    const res = await apiClient.get('/reports/occupancy-rate', { params })
    return res.data
  },
}
