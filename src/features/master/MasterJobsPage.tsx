import { useMutation } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Play, Clock, CreditCard, Bell, RefreshCw, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

const JOBS = [
  { id: 'generate-monthly-invoices', label: 'Gerar faturas mensais', desc: 'Cria faturas para todos os tenants no mês atual', icon: CreditCard, color: 'blue' },
  { id: 'mark-overdue-invoices', label: 'Marcar faturas vencidas', desc: 'Atualiza status das faturas cujo due_date já passou', icon: AlertTriangle, color: 'orange' },
  { id: 'enforce-billing', label: 'Enforcement de billing', desc: 'Suspende/cancela tenants por inadimplência (somente billing_mode=automatic)', icon: RefreshCw, color: 'red' },
  { id: 'run-trial-expiration', label: 'Expirar trials', desc: 'Suspende tenants cujo trial acabou', icon: Clock, color: 'yellow' },
  { id: 'send-24h-reminders', label: 'Lembretes 24h', desc: 'Envia notificações de agendamentos de amanhã', icon: Bell, color: 'green' },
]

const iconColors: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600', yellow: 'bg-amber-50 text-amber-600', green: 'bg-emerald-50 text-emerald-600',
}

export default function MasterJobsPage() {
  const runMut = useMutation({
    mutationFn: (job: string) => masterApi.runJob(job),
    onSuccess: (_, job) => toast.success(`Job "${job}" executado com sucesso`),
    onError: (e) => toast.error(extractApiError(e)),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Jobs" subtitle="Execute operações de manutenção e cobrança manualmente" />
      <div className="grid gap-4">
        {JOBS.map(({ id, label, desc, icon: Icon, color }) => (
          <div key={id} className="card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColors[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
            <button className="btn-secondary shrink-0"
              onClick={() => runMut.mutate(id)}
              disabled={runMut.isPending}>
              <Play className="w-4 h-4" /> Executar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
