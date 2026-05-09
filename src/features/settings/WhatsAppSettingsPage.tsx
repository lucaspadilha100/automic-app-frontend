import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, extractApiError } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { MessageCircle, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const PROVIDERS = [
  { value: 'n8n', label: 'n8n' },
  { value: 'evolution_api', label: 'Evolution API' },
  { value: 'z_api', label: 'Z-API' },
  { value: 'official', label: 'WhatsApp Business API (oficial)' },
]

const CONNECTION_TYPES = [
  { value: 'webhook', label: 'Webhook' },
  { value: 'api', label: 'API REST' },
]

type Settings = {
  id: string
  enabled: boolean
  provider: string | null
  connection_type: string | null
  webhook_url: string | null
  instance_id: string | null
  status: string
  last_connected_at: string | null
}

export default function WhatsAppSettingsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<Settings>({
    queryKey: ['whatsapp-settings'],
    queryFn: async () => (await apiClient.get('/admin/integrations/whatsapp')).data,
  })

  const [form, setForm] = useState({
    enabled: false,
    provider: '',
    connection_type: 'webhook',
    webhook_url: '',
    instance_id: '',
  })

  useEffect(() => {
    if (data) {
      setForm({
        enabled: data.enabled,
        provider: data.provider || '',
        connection_type: data.connection_type || 'webhook',
        webhook_url: data.webhook_url || '',
        instance_id: data.instance_id || '',
      })
    }
  }, [data])

  const saveMut = useMutation({
    mutationFn: () => apiClient.put('/admin/integrations/whatsapp', {
      enabled: form.enabled,
      provider: form.provider || null,
      connection_type: form.connection_type || null,
      webhook_url: form.webhook_url || null,
      instance_id: form.instance_id || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-settings'] })
      toast.success('Configurações salvas')
    },
    onError: (e: unknown) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <LoadingState />

  const statusColor = data?.status === 'connected' ? 'text-emerald-600' : data?.status === 'error' ? 'text-red-500' : 'text-slate-400'
  const StatusIcon = data?.status === 'connected' ? Wifi : WifiOff

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader
        title="Integração WhatsApp"
        subtitle="Configure a conexão com seu provedor de WhatsApp"
      />

      {/* Status card */}
      <div className="card p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data?.status === 'connected' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Status da conexão</p>
          <p className={`text-xs font-medium capitalize ${statusColor}`}>{data?.status || 'desconhecido'}</p>
        </div>
        {data?.last_connected_at && (
          <p className="text-xs text-slate-400">
            Última conexão: {new Date(data.last_connected_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {/* Form */}
      <div className="card p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-500" />
          Configurações
        </h3>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-slate-800">Habilitar integração</p>
            <p className="text-xs text-slate-400">Ativa o envio de mensagens via WhatsApp</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.enabled ? 'bg-primary-500' : 'bg-slate-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </label>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Provedor</label>
          <select
            className="input w-full"
            value={form.provider}
            onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
            <option value="">Selecione um provedor</option>
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipo de conexão</label>
          <select
            className="input w-full"
            value={form.connection_type}
            onChange={e => setForm(f => ({ ...f, connection_type: e.target.value }))}>
            {CONNECTION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">URL do Webhook</label>
          <input
            type="url"
            className="input w-full"
            placeholder="https://seu-n8n.com/webhook/..."
            value={form.webhook_url}
            onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))}
          />
          <p className="text-xs text-slate-400">URL que o AUTOMIC vai chamar para enviar mensagens</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ID da instância</label>
          <input
            type="text"
            className="input w-full"
            placeholder="ex: minha-instancia-001"
            value={form.instance_id}
            onChange={e => setForm(f => ({ ...f, instance_id: e.target.value }))}
          />
          <p className="text-xs text-slate-400">Identificador da instância no seu provedor (se aplicável)</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            className="btn-primary"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </div>
  )
}
