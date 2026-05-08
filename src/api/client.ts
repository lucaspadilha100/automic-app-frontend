import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// ---- Internal user client ----
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ---- Customer client ----
export const customerApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ---- Public client (no auth) ----
export const publicApiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ---- Token keys ----
export const INTERNAL_TOKEN_KEY = 'automiq_internal_token'
export const CUSTOMER_TOKEN_KEY = 'automiq_customer_token'

// ---- Internal interceptors ----
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(INTERNAL_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(INTERNAL_TOKEN_KEY)
      localStorage.removeItem('automiq_internal_refresh')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ---- Customer interceptors ----
customerApiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

customerApiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY)
      localStorage.removeItem('automiq_customer_refresh')
      window.location.href = '/customer/login'
    }
    return Promise.reject(error)
  }
)

// ---- Error utilities ----
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data?.message) return data.message
    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail
      if (Array.isArray(data.detail)) return data.detail.map((d: { msg: string }) => d.msg).join(', ')
    }
    return error.message
  }
  return 'Ocorreu um erro inesperado.'
}

export function getErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) return error.response?.data?.code ?? null
  return null
}
