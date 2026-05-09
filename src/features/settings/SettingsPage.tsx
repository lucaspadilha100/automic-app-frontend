
import { NavLink, Outlet } from 'react-router-dom'
import { Settings, CreditCard, Palette, Bell, MessageCircle } from 'lucide-react'
const tabs = [
  { to: '/app/settings', label: 'Geral', icon: Settings, end: true },
  { to: '/app/settings/booking', label: 'Agendamento', icon: Settings },
  { to: '/app/settings/payment', label: 'Pagamento', icon: CreditCard },
  { to: '/app/settings/theme', label: 'Tema', icon: Palette },
  { to: '/app/settings/notifications', label: 'Notificações', icon: Bell },
  { to: '/app/settings/webhooks', label: 'Webhooks', icon: Settings },
  { to: '/app/settings/whatsapp', label: 'WhatsApp', icon: MessageCircle },
]
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4 font-display">Configurações</h1>
      <div className="flex gap-1.5 mb-6 flex-wrap border-b border-gray-100 pb-3">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
