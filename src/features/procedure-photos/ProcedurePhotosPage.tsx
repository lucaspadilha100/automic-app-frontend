import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, extractApiError } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Images, Upload, X, ChevronDown, ChevronUp, Trash2, Eye, EyeOff } from 'lucide-react'
import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ProcedureHistory = {
  id: string
  tenant_customer_id: string
  appointment_id: string | null
  title: string
  description: string | null
  procedure_date: string
  photo_count: number
}

type Photo = {
  id: string
  photo_type: string
  visibility: string
  caption: string | null
  file_url: string | null
  original_filename: string | null
  created_at: string
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: 'Antes',
  after: 'Depois',
  progress: 'Progresso',
  other: 'Outro',
}

function PhotoGallery({ procedureId }: { procedureId: string }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoType, setPhotoType] = useState('before')
  const [visibility, setVisibility] = useState('internal')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ['procedure-photos', procedureId],
    queryFn: async () => (await apiClient.get(`/admin/procedure-history/${procedureId}/photos`)).data,
  })

  const deleteMut = useMutation({
    mutationFn: (photoId: string) =>
      apiClient.delete(`/admin/procedure-history/${procedureId}/photos/${photoId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['procedure-photos', procedureId] })
      qc.invalidateQueries({ queryKey: ['procedure-histories'] })
      toast.success('Foto removida')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('file_type', 'before_after')
      const uploadRes = await apiClient.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const mediaFileId = uploadRes.data.id

      await apiClient.post(`/admin/procedure-history/${procedureId}/photos`, {
        media_file_id: mediaFileId,
        photo_type: photoType,
        visibility,
        caption: caption || null,
      })

      qc.invalidateQueries({ queryKey: ['procedure-photos', procedureId] })
      qc.invalidateQueries({ queryKey: ['procedure-histories'] })
      setCaption('')
      toast.success('Foto adicionada')
    } catch (e: unknown) {
      toast.error(extractApiError(e))
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) return <div className="py-4"><LoadingState /></div>

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Tipo</label>
            <select className="input w-full text-sm" value={photoType} onChange={e => setPhotoType(e.target.value)}>
              {Object.entries(PHOTO_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Visibilidade</label>
            <select className="input w-full text-sm" value={visibility} onChange={e => setVisibility(e.target.value)}>
              <option value="internal">Interno (equipe)</option>
              <option value="customer_visible">Visível ao cliente</option>
              <option value="public">Público</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Legenda (opcional)</label>
            <input className="input w-full text-sm" placeholder="Ex: 3 semanas após" value={caption}
              onChange={e => setCaption(e.target.value)} />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        <button
          className="btn-secondary w-full justify-center"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Enviando...' : 'Selecionar foto para upload'}
        </button>
      </div>

      {/* Gallery */}
      {photos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">Nenhuma foto ainda</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square">
              {photo.file_url ? (
                <img
                  src={photo.file_url}
                  alt={photo.caption || photo.photo_type}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightbox(photo.file_url!)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Images className="w-8 h-8 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="text-[10px] font-semibold text-white bg-slate-800/80 rounded px-1.5 py-0.5">
                    {PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}
                  </span>
                  {photo.visibility === 'internal' ? (
                    <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <div className="flex justify-between items-end">
                  {photo.caption && <p className="text-[10px] text-slate-200 truncate flex-1">{photo.caption}</p>}
                  <button
                    onClick={() => deleteMut.mutate(photo.id)}
                    className="ml-auto text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
          <img src={lightbox} className="max-w-full max-h-full rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

export default function ProcedurePhotosPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: histories, isLoading } = useQuery<ProcedureHistory[]>({
    queryKey: ['procedure-histories'],
    queryFn: async () => (await apiClient.get('/admin/procedure-history')).data,
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Fotos Before & After"
        subtitle="Histórico fotográfico de procedimentos realizados"
      />

      {!histories?.length ? (
        <EmptyState
          icon={Images}
          title="Nenhum procedimento com histórico"
          description="As fotos são vinculadas a procedimentos criados automaticamente quando um agendamento é concluído"
        />
      ) : (
        <div className="space-y-3">
          {histories.map(ph => {
            const isOpen = expanded === ph.id
            return (
              <div key={ph.id} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : ph.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                      <Images className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{ph.title}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(ph.procedure_date), 'dd/MM/yyyy', { locale: ptBR })}
                        {ph.photo_count > 0 && (
                          <span className="ml-2 text-primary-600 font-medium">· {ph.photo_count} foto{ph.photo_count !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                    {ph.description && (
                      <p className="text-sm text-slate-600 mb-4">{ph.description}</p>
                    )}
                    <PhotoGallery procedureId={ph.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
