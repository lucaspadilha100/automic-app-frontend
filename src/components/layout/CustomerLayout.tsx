import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Package, User, LogOut } from 'lucide-react'
import { useCustomerAuthStore } from '@/stores/authStore'
import { customerAuthApi } from '@/api/customerAuth.api'

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { customer, logout } = useCustomerAuthStore()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()

  const handleLogout = () => {
    customerAuthApi.logout()
    logout()
    navigate('/customer/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{customer?.name}</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost p-2 rounded-lg text-gray-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>

      {slug && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
          <div className="max-w-lg mx-auto flex">
            {[
              { to: `/customer/tenants/${slug}/appointments`, icon: Calendar, label: 'Agendamentos' },
              { to: `/customer/tenants/${slug}/packages`, icon: Package, label: 'Pacotes' },
              { to: `/customer/tenants/${slug}/profile`, icon: User, label: 'Perfil' },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400'}`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
