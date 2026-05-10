import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
import { LoadingState } from '@/components/feedback/LoadingState'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock } from 'lucide-react'
import type { PageSections, PageSectionConfig } from '@/types'
import { extractApiError } from '@/api/client'

const SECTION_META: Array<{
  key: keyof PageSections
  name: string
  description: string
  hasTitle: boolean
  hasSubtitle: boolean
  hasLabel: boolean
  hasBgImage: boolean
  hasCta: boolean
  hasOverlay: boolean
  hasVisibility: boolean
}> = [
  {
    key: 'hero',
    name: 'Hero / Capa',
    description: 'Seção principal com foto de capa e nome da empresa',
    hasTitle: false,
    hasSubtitle: false,
    hasLabel: false,
    hasBgImage: true,
    hasCta: false,
    hasOverlay: true,
    hasVisibility: false,
  },
  {
    key: 'about',
    name: 'Sobre nós',
    description: 'Apresentação da empresa com título e subtítulo',
    hasTitle: true,
    hasSubtitle: true,
    hasLabel: true,
    hasBgImage: false,
    hasCta: true,
    hasOverlay: false,
    hasVisibility: true,
  },
  {
    key: 'services',
    name: 'Nossos serviços',
    description: 'Grade de serviços com preço e duração',
    hasTitle: true,
    hasSubtitle: false,
    hasLabel: true,
    hasBgImage: false,
    hasCta: false,
    hasOverlay: false,
    hasVisibility: true,
  },
  {
    key: 'team',
    name: 'Nossa equipe',
    description: 'Cards dos profissionais com foto e bio',
    hasTitle: true,
    hasSubtitle: true,
    hasLabel: true,
    hasBgImage: false,
    hasCta: false,
    hasOverlay: false,
    hasVisibility: true,
  },
  {
    key: 'products',
    name: 'Produtos / Loja',
    description: 'Vitrine de produtos disponíveis para reserva',
    hasTitle: true,
    hasSubtitle: false,
    hasLabel: true,
    hasBgImage: false,
    hasCta: false,
    hasOverlay: false,
    hasVisibility: true,
  },
  {
    key: 'portfolio',
    name: 'Portfólio',
    description: 'Galeria de fotos antes e depois',
    hasTitle: true,
    hasSubtitle: false,
    hasLabel: true,
    hasBgImage: false,
    hasCta: false,
    hasOverlay: false,
    hasVisibility: true,
  },
  {
    key: 'reviews',
    name: 'Avaliações',
    description: 'Depoimentos de clientes com estrelas',
    hasTitle: true,
    hasSubtitle: false,
    hasLabel: true,
    hasBgImage: false,
    hasCta: false,
    hasOverlay: false,
    hasVisibility: true,
  },
  {
    key: 'footer',
    name: 'Rodapé',
    description: 'Rodapé com contatos e informações finais',
    hasTitle: false,
    hasSubtitle: false,
    hasLabel: false,
    hasBgImage: false,
    hasCta: false,
    hasOverlay: false,
    hasVisibility: false,
  },
]

function SectionEditor({
  meta,
  config,
  onChange,
}: {
  meta: typeof SECTION_META[0]
  config: PageSectionConfig
  onChange: (updates: Partial<PageSectionConfig>) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {meta.hasVisibility && (
            <span
              title={config.visible === false ? 'Seção oculta' : 'Seção visível'}
              className={`w-2 h-2 rounded-full flex-shrink-0 ${config.visible === false ? 'bg-gray-300' : 'bg-emerald-400'}`}
            />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{meta.name}</p>
            <p className="text-xs text-gray-500">{meta.description}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-5 pt-1 bg-gray-50 border-t border-gray-100 space-y-4">
          {meta.hasVisibility && (
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">Visibilidade</p>
                <p className="text-xs text-gray-500">Exibir esta seção na página pública</p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ visible: !(config.visible !== false) })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.visible !== false ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.visible !== false ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          {meta.hasLabel && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Rótulo (acima do título)</label>
              <input
                type="text"
                value={config.label ?? ''}
                onChange={e => onChange({ label: e.target.value })}
                placeholder="Ex: Sobre nós"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
          )}

          {meta.hasTitle && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Título da seção</label>
              <input
                type="text"
                value={config.title ?? ''}
                onChange={e => onChange({ title: e.target.value })}
                placeholder="Ex: Nossos serviços"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
          )}

          {meta.hasSubtitle && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Subtítulo / descrição</label>
              <textarea
                value={config.subtitle ?? ''}
                onChange={e => onChange({ subtitle: e.target.value })}
                rows={2}
                placeholder="Ex: Cuidamos de você com excelência e carinho"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white resize-none"
              />
            </div>
          )}

          {meta.hasCta && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Texto do botão CTA</label>
              <input
                type="text"
                value={config.cta_text ?? ''}
                onChange={e => onChange({ cta_text: e.target.value })}
                placeholder="Ex: Agendar agora"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Cor de fundo</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.background_color ?? '#ffffff'}
                onChange={e => onChange({ background_color: e.target.value })}
                className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={config.background_color ?? ''}
                onChange={e => onChange({ background_color: e.target.value })}
                placeholder="#ffffff"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white font-mono"
              />
              {config.background_color && (
                <button
                  type="button"
                  onClick={() => onChange({ background_color: undefined })}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {meta.hasBgImage && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">URL da imagem de fundo</label>
              <input
                type="url"
                value={config.background_image_url ?? ''}
                onChange={e => onChange({ background_image_url: e.target.value || undefined })}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">Deixe em branco para usar a foto de capa do tema</p>
            </div>
          )}

          {meta.hasOverlay && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Opacidade da sobreposição: {Math.round((config.overlay_opacity ?? 0.7) * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={config.overlay_opacity ?? 0.7}
                onChange={e => onChange({ overlay_opacity: parseFloat(e.target.value) })}
                className="w-full accent-primary-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PageSectionsPage() {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'page-sections'],
    queryFn: settingsApi.getPageSections,
    retry: false,
  })

  const [localSections, setLocalSections] = useState<PageSections | null>(null)
  const sections = localSections ?? data ?? {}

  const mutation = useMutation({
    mutationFn: settingsApi.updatePageSections,
    onSuccess: (updated) => {
      qc.setQueryData(['settings', 'page-sections'], updated)
      setLocalSections(null)
      toast.success('Seções salvas com sucesso!')
    },
    onError: (err) => {
      const msg = extractApiError(err)
      if (msg?.includes('não está disponível')) {
        toast.error('Recurso não disponível no seu plano. Entre em contato com o suporte.')
      } else {
        toast.error(msg || 'Erro ao salvar')
      }
    },
  })

  const handleChange = (key: keyof PageSections, updates: Partial<PageSectionConfig>) => {
    setLocalSections(prev => {
      const base = prev ?? data ?? {}
      return {
        ...base,
        [key]: { ...(base[key] ?? {}), ...updates },
      }
    })
  }

  const handleSave = () => {
    mutation.mutate(sections)
  }

  if (isLoading) return <LoadingState />

  const isForbidden = (error as { response?: { status: number } })?.response?.status === 403

  if (isForbidden || error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">Personalização de página não disponível</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Este recurso precisa ser ativado pelo administrador da plataforma. Entre em contato com o suporte.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Personalizar seções da página</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Edite título, subtítulo, cor e visibilidade de cada seção da sua página pública e portal do cliente.
        </p>
      </div>

      <div className="space-y-3">
        {SECTION_META.map(meta => (
          <SectionEditor
            key={meta.key}
            meta={meta}
            config={sections[meta.key] ?? {}}
            onChange={(updates) => handleChange(meta.key, updates)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={mutation.isPending || !localSections}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {localSections && (
          <button
            type="button"
            onClick={() => setLocalSections(null)}
            className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Descartar
          </button>
        )}
      </div>
    </div>
  )
}
