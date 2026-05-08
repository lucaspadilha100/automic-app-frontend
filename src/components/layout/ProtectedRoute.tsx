import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCustomerAuthStore } from '@/stores/customerAuthStore'
import { useEffect } from 'react'
import { apiClient, INTERNAL_TOKEN_KEY } from '@/api/client'

export function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, isAuthenticated, setUser, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem(INTERNAL_TOKEN_KEY)
    if (token && !isAuthenticated) {
      setLoading(true)
      apiClient.get('/auth/me')
        .then(r => { setUser(r.data); setLoading(false) })
        .catch(() => { localStorage.removeItem(INTERNAL_TOKEN_KEY); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const token = localStorage.getItem(INTERNAL_TOKEN_KEY)
  if (!token) return <Navigate to="/login" replace />
  if (!isAuthenticated && !isLoading) return <Navigate to="/login" replace />
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/app/dashboard" replace />

  return <>{children}</>
}

export function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useCustomerAuthStore()
  if (!isAuthenticated) return <Navigate to="/customer/login" replace />
  return <>{children}</>
}
