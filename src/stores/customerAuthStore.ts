import { create } from 'zustand'
import { CUSTOMER_TOKEN_KEY } from '@/api/client'

const CUSTOMER_DATA_KEY = 'automiq_customer_data'

interface CustomerAccount {
  id: string
  name: string
  email?: string
  phone?: string
}

interface CustomerAuthState {
  customer: CustomerAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (customer: CustomerAccount, token: string) => void
  setCustomer: (customer: CustomerAccount | null) => void
  clearAuth: () => void
  setLoading: (v: boolean) => void
  logout: () => void
}

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  customer: (() => {
    try { const s = localStorage.getItem(CUSTOMER_DATA_KEY); return s ? JSON.parse(s) : null } catch { return null }
  })(),
  isAuthenticated: !!localStorage.getItem(CUSTOMER_TOKEN_KEY),
  isLoading: false,
  setAuth(customer, token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
    localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customer))
    set({ customer, isAuthenticated: true })
  },
  setCustomer(customer) {
    if (customer) {
      localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customer))
      set({ customer, isAuthenticated: !!localStorage.getItem(CUSTOMER_TOKEN_KEY) })
    } else {
      set({ customer: null, isAuthenticated: false })
    }
  },
  clearAuth() {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY)
    localStorage.removeItem(CUSTOMER_DATA_KEY)
    localStorage.removeItem('automiq_customer_refresh')
    set({ customer: null, isAuthenticated: false })
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout() {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY)
    localStorage.removeItem(CUSTOMER_DATA_KEY)
    localStorage.removeItem('automiq_customer_refresh')
    set({ customer: null, isAuthenticated: false })
  },
}))
