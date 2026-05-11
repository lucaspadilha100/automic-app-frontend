import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, CalendarDays, Users, Scissors, Package, CreditCard,
  Settings, Building2, BookOpen, Bell, Zap, Headphones,
  LogOut, ClipboardList, BarChart3, ClipboardCheck, Menu, X, TrendingUp, MessageCircle,
  Star, Tag, Images, ShoppingBag, FlaskConical, Lock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
import { useState } from 'react'
import toast from 'react-hot-toast'

type NavItem = {
  to: string
  label: string
  icon: React.ElementType
  feature?: string
}

type NavSection = {
  section: string
  items: NavItem[]
}

const baseNav: NavSection[] = [
  { section: 'Principal', items: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/calendar', label: 'Agenda', icon: Calendar },
    { to: '/app/appointments', label: 'Agendamentos', icon: CalendarDays },
  ]},
  { section: 'Cadastros', items: [
    { to: '/app/customers', label: 'Clientes', icon: Users },
    { to: '/app/professionals', label: 'Profissionais', icon: Scissors },
    { to: '/app/services', label: 'Serviços', icon: ClipboardList },
    { to: '/app/packages', label: 'Pacotes', icon: Package },
    { to: '/app/products', label: 'Produtos', icon: ShoppingBag, feature: 'ecommerce' },
    { to: '/app/supplies', label: 'Insumos', icon: FlaskConical, feature: 'product_usage' },
  ]},
  { section: 'Financeiro', items: [
    { to: '/app/payments', label: 'Pagamentos', icon: CreditCard },
    { to: '/app/commissions', label: 'Comissões', icon: BarChart3 },
  ]},
  { section: 'CRM', items: [
    { to: '/app/lifecycle', label: 'Lifecycle / CRM', icon: TrendingUp },
    { to: '/app/reports', label: 'Relatórios', icon: BarChart3 },
    { to: '/app/reviews', label: 'Avaliações', icon: Star },
    { to: '/app/coupons', label: 'Cupons', icon: Tag },
    { to: '/app/procedure-photos', label: 'Fotos Before/After', icon: Images },
  ]},
  { section: 'Operações', items: [
    { to: '/app/schedule', label: 'Horários', icon: BookOpen },
    { to: '/app/forms', label: 'Formulários', icon: ClipboardCheck },
    { to: '/app/automations', label: 'Automações', icon: Zap },
    { to: '/app/notifications', label: 'Notificações', icon: Bell },
    { to: '/app/units', label: 'Unidades', icon: Building2 },
  ]},
  { section: 'Sistema', items: [
    { to: '/app/support', label: 'Suporte', icon: Headphones },
    { to: '/app/settings/company', label: 'Minha Empresa', icon: Building2 },
    { to: '/app/settings', label: 'Configurações', icon: Settings },
  ]},
]

function LockedNavItem({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  function handleClick() {
    toast('Entre em contato para habilitar esta funcionalidade.', {
      icon: '🔒',
      duration: 4000,
    })
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      <Lock className="w-3 h-3 shrink-0 opacity-60" />
    </button>
  )
}

function NavContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: features } = useQuery({
    queryKey: ['effective-features'],
    queryFn: settingsApi.getEffectiveFeatures,
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  })

  const isProf = user?.role === 'professional'
  const isSuperAdmin = user?.role === 'super_admin'

  const nav: NavSection[] = isProf
    ? [{ section: 'Agenda', items: [
        { to: '/app/my-schedule', label: 'Minha Agenda', icon: CalendarDays },
        { to: '/app/customers', label: 'Clientes', icon: Users },
      ]}]
    : baseNav

  const handleLogout = () => {
    logout()
    localStorage.clear()
    navigate('/login')
  }

  function isEnabled(feature: string | undefined): boolean {
    if (!feature) return true
    if (isSuperAdmin) return true
    return !!(features?.[feature])
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary-400 flex items-center justify-center shrink-0">
          <span className="text-slate-900 font-black text-sm">A</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm tracking-tight leading-none">AUTOMIC</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user?.tenant_name || 'Booking'}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {nav.map(({ section, items }) => {
          const unlocked = items.filter(i => isEnabled(i.feature))
          const locked = items.filter(i => !isEnabled(i.feature))
          return (
            <div key={section}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">{section}</p>
              <div className="space-y-0.5">
                {unlocked.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-semibold border-l-2 border-primary-400 pl-[10px]'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
                {locked.map(({ to, label, icon }) => (
                  <LockedNavItem key={to} label={label} icon={icon} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-3 shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-700 font-bold text-xs">{user?.name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400">{user?.role}</p>
          </div>
          <button onClick={handleLogout} title="Sair" className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const handleClose = () => setMobileOpen(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200">
        <NavContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={handleClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-xl">
            <NavContent onClose={handleClose} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-slate-600 hover:text-slate-900">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary-400 flex items-center justify-center">
              <span className="text-slate-900 font-black text-xs">A</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">AUTOMIC</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
