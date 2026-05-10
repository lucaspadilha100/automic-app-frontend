import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings.api'
import { useForm } from 'react-hook-form'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { Palette, Globe, Settings2, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-5 pb-4 border-b border-slate-100">
      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function CompanyProfilePage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const slug = user?.tenant_slug

  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => settingsApi.get() })

  // ── Form 1: Aparência (tema / imagens / cor) ──────────────────────────────
  const themeForm = useForm<{
    logo_url: string
    cover_image_url: string
    primary_color: string
  }>()

  // Sincroniza react-hook-form com dados do servidor
  useEffect(() => {
    if (data?.theme) themeForm.reset({
      logo_url: data.theme.logo_url || '',
      cover_image_url: data.theme.cover_image_url || '',
      primary_color: data.theme.primary_color || '#c9a96e',
    })
  }, [data])

  const themeMut = useMutation({
    mutationFn: (d: Parameters<typeof settingsApi.updateTheme>[0]) => settingsApi.updateTheme(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Aparência salva! Já aparece na vitrine.') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  // Watched values para previews ao vivo
  const logoUrl = themeForm.watch('logo_url')
  const coverUrl = themeForm.watch('cover_image_url')
  const primaryColor = themeForm.watch('primary_color') || '#c9a96e'

  // ── Form 2: Textos da vitrine pública ─────────────────────────────────────
  const textsForm = useForm<{
    homepage_title: string
    homepage_subtitle: string
    primary_button_text: string
    confirmation_message: string
    footer_text: string
  }>()

  useEffect(() => {
    if (data?.settings) textsForm.reset({
      homepage_title: data.settings.homepage_title || '',
      homepage_subtitle: data.settings.homepage_subtitle || '',
      primary_button_text: data.settings.primary_button_text || '',
      confirmation_message: data.settings.confirmation_message || '',
      footer_text: data.settings.footer_text || '',
    })
  }, [data])

  const textsMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updateGeneral(d as Parameters<typeof settingsApi.updateGeneral>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Textos salvos! Já aparecem na vitrine.') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  // ── Form 3: Regras de agendamento (comportamento interno) ─────────────────
  const rulesForm = useForm<{
    show_prices: boolean
    show_duration: boolean
    allow_professional_choice: boolean
    allow_multiple_services: boolean
    allow_customer_cancel: boolean
    allow_customer_reschedule: boolean
  }>()

  useEffect(() => {
    if (data?.settings) rulesForm.reset({
      show_prices: data.settings.show_prices ?? true,
      show_duration: data.settings.show_duration ?? true,
      allow_professional_choice: data.settings.allow_professional_choice ?? true,
      allow_multiple_services: data.settings.allow_multiple_services ?? false,
      allow_customer_cancel: data.settings.allow_customer_cancel ?? true,
      allow_customer_reschedule: data.settings.allow_customer_reschedule ?? true,
    })
  }, [data])

  const rulesMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updateGeneral(d as Parameters<typeof settingsApi.updateGeneral>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Regras salvas!') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">

      {/* ── Link para a vitrine ─────────────────────────────────────────── */}
      {slug && (
        <div className="flex items-center justify-between bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs font-bold text-primary-700">Vitrine pública</p>
            <p className="text-xs text-primary-500 mt-0.5">/{slug}</p>
          </div>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-white border border-primary-200 rounded-lg px-3 py-1.5 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver vitrine
          </a>
        </div>
      )}

      {/* ── Seção 1: Aparência (impacta a VITRINE) ─────────────────────── */}
      <div className="card p-6">
        <SectionHeader
          icon={<Palette className="w-4 h-4 text-primary-500" />}
          title="Aparência da vitrine"
          description="Logo, foto de capa e cor — visíveis para os seus clientes na página pública"
        />

        <form onSubmit={themeForm.handleSubmit(d => themeMut.mutate(d))} className="space-y-5">
          {/* Logo */}
          <div>
            <label className="label">URL da logo / foto de perfil</label>
            <input {...themeForm.register('logo_url')} className="input" placeholder="https://..." />
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={logoUrl} className="w-14 h-14 rounded-xl object-cover border border-slate-200" alt="Logo" onError={e => (e.currentTarget.style.display = 'none')} />
                <p className="text-xs text-slate-400">Aparece no canto superior esquerdo da vitrine</p>
              </div>
            )}
          </div>

          {/* Capa */}
          <div>
            <label className="label">URL da imagem de capa (fundo da vitrine)</label>
            <input {...themeForm.register('cover_image_url')} className="input" placeholder="https://images.unsplash.com/..." />
            {coverUrl ? (
              <img src={coverUrl} className="mt-2 w-full h-28 rounded-xl object-cover border border-slate-200" alt="Capa" onError={e => (e.currentTarget.style.display = 'none')} />
            ) : (
              <p className="text-xs text-slate-400 mt-1">Dica: use fotos gratuitas em <strong>unsplash.com</strong></p>
            )}
          </div>

          {/* Cor principal — FIX: color picker usa onChange + setValue para sincronizar com o text input */}
          <div>
            <label className="label">Cor principal</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={e => themeForm.setValue('primary_color', e.target.value, { shouldDirty: true })}
                className="w-10 h-10 rounded-lg border border-slate-200 p-0.5 cursor-pointer bg-white"
              />
              <input
                {...themeForm.register('primary_color')}
                className="input flex-1"
                placeholder="#c9a96e"
              />
              {/* Preview da cor no botão */}
              <div
                className="px-4 py-2 rounded-xl text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: primaryColor }}>
                Agendar
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Usada nos botões, destaques e acentos da vitrine</p>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" className="btn btn-primary btn-md" disabled={themeMut.isPending}>
              {themeMut.isPending ? 'Salvando...' : 'Salvar aparência'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Seção 2: Textos da vitrine (impacta a VITRINE) ─────────────── */}
      <div className="card p-6">
        <SectionHeader
          icon={<Globe className="w-4 h-4 text-primary-500" />}
          title="Textos da vitrine pública"
          description="Títulos, slogan e mensagens exibidos para os clientes na página de agendamento"
        />

        <form onSubmit={textsForm.handleSubmit(d => textsMut.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Título principal <span className="text-slate-400 font-normal">(seção "Sobre nós")</span></label>
            <input {...textsForm.register('homepage_title')} className="input" placeholder="Ex: Cuidamos da sua beleza com excelência" />
          </div>
          <div>
            <label className="label">Subtítulo / slogan <span className="text-slate-400 font-normal">(embaixo do nome no hero)</span></label>
            <input {...textsForm.register('homepage_subtitle')} className="input" placeholder="Ex: Transformamos seu bem-estar com tratamentos exclusivos" />
          </div>
          <div>
            <label className="label">Texto do botão de agendamento <span className="text-slate-400 font-normal">(padrão: "Agendar agora")</span></label>
            <input {...textsForm.register('primary_button_text')} className="input" placeholder="Agendar agora" />
          </div>
          <div>
            <label className="label">Mensagem após confirmar agendamento</label>
            <textarea {...textsForm.register('confirmation_message')} className="input" rows={2}
              placeholder="Seu agendamento foi confirmado! Aguardamos sua visita." />
          </div>
          <div>
            <label className="label">Texto do rodapé <span className="text-slate-400 font-normal">(opcional)</span></label>
            <input {...textsForm.register('footer_text')} className="input" placeholder="© 2025 Clínica Beleza. Todos os direitos reservados." />
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" className="btn btn-primary btn-md" disabled={textsMut.isPending}>
              {textsMut.isPending ? 'Salvando...' : 'Salvar textos'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Seção 3: Regras de agendamento (comportamento interno) ─────── */}
      <div className="card p-6">
        <SectionHeader
          icon={<Settings2 className="w-4 h-4 text-primary-500" />}
          title="Regras de agendamento"
          description="Controla o que o cliente pode fazer durante o agendamento — não altera a aparência da vitrine"
        />

        <form onSubmit={rulesForm.handleSubmit(d => rulesMut.mutate(d))} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ['show_prices', 'Exibir preços dos serviços'],
              ['show_duration', 'Exibir duração dos serviços'],
              ['allow_professional_choice', 'Cliente escolhe o profissional'],
              ['allow_multiple_services', 'Permite agendar múltiplos serviços'],
              ['allow_customer_cancel', 'Cliente pode cancelar'],
              ['allow_customer_reschedule', 'Cliente pode reagendar'],
            ] as [string, string][]).map(([field, label]) => (
              <label key={field} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  {...rulesForm.register(field as Parameters<typeof rulesForm.register>[0])}
                  type="checkbox"
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn btn-primary btn-md" disabled={rulesMut.isPending}>
              {rulesMut.isPending ? 'Salvando...' : 'Salvar regras'}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
