const MAP: Record<string, string> = {
  active: 'badge-green', trial: 'badge-cyan', suspended: 'badge-red',
  inactive: 'badge-slate',
  scheduled: 'badge-blue', confirmed: 'badge-green', in_progress: 'badge-purple',
  completed: 'badge-slate', cancelled: 'badge-red', no_show: 'badge-orange',
  rescheduled: 'badge-yellow', draft: 'badge-slate', pending_payment: 'badge-yellow',
  pending: 'badge-yellow', paid: 'badge-green', overdue: 'badge-red',
  success: 'badge-green', failed: 'badge-red', started: 'badge-blue',
  sent: 'badge-green', error: 'badge-red',
  manual: 'badge-slate', automatic: 'badge-green', free: 'badge-cyan',
  open: 'badge-blue', resolved: 'badge-slate', closed: 'badge-slate',
  holiday: 'badge-orange', leave: 'badge-yellow', closure: 'badge-red',
  low: 'badge-slate', medium: 'badge-yellow', high: 'badge-orange', critical: 'badge-red',
}

const LABELS: Record<string, string> = {
  active: 'Ativo', trial: 'Trial', suspended: 'Suspenso', cancelled: 'Cancelado', inactive: 'Inativo',
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento',
  completed: 'Concluído', no_show: 'Não compareceu', rescheduled: 'Remarcado',
  draft: 'Rascunho', pending_payment: 'Ag. pagamento',
  pending: 'Pendente', paid: 'Pago', overdue: 'Vencido',
  success: 'Sucesso', failed: 'Falhou', started: 'Iniciado',
  sent: 'Enviado', error: 'Erro',
  manual: 'Manual', automatic: 'Automático', free: 'Grátis',
  open: 'Aberto', resolved: 'Resolvido', closed: 'Fechado',
  holiday: 'Feriado', leave: 'Folga', closure: 'Fechamento',
  low: 'Baixo', medium: 'Médio', high: 'Alto', critical: 'Crítico',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = MAP[status] || 'badge-slate'
  const label = LABELS[status] || status
  return <span className={cls}>{label}</span>
}
