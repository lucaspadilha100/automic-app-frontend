import { publicApiClient, customerApiClient } from './client'
import type { PublicTenantInfo, Professional, Appointment, AppointmentCreate } from '@/types'

// Backend GET /:slug/services returns { categories: [...], services: [...] } — NOT Service[]
// Backend POST /:slug/appointments requires customer token (uses get_optional_customer)
// Backend GET /:slug/professionals returns array with { id, name, bio, photo_url, service_ids }

export interface PublicServicesResponse {
  categories: Array<{ id: string; name: string; description?: string }>
  services: Array<{
    id: string
    name: string
    description?: string
    category_id?: string
    price?: number | null
    duration_minutes?: number | null
    requires_deposit: boolean
    image_url?: string
  }>
}

export const publicApi = {
  getInfo: async (slug: string): Promise<PublicTenantInfo> => {
    const r = await publicApiClient.get<PublicTenantInfo>(`/public/${slug}`)
    return r.data
  },

  // Returns { categories, services } — not a plain array
  getServices: async (slug: string): Promise<PublicServicesResponse> => {
    const r = await publicApiClient.get<PublicServicesResponse>(`/public/${slug}/services`)
    return r.data
  },

  getProfessionals: async (slug: string): Promise<Professional[]> => {
    const r = await publicApiClient.get<Professional[]>(`/public/${slug}/professionals`)
    return r.data
  },

  // service_ids is array — axios will serialize as repeated param ?service_ids=x&service_ids=y
  getAvailability: async (slug: string, params: {
    service_ids: string[]
    target_date: string
    professional_id?: string
  }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('target_date', params.target_date)
    params.service_ids.forEach(id => searchParams.append('service_ids', id))
    if (params.professional_id) searchParams.set('professional_id', params.professional_id)
    const r = await publicApiClient.get(`/public/${slug}/availability?${searchParams.toString()}`, {
      params: undefined,
      paramsSerializer: (p) => {
        const parts: string[] = []
        if (p.service_ids) {
          for (const id of p.service_ids) parts.push(`service_ids=${encodeURIComponent(id)}`)
        }
        if (p.target_date) parts.push(`target_date=${encodeURIComponent(p.target_date)}`)
        if (p.professional_id) parts.push(`professional_id=${encodeURIComponent(p.professional_id)}`)
        return parts.join('&')
      },
    })
    return r.data
  },

  // Requires customer JWT — uses customerApiClient
  createAppointment: async (slug: string, data: Omit<AppointmentCreate, 'source'>) => {
    const r = await customerApiClient.post<Appointment>(`/public/${slug}/appointments`, {
      ...data,
      source: 'public_page',
    })
    return r.data
  },

  // Cancel: body { reason?: string }
  cancelAppointment: async (slug: string, appointmentId: string, reason?: string) => {
    const r = await customerApiClient.post(
      `/public/${slug}/appointments/${appointmentId}/cancel`,
      { reason }
    )
    return r.data
  },

  getMyAppointments: async (slug: string) => {
    const r = await customerApiClient.get<Appointment[]>(`/public/${slug}/my-appointments`)
    return r.data
  },
}
