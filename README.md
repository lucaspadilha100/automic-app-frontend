# AutomIQ Booking — Frontend

Frontend completo do SaaS AutomIQ Booking. React + Vite + TypeScript com três áreas distintas: Console Master, Painel do Tenant e Portal Público/Cliente.

---

## Stack

| Tecnologia | Uso |
|---|---|
| React 19 + Vite | Base do projeto |
| TypeScript | Tipagem estática |
| React Router v7 | Roteamento |
| TailwindCSS v3 | Estilização |
| TanStack Query v5 | Fetching e cache |
| React Hook Form + Zod | Formulários e validação |
| Axios | Cliente HTTP |
| Zustand | Estado de autenticação |
| Lucide React | Ícones |
| Recharts | Gráficos |
| react-hot-toast | Notificações |
| date-fns | Formatação de datas |

---

## Pré-requisitos

- Node.js 18+
- npm 9+
- Backend AutomIQ rodando (FastAPI)

---

## Instalação

```bash
git clone <repo>
cd automiq-frontend
npm install
```

---

## Configuração

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1   # URL do backend
VITE_APP_NAME=AutomIQ Booking               # Nome da aplicação
VITE_DEFAULT_PUBLIC_SLUG=demo               # Slug padrão para testes públicos
```

---

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## Como conectar ao backend

O backend deve estar rodando com CORS configurado para aceitar `http://localhost:5173` (porta padrão do Vite).

Todos os requests passam por `src/api/client.ts`, que adiciona o JWT automaticamente via interceptor Axios.

---

## Estrutura de pastas

```
src/
├── app/
│   ├── router.tsx          # Todas as rotas da aplicação
│   ├── queryClient.ts      # Configuração do TanStack Query
│   └── providers.tsx       # Providers globais + inicialização de auth
│
├── api/
│   ├── client.ts           # Axios: 2 clientes (interno + cliente final)
│   ├── auth.api.ts         # Auth interna: login, me, forgot, reset
│   ├── customerAuth.api.ts # Auth de cliente: register, login, me
│   ├── master.api.ts       # Endpoints /master/*
│   ├── dashboard.api.ts    # Dashboard + reports
│   ├── services.api.ts     # Serviços e categorias
│   ├── professionals.api.ts# Profissionais, disponibilidade
│   ├── appointments.api.ts # Agendamentos e ações
│   ├── customers.api.ts    # Clientes, notas, tags
│   ├── packages.api.ts     # Pacotes e sessões
│   ├── payments.api.ts     # Pagamentos e resumo
│   ├── settings.api.ts     # Configurações do tenant
│   ├── units.api.ts        # Unidades e lista de espera
│   ├── resources.api.ts    # Recursos físicos
│   ├── media.api.ts        # Upload de mídia
│   ├── notifications.api.ts# Logs de notificações
│   ├── audit.api.ts        # Logs de auditoria
│   ├── schedule.api.ts     # Horários e bloqueios
│   ├── public.api.ts       # Endpoints públicos /public/:slug
│   └── customerPortal.api.ts# Portal do cliente /customer/*
│
├── components/
│   ├── layout/             # AppLayout, MasterLayout, PublicLayout, CustomerLayout
│   ├── ui/                 # StatusBadge, PageHeader, ConfirmDialog
│   ├── forms/              # FormSection
│   ├── tables/             # DataTable
│   ├── cards/              # MetricCard
│   └── feedback/           # LoadingState, EmptyState, ErrorState, FeatureGate
│
├── features/               # Páginas organizadas por domínio
│   ├── auth/               # Login interno, recuperação de senha
│   ├── customer-auth/      # Login e cadastro do cliente final
│   ├── master/             # Console Master: tenants, planos, features, limites
│   ├── tenant-dashboard/   # Dashboard do tenant
│   ├── appointments/       # Listagem, detalhe, calendário
│   ├── services/           # Serviços e categorias
│   ├── professionals/      # Profissionais e disponibilidade
│   ├── customers/          # Clientes e histórico
│   ├── packages/           # Pacotes de sessões
│   ├── payments/           # Resumo financeiro
│   ├── settings/           # Configurações completas
│   ├── units/              # Unidades e lista de espera
│   ├── resources/          # Recursos físicos
│   ├── media/              # Gerenciamento de mídia
│   ├── notifications/      # Logs de notificações
│   ├── audit/              # Logs de auditoria
│   ├── public-booking/     # Fluxo público de agendamento
│   └── customer-portal/    # Portal do cliente final
│
├── stores/
│   └── authStore.ts        # Zustand: sessão interna + sessão cliente (separadas)
│
├── types/
│   └── index.ts            # Todos os tipos TypeScript
│
├── hooks/
│   └── useDebounce.ts
│
└── utils/
```

---

## Principais rotas

### Auth interna
| Rota | Descrição |
|---|---|
| `/login` | Login de usuário interno |
| `/forgot-password` | Recuperação de senha |

### Console Master (`/master`)
| Rota | Descrição |
|---|---|
| `/master/dashboard` | Visão geral dos tenants |
| `/master/tenants` | Lista de empresas |
| `/master/tenants/new` | Criar empresa |
| `/master/tenants/:id` | Detalhe do tenant |
| `/master/tenants/:id/features` | Feature flags |
| `/master/tenants/:id/limits` | Limites customizados |
| `/master/tenants/:id/theme` | Tema white label |
| `/master/tenants/:id/audit-logs` | Auditoria |
| `/master/plans` | Planos do SaaS |

### Painel do Tenant (`/app`)
| Rota | Descrição |
|---|---|
| `/app/dashboard` | Dashboard operacional |
| `/app/appointments` | Listagem de agendamentos |
| `/app/calendar` | Visão de calendário semanal |
| `/app/services` | Gerenciar serviços |
| `/app/service-categories` | Categorias de serviços |
| `/app/professionals` | Profissionais |
| `/app/customers` | Clientes |
| `/app/packages` | Pacotes de sessões |
| `/app/payments` | Resumo financeiro |
| `/app/units` | Unidades |
| `/app/resources` | Recursos físicos |
| `/app/waitlist` | Lista de espera |
| `/app/media` | Mídia |
| `/app/audit-logs` | Logs de auditoria |
| `/app/settings` | Configurações gerais |
| `/app/settings/booking` | Política de agendamento |
| `/app/settings/payment` | Configurações de pagamento |
| `/app/settings/theme` | Tema da página pública |
| `/app/settings/notifications` | Templates de notificação |
| `/app/settings/webhooks` | Webhooks |

### Portal público (`/:slug`)
| Rota | Descrição |
|---|---|
| `/:slug` | Página de agendamento público |

### Portal do cliente (`/customer`)
| Rota | Descrição |
|---|---|
| `/customer/login` | Login do cliente final |
| `/customer/register` | Cadastro do cliente final |
| `/customer/tenants/:slug/appointments` | Meus agendamentos |
| `/customer/tenants/:slug/packages` | Meus pacotes |
| `/customer/tenants/:slug/profile` | Meu perfil |

---

## Como funciona o White Label

Cada tenant tem seu próprio tema configurável:
- **Logo**, imagem de capa, favicon
- **Cores**: primária, secundária, fundo, botões, texto
- **Textos**: título da página, subtítulo, mensagem de confirmação

O tema é carregado via `GET /public/:slug` e aplicado dinamicamente via CSS variables na `PublicLayout`.

---

## Auth interna vs Auth do cliente final

Existem **dois tokens completamente separados**:

| | Auth Interna | Auth Cliente Final |
|---|---|---|
| Endpoint login | `POST /auth/login` | `POST /customer-auth/login` |
| Token storage | `localStorage.automiq_internal_token` | `localStorage.automiq_customer_token` |
| Cliente Axios | `apiClient` | `customerApiClient` |
| Store Zustand | `useAuthStore` | `useCustomerAuthStore` |
| Redirect 401 | `/login` | `/customer/login` |

Nenhum componente mistura os dois tokens.

---

## Como funciona o Feature Gate

O frontend trata erros `FEATURE_DISABLED` do backend de forma amigável.

Padrão para qualquer tela com feature opcional:

```tsx
const { data, error } = useQuery({ queryFn: () => resourcesApi.list(), retry: false })
const isFeatureDisabled = (error as any)?.response?.data?.code === 'FEATURE_DISABLED'

if (isFeatureDisabled) {
  return <EmptyState title="Recurso não disponível" description="..." />
}
```

O backend é sempre a fonte final de autorização.
