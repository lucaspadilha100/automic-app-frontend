import { create } from 'zustand'

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  tenant_id?: string
  tenant_name?: string
  tenant_slug?: string
}

interface InternalAuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<InternalAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

// Re-export for backward compat with old imports
export { useCustomerAuthStore } from './customerAuthStore'
