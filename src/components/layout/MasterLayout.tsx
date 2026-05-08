import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CreditCard, Shield, Bell, LogOut,
  Settings, ListChecks, Activity, FileText, Headphones, Menu, X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'

const nav = [
  { to: '/master/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/master/tenants',       label: 'Empresas',      icon: Building2 },
  { to: '/master/plans',         label: 'Planos',        icon: CreditCard },
  { to: '/master/invoices',      label: 'Faturas',       icon: FileText },
  { to: '/master/jobs',          label: 'Jobs',          icon: ListChecks },
  { to: '/master/tasks',         label: 'Task Runs',     icon: Activity },
  { to: '/master/notifications', label: 'Notificações',  icon: Bell },
  { to: '/master/support',       label: 'Suporte',       icon: Headphones },
  { to: '/master/platform',      label: 'Plataforma',    icon: Settings },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); localStorage.clear(); navigate('/login') }

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-400 flex items-center justify-center shrink-0">
          <span className="text-slate-900 font-black text-sm">A</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm tracking-tight leading-none">AUTOMIC</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Console Master</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary-400/10 text-primary-400 border-l-2 border-primary-400 pl-[10px]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }>
            <Icon className="w-4 h-4 shrink-0" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3 shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
          <div className="w-7 h-7 rounded-full bg-primary-400/20 flex items-center justify-center shrink-0">
            <span className="text-primary-400 font-bold text-xs">{user?.name?.charAt(0) || 'A'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500">super_admin</p>
          </div>
          <button onClick={handleLogout} title="Sair" className="text-slate-500 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}

export function MasterLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-slate-900 border-r border-slate-800">
        <NavContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/80" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 flex flex-col shadow-xl">
            <NavContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-slate-900 border-b border-slate-800 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-400 flex items-center justify-center">
              <span className="text-slate-900 font-black text-xs">A</span>
            </div>
            <span className="font-bold text-white text-sm">AUTOMIC Master</span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
