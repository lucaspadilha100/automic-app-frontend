import type { TenantTheme } from '@/types'

interface Props {
  children: React.ReactNode
  theme?: TenantTheme
  tenantName?: string
}

export function PublicLayout({ children, theme, tenantName }: Props) {
  const primaryColor = theme?.primary_color || '#6366f1'
  const bgColor = theme?.background_color || '#f8f9fc'

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <style>{`
        :root { --color-primary: ${primaryColor}; }
        .pub-btn { background-color: ${theme?.button_color || primaryColor}; color: white; }
        .pub-btn:hover { opacity: 0.9; }
      `}</style>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {theme?.logo_url ? (
            <img src={theme.logo_url} alt={tenantName} className="h-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <span className="text-white font-bold text-sm">{tenantName?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <span className="font-semibold text-gray-900 font-display">{tenantName}</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
