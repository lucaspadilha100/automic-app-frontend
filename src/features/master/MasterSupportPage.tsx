import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonTable } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Headphones, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'

export default function MasterSupportPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Record<string,unknown> | null>(null)
  const [reply, setReply] = useState('')

  const { data: tickets, isLoading } = useQuery({ queryKey: ['master','support'], queryFn: () => masterApi.listSupportTickets() })

  const replyMut = useMutation({
    mutationFn: () => masterApi.replyTicket(selected!.id as string, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master','support'] })
      setReply('')
      toast.success('Resposta enviada')
    },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => masterApi.updateTicketStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master','support'] }),
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <div><PageHeader title="Suporte" /><SkeletonTable /></div>

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Suporte" subtitle="Tickets abertos pelos tenants" />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          {!tickets?.length ? <EmptyState icon={Headphones} title="Sem tickets" /> : (
            <div className="space-y-2">
              {tickets?.map((t: Record<string,unknown>) => (
                <div key={t.id as string}
                  onClick={() => setSelected(t)}
                  className={`card p-4 cursor-pointer transition-all ${selected?.id === t.id ? 'border-primary-400 ring-1 ring-primary-200' : 'hover:border-slate-300'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.subject as string}</p>
                    <StatusBadge status={t.status as string} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{t.category as string} · {t.priority as string}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="lg:col-span-2 card flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">{selected.subject as string}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selected.category as string} · {selected.priority as string}</p>
              </div>
              <select className="select text-xs h-8 px-2" value={selected.status as string}
                onChange={e => statusMut.mutate({ id: selected.id as string, status: e.target.value })}>
                {['open','pending','resolved','closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1 p-5 space-y-3 max-h-80 overflow-y-auto">
              {(selected.messages as {id:string;body:string;is_staff:boolean;created_at:string}[] || []).map(m => (
                <div key={m.id} className={`rounded-lg p-3 text-sm max-w-[80%] ${m.is_staff ? 'ml-auto bg-primary-50 text-primary-900' : 'bg-slate-100 text-slate-800'}`}>
                  <p>{m.body}</p>
                  <p className="text-[10px] mt-1 opacity-60">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <textarea className="input flex-1 resize-none" rows={2} placeholder="Sua resposta..."
                value={reply} onChange={e => setReply(e.target.value)} />
              <button className="btn-primary self-end" onClick={() => replyMut.mutate()} disabled={!reply || replyMut.isPending}>
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
