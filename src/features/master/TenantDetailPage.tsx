import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { masterApi } from '@/api/master.api'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extractApiError } from '@/api/client'
import { CreditCard, Settings, BarChart3, FileText, Shield, Tag } from 'lucide-react'

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const qc = useQueryClient()

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['master','tenant', tenantId],
    queryFn: () => masterApi.getTenant(tenantId!),
  })
  const { data: billingMode } = useQuery({
    queryKey: ['master','billing-mode', tenantId],
    queryFn: () => masterApi.getBillingMode(tenantId!),
  })
  const { data: plans } = useQuery({ queryKey: ['master','plans'], queryFn: () => masterApi.listPlans() })

  const [tab, setTab] = useState<'overview'|'invoices'|'payment'|'features'|'limits'>('overview')
  const [customPriceOpen, setCustomPriceOpen] = useState(false)
  const [customPriceForm, setCustomPriceForm] = useState({ custom_price_monthly: '', custom_price_reason: '', billing_notes: '' })
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'pix', payment_reference: '', notes: '' })

  const billingModeMut = useMutation({
    mutationFn: (mode: string) => masterApi.updateBillingMode(tenantId!, mode),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','billing-mode', tenantId] }); toast.success('Modo de cobrança atualizado') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const manualPaymentMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => masterApi.manualPayment(tenantId!, data),
    onSuccess: () => { toast.success('Pagamento registrado'); setManualPaymentOpen(false) },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const statusMut = useMutation({
    mutationFn: (status: string) => masterApi.updateTenantStatus(tenantId!, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','tenant', tenantId] }); toast.success('Status atualizado') },
    onError: (e) => toast.error(extractApiError(e)),
  })

  const customPriceMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => masterApi.updateSubscription(tenantId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master','tenant', tenantId] }); toast.success('Preço customizado salvo'); setCustomPriceOpen(false) },
    onError: (e) => toast.error(extractApiError(e)),
  })

  if (isLoading) return <LoadingState />
  if (!tenant) return <div>Empresa não encontrada</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={tenant.name}
        subtitle={tenant.slug}
        actions={
          <div className="flex gap-2">
            <select
              className="select text-xs h-9 px-3"
              value={tenant.status}
              onChange={e => statusMut.mutate(e.target.value)}>
              {['trial','active','suspended','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setManualPaymentOpen(true)}>
              <CreditCard className="w-4 h-4" /> Registrar pagamento
            </button>
          </div>
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Status', value: <StatusBadge status={tenant.status} /> },
          { label: 'Plano', value: plans?.find((p: {id:string;name:string}) => p.id === tenant.subscription?.plan_id)?.name || '-' },
          { label: 'Modo billing', value: <StatusBadge status={billingMode?.billing_mode || 'manual'} /> },
          { label: 'Criado', value: new Date(tenant.created_at).toLocaleDateString('pt-BR') },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <div className="mt-1.5 text-sm font-semibold text-slate-800">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'overview', label: 'Visão geral' },
          { key: 'payment', label: 'Cobrança' },
          { key: 'features', label: 'Features' },
          { key: 'limits', label: 'Limites' },
        ].map(({ key, label }) => (
          <button key={key} className={`tab ${tab === key ? 'tab-active' : ''}`} onClick={() => setTab(key as typeof tab)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card divide-y divide-slate-100">
          {[
            { label: 'Nome', value: tenant.name },
            { label: 'Slug', value: tenant.slug },
            { label: 'Fuso horário', value: tenant.timezone },
            { label: 'Email de contato', value: tenant.email || '-' },
            { label: 'Telefone', value: tenant.phone || '-' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
              <span className="text-sm text-slate-800 font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'payment' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Modo de cobrança</h3>
            <div className="flex gap-3">
              {['manual','automatic','free'].map(mode => (
                <button key={mode}
                  onClick={() => billingModeMut.mutate(mode)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                    billingMode?.billing_mode === mode
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  {mode === 'manual' ? '🤝 Manual' : mode === 'automatic' ? '⚡ Automático' : '🎁 Grátis'}
                  <p className="text-[10px] font-normal mt-0.5 text-slate-400">
                    {mode === 'manual' ? 'Você controla' : mode === 'automatic' ? 'Suspende automático' : 'Sem cobrança'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link to={`/master/invoices?tenant_id=${tenantId}`} className="btn-secondary flex-1 justify-center">
              <FileText className="w-4 h-4" /> Ver faturas
            </Link>
            <button className="btn-secondary flex-1" onClick={() => { setCustomPriceForm({ custom_price_monthly: tenant.subscription?.custom_price_monthly || '', custom_price_reason: tenant.subscription?.custom_price_reason || '', billing_notes: tenant.subscription?.billing_notes || '' }); setCustomPriceOpen(true) }}>
              <Tag className="w-4 h-4" /> Preço customizado
            </button>
            <button className="btn-primary flex-1" onClick={() => setManualPaymentOpen(true)}>
              <CreditCard className="w-4 h-4" /> Registrar pagamento manual
            </button>
          </div>
        </div>
      )}

      {tab === 'features' && (
        <Link to={`/master/tenants/${tenantId}/features`} className="card p-6 flex items-center justify-between hover:border-primary-200 transition-colors">
          <div>
            <p className="font-semibold text-slate-900">Gerenciar features</p>
            <p className="text-sm text-slate-500 mt-0.5">Ativar/desativar funcionalidades por tenant</p>
          </div>
          <Shield className="w-5 h-5 text-slate-400" />
        </Link>
      )}

      {tab === 'limits' && (
        <Link to={`/master/tenants/${tenantId}/limits`} className="card p-6 flex items-center justify-between hover:border-primary-200 transition-colors">
          <div>
            <p className="font-semibold text-slate-900">Limites custom</p>
            <p className="text-sm text-slate-500 mt-0.5">Sobrescrever limites do plano para este tenant</p>
          </div>
          <BarChart3 className="w-5 h-5 text-slate-400" />
        </Link>
      )}

      {/* Custom price modal */}
      {customPriceOpen && (
        <div className="modal-overlay" onClick={() => setCustomPriceOpen(false)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-slate-900">Preço customizado</h3>
              <button onClick={() => setCustomPriceOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Valor mensal customizado (R$) — deixe em branco para usar o plano</label>
                <input className="input" type="number" step="0.01" placeholder="Ex: 197.00"
                  value={customPriceForm.custom_price_monthly}
                  onChange={e => setCustomPriceForm(f => ({ ...f, custom_price_monthly: e.target.value }))} />
              </div>
              <div>
                <label className="label">Motivo do preço customizado</label>
                <input className="input" placeholder="Ex: Cliente fundador, desconto especial..."
                  value={customPriceForm.custom_price_reason}
                  onChange={e => setCustomPriceForm(f => ({ ...f, custom_price_reason: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notas de cobrança (internas)</label>
                <textarea className="input" rows={2} placeholder="Observações internas sobre cobrança..."
                  value={customPriceForm.billing_notes}
                  onChange={e => setCustomPriceForm(f => ({ ...f, billing_notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setCustomPriceOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => customPriceMut.mutate({
                custom_price_monthly: customPriceForm.custom_price_monthly ? Number(customPriceForm.custom_price_monthly) : null,
                custom_price_reason: customPriceForm.custom_price_reason || null,
                billing_notes: customPriceForm.billing_notes || null,
              })} disabled={customPriceMut.isPending}>
                {customPriceMut.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual payment modal */}
      {manualPaymentOpen && (
        <div className="modal-overlay" onClick={() => setManualPaymentOpen(false)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-slate-900">Registrar pagamento</h3>
              <button onClick={() => setManualPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Valor (R$)</label>
                <input className="input" type="number" step="0.01" placeholder="297.00"
                  value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="label">Método</label>
                <select className="select" value={paymentForm.payment_method}
                  onChange={e => setPaymentForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <label className="label">Referência (opcional)</label>
                <input className="input" placeholder="PIX-123456"
                  value={paymentForm.payment_reference} onChange={e => setPaymentForm(f => ({ ...f, payment_reference: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea className="input" rows={2} placeholder="Cliente fundador, desconto especial..."
                  value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setManualPaymentOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={() => manualPaymentMut.mutate({
                amount: Number(paymentForm.amount),
                payment_method: paymentForm.payment_method,
                payment_reference: paymentForm.payment_reference || undefined,
                notes: paymentForm.notes || undefined,
                reactivate_if_suspended: true,
              })} disabled={!paymentForm.amount || manualPaymentMut.isPending}>
                {manualPaymentMut.isPending ? 'Salvando...' : 'Confirmar pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
