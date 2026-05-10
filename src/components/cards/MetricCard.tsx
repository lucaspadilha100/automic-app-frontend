import { LucideIcon } from 'lucide-react'

const colors: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  orange: 'bg-orange-50 text-orange-600',
  violet: 'bg-violet-50 text-violet-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  trend?: { value: number; label: string }
  suffix?: string
}

export function MetricCard({ title, value, icon: Icon, color = 'blue', trend, suffix }: MetricCardProps) {
  const iconCls = colors[color] || colors.blue
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-center justify-between gap-4 animate-fade-in">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
          {value}{suffix && <span className="text-lg font-medium text-slate-500 ml-1">{suffix}</span>}
        </p>
        {trend && (
          <p className={`text-xs mt-1.5 font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}
