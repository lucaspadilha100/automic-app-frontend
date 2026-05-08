interface Props {
  title: string
  description?: string
  children: React.ReactNode
}
export function FormSection({ title, description, children }: Props) {
  return (
    <div className="border-b border-slate-100 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}
