import { customerApiClient, CUSTOMER_TOKEN_KEY } from './client'
import type { CustomerAccount, AuthTokens, CustomerLoginRequest, CustomerRegisterRequest } from '@/types'

export const customerAuthApi = {
  register: async (data: CustomerRegisterRequest): Promise<AuthTokens> => {
    const res = await customerApiClient.post<AuthTokens>('/customer-auth/register', data)
    localStorage.setItem(CUSTOMER_TOKEN_KEY, res.data.access_token)
    if (res.data.refresh_token) localStorage.setItem('automiq_customer_refresh', res.data.refresh_token)
    return res.data
  },
  login: async (data: CustomerLoginRequest): Promise<AuthTokens> => {
    const res = await customerApiClient.post<AuthTokens>('/customer-auth/login', data)
    localStorage.setItem(CUSTOMER_TOKEN_KEY, res.data.access_token)
    if (res.data.refresh_token) localStorage.setItem('automiq_customer_refresh', res.data.refresh_token)
    return res.data
  },
  me: async (): Promise<CustomerAccount> => {
    const res = await customerApiClient.get<CustomerAccount>('/customer-auth/me')
    return res.data
  },
  logout: () => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY)
    localStorage.removeItem('automiq_customer_refresh')
  },
  forgotPassword: async (email: string) => {
    const res = await customerApiClient.post('/customer-auth/forgot-password', { email })
    return res.data
  },
  resetPassword: async (token: string, new_password: string) => {
    const res = await customerApiClient.post('/customer-auth/reset-password', { token, new_password })
    return res.data
  },
}
