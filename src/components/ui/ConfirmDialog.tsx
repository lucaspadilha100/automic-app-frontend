interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel='Confirmar', danger=false, loading=false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-500 mt-2">{description}</p>}
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancelar</button>
            <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
              {loading ? 'Aguarde...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
