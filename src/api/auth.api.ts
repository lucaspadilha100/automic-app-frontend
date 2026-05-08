import { apiClient, INTERNAL_TOKEN_KEY } from './client'
import type { AuthUser, AuthTokens, LoginRequest } from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthTokens> => {
    const res = await apiClient.post<AuthTokens>('/auth/login', data)
    localStorage.setItem(INTERNAL_TOKEN_KEY, res.data.access_token)
    if (res.data.refresh_token) localStorage.setItem('automiq_internal_refresh', res.data.refresh_token)
    return res.data
  },
  me: async (): Promise<AuthUser> => {
    const res = await apiClient.get<AuthUser>('/auth/me')
    return res.data
  },
  logout: () => {
    localStorage.removeItem(INTERNAL_TOKEN_KEY)
    localStorage.removeItem('automiq_internal_refresh')
  },
  forgotPassword: async (email: string) => {
    const res = await apiClient.post('/auth/forgot-password', { email })
    return res.data
  },
  resetPassword: async (token: string, new_password: string) => {
    const res = await apiClient.post('/auth/reset-password', { token, new_password })
    return res.data
  },
}
