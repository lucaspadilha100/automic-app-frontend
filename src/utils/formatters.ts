import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatDate = (iso: string) => {
  try { return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR }) } catch { return iso }
}
export const formatDateTime = (iso: string) => {
  try { return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) } catch { return iso }
}
export const formatTime = (iso: string) => {
  try { return format(parseISO(iso), 'HH:mm') } catch { return iso }
}
export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

export const statusLabel: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em Atendimento',
  completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não Compareceu', pending_payment: 'Aguardando Pagamento',
  active: 'Ativo', inactive: 'Inativo', suspended: 'Suspenso', trial: 'Trial', cancelled_tenant: 'Cancelado',
  paid: 'Pago', refunded: 'Estornado', pending: 'Pendente',
}
export const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
