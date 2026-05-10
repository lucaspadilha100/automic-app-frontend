import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute, CustomerProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { MasterLayout } from '@/components/layout/MasterLayout'
import { LoadingState } from '@/components/feedback/LoadingState'

// Auth (small, loaded eagerly — first paint)
import LoginPage from '@/features/auth/LoginPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import CustomerLoginPage from '@/features/customer-auth/CustomerLoginPage'
import CustomerRegisterPage from '@/features/customer-auth/CustomerRegisterPage'

// All other pages — lazy loaded
const MasterDashboard = lazy(() => import('@/features/master/MasterDashboard'))
const TenantsListPage = lazy(() => import('@/features/master/TenantsListPage'))
const NewTenantPage = lazy(() => import('@/features/master/NewTenantPage'))
const TenantDetailPage = lazy(() => import('@/features/master/TenantDetailPage'))
const TenantFeaturesPage = lazy(() => import('@/features/master/TenantFeaturesPage'))
const TenantLimitsPage = lazy(() => import('@/features/master/TenantLimitsPage'))
const TenantAuditLogsPage = lazy(() => import('@/features/master/TenantAuditLogsPage'))
const TenantSettingsPage = lazy(() => import('@/features/master/TenantSettingsPage'))
const TenantThemePage = lazy(() => import('@/features/master/TenantThemePage'))
const PlansListPage = lazy(() => import('@/features/master/PlansListPage'))
const MasterInvoicesPage = lazy(() => import('@/features/master/MasterInvoicesPage'))
const MasterJobsPage = lazy(() => import('@/features/master/MasterJobsPage'))
const MasterTasksPage = lazy(() => import('@/features/master/MasterTasksPage'))
const MasterNotificationsPage = lazy(() => import('@/features/master/MasterNotificationsPage'))
const MasterSupportPage = lazy(() => import('@/features/master/MasterSupportPage'))
const MasterPlatformPage = lazy(() => import('@/features/master/MasterPlatformPage'))

const MySchedulePage = lazy(() => import('@/features/schedule/MySchedulePage'))
const DashboardPage = lazy(() => import('@/features/tenant-dashboard/DashboardPage'))
const AppointmentsPage = lazy(() => import('@/features/appointments/AppointmentsPage'))
const NewAppointmentPage = lazy(() => import('@/features/appointments/NewAppointmentPage'))
const AppointmentDetailPage = lazy(() => import('@/features/appointments/AppointmentDetailPage'))
const CalendarPage = lazy(() => import('@/features/appointments/CalendarPage'))
const ServicesPage = lazy(() => import('@/features/services/ServicesPage'))
const ServiceFormPage = lazy(() => import('@/features/services/ServiceFormPage'))
const ServiceCategoriesPage = lazy(() => import('@/features/services/ServiceCategoriesPage'))
const ProfessionalsPage = lazy(() => import('@/features/professionals/ProfessionalsPage'))
const ProfessionalDetailPage = lazy(() => import('@/features/professionals/ProfessionalDetailPage'))
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage'))
const CustomerDetailPage = lazy(() => import('@/features/customers/CustomerDetailPage'))
const PackagesPage = lazy(() => import('@/features/packages/PackagesPage'))
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage'))
const SchedulePage = lazy(() => import('@/features/schedule/SchedulePage'))
const AutomationsPage = lazy(() => import('@/features/automations/AutomationsPage'))
const CommissionsPage = lazy(() => import('@/features/commissions/CommissionsPage'))
const FormsPage = lazy(() => import('@/features/forms/FormsPage'))
const UnitsPage = lazy(() => import('@/features/units/UnitsPage'))
const WaitlistPage = lazy(() => import('@/features/units/WaitlistPage'))
const ResourcesPage = lazy(() => import('@/features/resources/ResourcesPage'))
const AuditLogsPage = lazy(() => import('@/features/audit/AuditLogsPage'))
const MediaPage = lazy(() => import('@/features/media/MediaPage'))
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const GeneralSettingsPage = lazy(() => import('@/features/settings/GeneralSettingsPage'))
const BookingSettingsPage = lazy(() => import('@/features/settings/BookingSettingsPage'))
const ThemeSettingsPage = lazy(() => import('@/features/settings/ThemeSettingsPage'))
const WebhooksPage = lazy(() => import('@/features/settings/WebhooksPage'))
const PaymentSettingsPage = lazy(() => import('@/features/settings/PaymentSettingsPage'))
const NotificationSettingsPage = lazy(() => import('@/features/settings/NotificationSettingsPage'))
const WhatsAppSettingsPage = lazy(() => import('@/features/settings/WhatsAppSettingsPage'))
const LifecyclePage = lazy(() => import('@/features/lifecycle/LifecyclePage'))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'))
const ReviewsPage = lazy(() => import('@/features/reviews/ReviewsPage'))
const CouponsPage = lazy(() => import('@/features/coupons/CouponsPage'))
const ProcedurePhotosPage = lazy(() => import('@/features/procedure-photos/ProcedurePhotosPage'))
const UsersPage = lazy(() => import('@/features/users/UsersPage'))
const TermsPage = lazy(() => import('@/features/settings/TermsPage'))
const ProductsPage = lazy(() => import('@/features/products/ProductsPage'))
const SuppliesPage = lazy(() => import('@/features/supplies/SuppliesPage'))
const SignupPage = lazy(() => import('@/features/auth/SignupPage'))
const PublicBookingPage = lazy(() => import('@/features/public-booking/PublicBookingPage'))
const CustomerAppointmentsPage = lazy(() => import('@/features/customer-portal/CustomerAppointmentsPage'))
const CustomerPackagesPage = lazy(() => import('@/features/customer-portal/CustomerPackagesPage'))
const CustomerProfilePage = lazy(() => import('@/features/customer-portal/CustomerProfilePage'))

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
