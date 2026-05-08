import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { Settings, FileText } from 'lucide-react'

const DOC_TYPES = [
  { key: 'terms_of_service', label: 'Termos de Uso' },
  { key: 'privacy_policy', label: 'Política de Privacidade' },
]

export default function MasterPlatformPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'settings'|'terms_of_service'|'privacy_policy'>('settings')
  const [settingsForm, setSettingsForm] = useState<Record<string,string>>({})
  const [docContent, setDocContent] = useState<Record<string,string>>({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => masterApi.getPlatformSettings(),
  })

  // Initialize form when settings load
  useEffect(() => {
    if (settings && Object.keys(settingsForm).length === 0) {
      setSettingsForm(settings as Record<string,string>)
    }
  }, [settings])

  const updateSettingsMut = useMutation({
    mutationFn: (d: Record<string,string>) => masterApi.updatePlatformSettings(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform-settings'] }); toast.success('Configurações salvas') },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const updateDocMut = useMutation({
    mutationFn: ({ type, content }: { type: string; content: string }) => masterApi.updatePlatformDocument(type, { content }),
    onSuccess: () => toast.success('Documento salvo'),
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  const loadDoc = async (type: string) => {
    if (!docContent[type]) {
      try {
        const d = await masterApi.getPlatformDocument(type)
        setDocContent(prev => ({ ...prev, [type]: d.content || '' }))
      } catch { setDocContent(prev => ({ ...prev, [type]: '' })) }
    }
  }

  if (isLoading) return <LoadingState />

  const FIELDS = [
    { key: 'platform_name', label: 'Nome da plataforma', placeholder: 'AUTOMIC' },
    { key: 'support_email', label: 'Email de suporte', placeholder: 'suporte@automic.tech.com.br' },
    { key: 'support_phone', label: 'Telefone suporte', placeholder: '+55 84 99999-0000' },
    { key: 'domain', label: 'Domínio', placeholder: 'automic.tech.com.br' },
    { key: 'legal_name', label: 'Razão social', placeholder: 'AUTOMIC Tech LTDA' },
    { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Plataforma" subtitle="Configurações globais do AUTOMIC" />

      <div className="tabs">
        <button className={`tab ${tab==='settings'?'tab-active':''}`} onClick={() => setTab('settings')}>
          <Settings className="w-4 h-4 inline mr-1.5" />Configurações
        </button>
        {DOC_TYPES.map(d => (
          <button key={d.key} className={`tab ${tab===d.key?'tab-active':''}`}
            onClick={() => { setTab(d.key as typeof tab); loadDoc(d.key) }}>
            <FileText className="w-4 h-4 inline mr-1.5" />{d.label}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input"
                  value={settingsForm[key] ?? (settings as Record<string,string> | undefined)?.[key] ?? ''}
                  onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { key: 'primary_color', label: 'Cor primária' },
              { key: 'secondary_color', label: 'Cor secundária' },
              { key: 'accent_color', label: 'Cor destaque' },
            ].map(({ key, label }) => {
              const val = settingsForm[key] ?? (settings as Record<string,string> | undefined)?.[key] ?? '#22d3ee'
              return (
                <div key={key}>
                  <label className="label">{label}</label>
                  <div className="flex gap-2">
                    <input type="color" className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 shrink-0"
                      value={val} onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))} />
                    <input className="input flex-1 text-xs" value={val}
                      onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end pt-2">
            <button className="btn-primary" onClick={() => updateSettingsMut.mutate(settingsForm)} disabled={updateSettingsMut.isPending}>
              {updateSettingsMut.isPending ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>
      )}

      {DOC_TYPES.map(d => tab === d.key && (
        <div key={d.key} className="card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">{d.label}</h3>
          <textarea className="input font-mono text-xs" rows={20}
            value={docContent[d.key] ?? ''}
            onChange={e => setDocContent(prev => ({ ...prev, [d.key]: e.target.value }))}
            placeholder={`Conteúdo do ${d.label}...`} />
          <div className="flex justify-end mt-4">
            <button className="btn-primary"
              onClick={() => updateDocMut.mutate({ type: d.key, content: docContent[d.key] || '' })}
              disabled={updateDocMut.isPending}>
              Salvar documento
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
