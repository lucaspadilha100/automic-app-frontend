import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaApi } from '@/api/media.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { MediaFile } from '@/types'
import { Image, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
export default function MediaPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null)
  const { data, isLoading } = useQuery({ queryKey: ['media'], queryFn: () => mediaApi.list() })
  const uploadMutation = useMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); toast.success('Arquivo enviado') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); setDeleteTarget(null); toast.success('Removido') },
  })
  if (isLoading) return <LoadingState />
  return (
    <div>
      <PageHeader title="Mídia" actions={<>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f) }} />
        <button onClick={() => fileRef.current?.click()} className="btn btn-primary btn-md"><Upload className="w-4 h-4" /> Enviar</button>
      </>} />
      {data && data.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {data.map((m) => (
            <div key={m.id} className="relative group card overflow-hidden">
              <img src={m.file_url} alt={m.file_type} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <button onClick={() => setDeleteTarget(m)} className="opacity-0 group-hover:opacity-100 btn btn-danger btn-sm p-1.5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="p-2"><p className="text-xs text-gray-500 truncate">{m.file_type}</p></div>
            </div>
          ))}
        </div>
      ) : <div className="card"><EmptyState icon={Image} title="Nenhum arquivo" /></div>}
      <ConfirmDialog open={!!deleteTarget} title="Remover arquivo" onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} danger loading={deleteMutation.isPending} />
    </div>
  )
}
