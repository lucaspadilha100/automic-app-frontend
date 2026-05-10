import { apiClient } from './client'

export const usersApi = {
  list: async () => (await apiClient.get('/users')).data,
  update: async (id: string, data: { name?: string; phone?: string; is_active?: boolean }) =>
    (await apiClient.put(`/users/${id}`, data)).data,
  deactivate: async (id: string) => (await apiClient.put(`/users/${id}`, { is_active: false })).data,

  // Invites
  listInvites: async () => (await apiClient.get('/users/invites')).data,
  sendInvite: async (data: { email: string; phone?: string; role: string }) =>
    (await apiClient.post('/users/invites', data)).data,
}
