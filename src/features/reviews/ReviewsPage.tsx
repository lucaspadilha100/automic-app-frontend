import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Review = {
  id: string
  appointment_id: string
  customer_account_id: string
  rating: number
  comment: string | null
  visibility: string
  created_at: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const { data, isLoading } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => (await apiClient.get('/reviews')).data,
  })

  const avg = data?.length
    ? (data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1)
    : null

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: data?.filter(r => r.rating === star).length || 0,
    pct: data?.length ? ((data.filter(r => r.rating === star).length / data.length) * 100) : 0,
  }))

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Avaliações"
        subtitle="Feedback dos clientes sobre os atendimentos"
      />

      {/* Summary */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-black text-amber-500">{avg}</p>
              <StarRating rating={Math.round(Number(avg))} />
              <p className="text-xs text-slate-400 mt-1">{data.length} avaliações</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {dist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-3">{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Distribuição</h3>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(star => {
                const count = data.filter(r => r.rating === star).length
                return (
                  <div key={star} className="text-center">
                    <p className="text-lg font-black text-slate-800">{count}</p>
                    <div className="flex justify-center">
                      <Star className={`w-3.5 h-3.5 ${star <= 3 ? 'text-amber-400 fill-amber-400' : 'text-amber-400 fill-amber-400'}`} />
                    </div>
                    <p className="text-[10px] text-slate-400">{star} estrela{star > 1 ? 's' : ''}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Todas as avaliações</h2>
        </div>
        {!data?.length ? (
          <EmptyState
            icon={Star}
            title="Nenhuma avaliação ainda"
            description="As avaliações são criadas pelos clientes após os atendimentos via portal do cliente"
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {data.map(review => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <StarRating rating={review.rating} />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        review.visibility === 'public'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {review.visibility === 'public' ? 'Público' : 'Interno'}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-700 mt-1">"{review.comment}"</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 shrink-0">
                    {format(new Date(review.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
