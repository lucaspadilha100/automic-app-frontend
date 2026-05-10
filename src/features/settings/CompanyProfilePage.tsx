import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
import { useForm } from 'react-hook-form'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { Globe, Image } from 'lucide-react'

export default function CompanyProfilePage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get() })

  // Form 1: Theme / Images
  const themeForm = useForm()
  useEffect(() => { if (data?.theme) themeForm.reset(data.theme) }, [data])
  const themeMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updateTheme(d as Parameters<typeof settingsApi.updateTheme>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Tema salvo') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  // Form 2: Company basic info / public content
  const generalForm = useForm()
  useEffect(() => { if (data?.settings) generalForm.reset(data.settings) }, [data])
  const generalMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updateGeneral(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Informações salvas') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="max-w-2xl space-y-6">
      {/* Section 1: Imagens e Visual */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-4 h-4 text-primary-500" />
          <h3 className="font-bold text-slate-800">Imagens da vitrine</h3>
        </div>
        <form onSubmit={themeForm.handleSubmit(d => themeMut.mutate(d))} className="space-y-4">
          <div>
            <label className="label">URL da logo / foto de perfil</label>
            <input {...themeForm.register('logo_url')} className="input" placeholder="https://..." />
            {themeForm.watch('logo_url') && (
              <img src={themeForm.watch('logo_url')} className="mt-2 w-16 h-16 rounded-xl object-cover border" alt="Logo preview" />
            )}
          </div>
          <div>
            <label className="label">URL da imagem de capa / hero (fundo da vitrine)</label>
            <input {...themeForm.register('cover_image_url')} className="input" placeholder="https://images.unsplash.com/..." />
            {themeForm.watch('cover_image_url') && (
              <img src={themeForm.watch('cover_image_url')} className="mt-2 w-full h-32 rounded-xl object-cover border" alt="Cover preview" />
            )}
            <p className="text-xs text-slate-400 mt-1">Dica: use imagens do Unsplash (unsplash.com) para fotos gratuitas</p>
          </div>
          <div>
            <label className="label">Cor principal</label>
            <div className="flex items-center gap-2">
              <input {...themeForm.register('primary_color')} type="color" className="w-10 h-10 rounded-lg border p-1 cursor-pointer" />
              <input {...themeForm.register('primary_color')} className="input flex-1" placeholder="#6366f1" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary btn-md" disabled={themeMut.isPending}>
              {themeMut.isPending ? 'Salvando...' : 'Salvar visual'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Conteúdo da página pública */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary-500" />
          <h3 className="font-bold text-slate-800">Conteúdo da página pública</h3>
        </div>
        <form onSubmit={generalForm.handleSubmit(d => generalMut.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Subtítulo / slogan</label>
            <input {...generalForm.register('homepage_subtitle')} className="input" placeholder="Transformamos seu bem-estar com tratamentos exclusivos" />
          </div>
          <div>
            <label className="label">Mensagem de confirmação de agendamento</label>
            <textarea {...generalForm.register('confirmation_message')} className="input" rows={2} placeholder="Seu agendamento foi confirmado! Aguardamos sua visita." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...generalForm.register('show_prices')} type="checkbox" />
              <span className="text-sm">Mostrar preços</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...generalForm.register('show_duration')} type="checkbox" />
              <span className="text-sm">Mostrar duração</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...generalForm.register('allow_professional_choice')} type="checkbox" />
              <span className="text-sm">Escolha de profissional</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...generalForm.register('allow_multiple_services')} type="checkbox" />
              <span className="text-sm">Múltiplos serviços</span>
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary btn-md" disabled={generalMut.isPending}>
              {generalMut.isPending ? 'Salvando...' : 'Salvar conteúdo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
