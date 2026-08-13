import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { ProtectedRoute, CustomerProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { MasterLayout } from '@/components/layout/MasterLayout'
import { LoadingState } from '@/components/feedback/LoadingState'

// Auth (small, loaded eagerly — first paint)
import LoginPage from '@/features/auth/LoginPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import CustomerLoginPage from '@/features/customer-auth/CustomerLoginPage'
import CustomerRegisterPage from '@/features/customer-auth/CustomerRegisterPage'

const CHUNK_RELOAD_KEY = 'chunk_reload_at'

/**
 * Every page below is a separate hashed chunk. A deploy publishes new hashes and
 * drops the old files, so a tab that is still running the previous index.html
 * asks for a chunk that no longer exists and React Router surfaces
 * "Failed to fetch dynamically imported module" instead of the page.
 *
 * The tab just needs the new index.html: reload once on that failure. The
 * timestamp guard keeps a genuinely broken chunk (or an offline user) from
 * looping — the second failure within 10s propagates as a real error.
 */
function lazyPage<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((err) => {
      const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
        window.location.reload()
        return new Promise<{ default: T }>(() => {}) // never settles; the page is reloading
      }
      throw err
    })
  )
}

// All other pages — lazy loaded
const MasterDashboard = lazyPage(() => import('@/features/master/MasterDashboard'))
const TenantsListPage = lazyPage(() => import('@/features/master/TenantsListPage'))
const NewTenantPage = lazyPage(() => import('@/features/master/NewTenantPage'))
const TenantDetailPage = lazyPage(() => import('@/features/master/TenantDetailPage'))
const TenantFeaturesPage = lazyPage(() => import('@/features/master/TenantFeaturesPage'))
const TenantLimitsPage = lazyPage(() => import('@/features/master/TenantLimitsPage'))
const TenantAuditLogsPage = lazyPage(() => import('@/features/master/TenantAuditLogsPage'))
const TenantSettingsPage = lazyPage(() => import('@/features/master/TenantSettingsPage'))
const TenantThemePage = lazyPage(() => import('@/features/master/TenantThemePage'))
const PlansListPage = lazyPage(() => import('@/features/master/PlansListPage'))
const MasterInvoicesPage = lazyPage(() => import('@/features/master/MasterInvoicesPage'))
const MasterJobsPage = lazyPage(() => import('@/features/master/MasterJobsPage'))
const MasterTasksPage = lazyPage(() => import('@/features/master/MasterTasksPage'))
const MasterNotificationsPage = lazyPage(() => import('@/features/master/MasterNotificationsPage'))
const MasterSupportPage = lazyPage(() => import('@/features/master/MasterSupportPage'))
const MasterPlatformPage = lazyPage(() => import('@/features/master/MasterPlatformPage'))

const MySchedulePage = lazyPage(() => import('@/features/schedule/MySchedulePage'))
const DashboardPage = lazyPage(() => import('@/features/tenant-dashboard/DashboardPage'))
const AppointmentsPage = lazyPage(() => import('@/features/appointments/AppointmentsPage'))
const NewAppointmentPage = lazyPage(() => import('@/features/appointments/NewAppointmentPage'))
const AppointmentDetailPage = lazyPage(() => import('@/features/appointments/AppointmentDetailPage'))
const CalendarPage = lazyPage(() => import('@/features/appointments/CalendarPage'))
const ServicesPage = lazyPage(() => import('@/features/services/ServicesPage'))
const ServiceFormPage = lazyPage(() => import('@/features/services/ServiceFormPage'))
const ServiceCategoriesPage = lazyPage(() => import('@/features/services/ServiceCategoriesPage'))
const ProfessionalsPage = lazyPage(() => import('@/features/professionals/ProfessionalsPage'))
const ProfessionalDetailPage = lazyPage(() => import('@/features/professionals/ProfessionalDetailPage'))
const CustomersPage = lazyPage(() => import('@/features/customers/CustomersPage'))
const CustomerDetailPage = lazyPage(() => import('@/features/customers/CustomerDetailPage'))
const PackagesPage = lazyPage(() => import('@/features/packages/PackagesPage'))
const PackageFormPage = lazyPage(() => import('@/features/packages/PackageFormPage'))
const PaymentsPage = lazyPage(() => import('@/features/payments/PaymentsPage'))
const SchedulePage = lazyPage(() => import('@/features/schedule/SchedulePage'))
const AutomationsPage = lazyPage(() => import('@/features/automations/AutomationsPage'))
const CommissionsPage = lazyPage(() => import('@/features/commissions/CommissionsPage'))
const FormsPage = lazyPage(() => import('@/features/forms/FormsPage'))
const UnitsPage = lazyPage(() => import('@/features/units/UnitsPage'))
const WaitlistPage = lazyPage(() => import('@/features/units/WaitlistPage'))
const ResourcesPage = lazyPage(() => import('@/features/resources/ResourcesPage'))
const AuditLogsPage = lazyPage(() => import('@/features/audit/AuditLogsPage'))
const MediaPage = lazyPage(() => import('@/features/media/MediaPage'))
const NotificationsPage = lazyPage(() => import('@/features/notifications/NotificationsPage'))
const SettingsPage = lazyPage(() => import('@/features/settings/SettingsPage'))
const GeneralSettingsPage = lazyPage(() => import('@/features/settings/GeneralSettingsPage'))
const BookingSettingsPage = lazyPage(() => import('@/features/settings/BookingSettingsPage'))
const ThemeSettingsPage = lazyPage(() => import('@/features/settings/ThemeSettingsPage'))
const WebhooksPage = lazyPage(() => import('@/features/settings/WebhooksPage'))
const PaymentSettingsPage = lazyPage(() => import('@/features/settings/PaymentSettingsPage'))
const NotificationSettingsPage = lazyPage(() => import('@/features/settings/NotificationSettingsPage'))
const WhatsAppSettingsPage = lazyPage(() => import('@/features/settings/WhatsAppSettingsPage'))
const CompanyProfilePage = lazyPage(() => import('@/features/settings/CompanyProfilePage'))
const PageSectionsPage = lazyPage(() => import('@/features/settings/PageSectionsPage'))
const LifecyclePage = lazyPage(() => import('@/features/lifecycle/LifecyclePage'))
const ReportsPage = lazyPage(() => import('@/features/reports/ReportsPage'))
const ReviewsPage = lazyPage(() => import('@/features/reviews/ReviewsPage'))
const CouponsPage = lazyPage(() => import('@/features/coupons/CouponsPage'))
const ProcedurePhotosPage = lazyPage(() => import('@/features/procedure-photos/ProcedurePhotosPage'))
const UsersPage = lazyPage(() => import('@/features/users/UsersPage'))
const TermsPage = lazyPage(() => import('@/features/settings/TermsPage'))
const ProductsPage = lazyPage(() => import('@/features/products/ProductsPage'))
const SuppliesPage = lazyPage(() => import('@/features/supplies/SuppliesPage'))
const SignupPage = lazyPage(() => import('@/features/auth/SignupPage'))
const PublicBookingPage = lazyPage(() => import('@/features/public-booking/PublicBookingPage'))
const CustomerAppointmentsPage = lazyPage(() => import('@/features/customer-portal/CustomerAppointmentsPage'))
const CustomerPackagesPage = lazyPage(() => import('@/features/customer-portal/CustomerPackagesPage'))
const CustomerProfilePage = lazyPage(() => import('@/features/customer-portal/CustomerProfilePage'))

function Fallback() {
  return <div className="flex items-center justify-center h-64"><LoadingState /></div>
}

function S(element: React.ReactNode) {
  return <Suspense fallback={<Fallback />}>{element}</Suspense>
}

function M(page: React.ReactNode) {
  return <ProtectedRoute requiredRole="super_admin"><MasterLayout>{S(page)}</MasterLayout></ProtectedRoute>
}
function A(page: React.ReactNode) {
  return <ProtectedRoute><AppLayout>{S(page)}</AppLayout></ProtectedRoute>
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },

  // Auth
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/signup', element: S(<SignupPage />) },
  { path: '/customer/login', element: <CustomerLoginPage /> },
  { path: '/customer/register', element: <CustomerRegisterPage /> },

  // Master
  { path: '/master/dashboard', element: M(<MasterDashboard />) },
  { path: '/master/tenants', element: M(<TenantsListPage />) },
  { path: '/master/tenants/new', element: M(<NewTenantPage />) },
  { path: '/master/tenants/:tenantId', element: M(<TenantDetailPage />) },
  { path: '/master/tenants/:tenantId/settings', element: M(<TenantSettingsPage />) },
  { path: '/master/tenants/:tenantId/theme', element: M(<TenantThemePage />) },
  { path: '/master/tenants/:tenantId/features', element: M(<TenantFeaturesPage />) },
  { path: '/master/tenants/:tenantId/limits', element: M(<TenantLimitsPage />) },
  { path: '/master/tenants/:tenantId/audit-logs', element: M(<TenantAuditLogsPage />) },
  { path: '/master/plans', element: M(<PlansListPage />) },
  { path: '/master/invoices', element: M(<MasterInvoicesPage />) },
  { path: '/master/jobs', element: M(<MasterJobsPage />) },
  { path: '/master/tasks', element: M(<MasterTasksPage />) },
  { path: '/master/notifications', element: M(<MasterNotificationsPage />) },
  { path: '/master/support', element: M(<MasterSupportPage />) },
  { path: '/master/platform', element: M(<MasterPlatformPage />) },
  { path: '/master', element: <Navigate to="/master/dashboard" replace /> },

  // Tenant app
  { path: '/app/my-schedule', element: A(<MySchedulePage />) },
  { path: '/app/dashboard', element: A(<DashboardPage />) },
  { path: '/app/appointments', element: A(<AppointmentsPage />) },
  { path: '/app/appointments/new', element: A(<NewAppointmentPage />) },
  { path: '/app/appointments/:appointmentId', element: A(<AppointmentDetailPage />) },
  { path: '/app/calendar', element: A(<CalendarPage />) },
  { path: '/app/services', element: A(<ServicesPage />) },
  { path: '/app/services/new', element: A(<ServiceFormPage />) },
  { path: '/app/services/:serviceId/edit', element: A(<ServiceFormPage />) },
  { path: '/app/service-categories', element: A(<ServiceCategoriesPage />) },
  { path: '/app/professionals', element: A(<ProfessionalsPage />) },
  { path: '/app/professionals/new', element: A(<ProfessionalDetailPage />) },
  { path: '/app/professionals/:professionalId', element: A(<ProfessionalDetailPage />) },
  { path: '/app/customers', element: A(<CustomersPage />) },
  { path: '/app/customers/:customerId', element: A(<CustomerDetailPage />) },
  { path: '/app/packages', element: A(<PackagesPage />) },
  { path: '/app/packages/new', element: A(<PackageFormPage />) },
  { path: '/app/packages/:packageId', element: A(<PackageFormPage />) },
  { path: '/app/payments', element: A(<PaymentsPage />) },
  { path: '/app/schedule', element: A(<SchedulePage />) },
  { path: '/app/automations', element: A(<AutomationsPage />) },
  { path: '/app/commissions', element: A(<CommissionsPage />) },
  { path: '/app/forms', element: A(<FormsPage />) },
  { path: '/app/units', element: A(<UnitsPage />) },
  { path: '/app/waitlist', element: A(<WaitlistPage />) },
  { path: '/app/resources', element: A(<ResourcesPage />) },
  { path: '/app/audit-logs', element: A(<AuditLogsPage />) },
  { path: '/app/media', element: A(<MediaPage />) },
  { path: '/app/notifications', element: A(<NotificationsPage />) },
  { path: '/app/support', element: A(<div className="p-6"><h1 className="text-xl font-bold mb-4">Suporte</h1><p className="text-slate-500">Para abrir um ticket de suporte, entre em contato pelo email <a href="mailto:suporte@automic.tech.com.br" className="text-primary-600 hover:underline">suporte@automic.tech.com.br</a></p></div>) },
  {
    path: '/app/settings',
    element: A(<SettingsPage />),
    children: [
      { index: true, element: S(<GeneralSettingsPage />) },
      { path: 'booking', element: S(<BookingSettingsPage />) },
      { path: 'payment', element: S(<PaymentSettingsPage />) },
      { path: 'theme', element: S(<ThemeSettingsPage />) },
      { path: 'notifications', element: S(<NotificationSettingsPage />) },
      { path: 'webhooks', element: S(<WebhooksPage />) },
      { path: 'whatsapp', element: S(<WhatsAppSettingsPage />) },
      { path: 'users', element: S(<UsersPage />) },
      { path: 'terms', element: S(<TermsPage />) },
      { path: 'company', element: S(<CompanyProfilePage />) },
      { path: 'page-sections', element: S(<PageSectionsPage />) },
    ],
  },
  { path: '/app/lifecycle', element: A(<LifecyclePage />) },
  { path: '/app/reports', element: A(<ReportsPage />) },
  { path: '/app/reviews', element: A(<ReviewsPage />) },
  { path: '/app/coupons', element: A(<CouponsPage />) },
  { path: '/app/procedure-photos', element: A(<ProcedurePhotosPage />) },
  { path: '/app/products', element: A(<ProductsPage />) },
  { path: '/app/supplies', element: A(<SuppliesPage />) },

  // Public booking (mobile-first)
  { path: '/:slug', element: S(<PublicBookingPage />) },

  // Customer portal (mobile-first)
  { path: '/customer/tenants/:slug/appointments', element: <CustomerProtectedRoute>{S(<CustomerAppointmentsPage />)}</CustomerProtectedRoute> },
  { path: '/customer/tenants/:slug/packages', element: <CustomerProtectedRoute>{S(<CustomerPackagesPage />)}</CustomerProtectedRoute> },
  { path: '/customer/tenants/:slug/profile', element: <CustomerProtectedRoute>{S(<CustomerProfilePage />)}</CustomerProtectedRoute> },

  { path: '*', element: <Navigate to="/login" replace /> },
])

export function AppRouter() { return <RouterProvider router={router} /> }
