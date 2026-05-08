import { apiClient } from './client'
import type { MediaFile } from '@/types'

export const mediaApi = {
  list: async (params?: { file_type?: string; entity_type?: string; entity_id?: string }) => {
    const r = await apiClient.get<MediaFile[]>('/media', { params })
    return r.data
  },
  upload: async (file: File, file_type?: string, entity_type?: string, entity_id?: string) => {
    const form = new FormData()
    form.append('file', file)
    const r = await apiClient.post<MediaFile>('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { file_type, entity_type, entity_id }
    })
    return r.data
  },
  delete: async (id: string) => { const r = await apiClient.delete(`/media/${id}`); return r.data },
}
