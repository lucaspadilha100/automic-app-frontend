import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Clock } from 'lucide-react'

export default function WaitlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => (await apiClient.get('/units')).data,
  })

  if (isLoading) return <div><PageHeader title="Lista de espera" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Lista de espera" subtitle="Clientes aguardando disponibilidade" />
      <EmptyState icon={Clock} title="Lista de espera" description="Funcionalidade disponível por unidade. Selecione uma unidade para gerenciar." />
    </div>
  )
}
