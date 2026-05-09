import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ProtectedRoute, CustomerProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { MasterLayout } from '@/components/layout/MasterLayout'

// Auth
import LoginPage from '@/features/auth/LoginPage'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import CustomerLoginPage from '@/features/customer-auth/CustomerLoginPage'
import CustomerRegisterPage from '@/features/customer-auth/CustomerRegisterPage'

// Master
import MasterDashboard from '@/features/master/MasterDashboard'
import TenantsListPage from '@/features/master/TenantsListPage'
import NewTenantPage from '@/features/master/NewTenantPage'
import TenantDetailPage from '@/features/master/TenantDetailPage'
import TenantFeaturesPage from '@/features/master/TenantFeaturesPage'
import TenantLimitsPage from '@/features/master/TenantLimitsPage'
import TenantAuditLogsPage from '@/features/master/TenantAuditLogsPage'
import TenantSettingsPage from '@/features/master/TenantSettingsPage'
import TenantThemePage from '@/features/master/TenantThemePage'
import PlansListPage from '@/features/master/PlansListPage'
import MasterInvoicesPage from '@/features/master/MasterInvoicesPage'
import MasterJobsPage from '@/features/master/MasterJobsPage'
import MasterTasksPage from '@/features/master/MasterTasksPage'
import MasterNotificationsPage from '@/features/master/MasterNotificationsPage'
import MasterSupportPage from '@/features/master/MasterSupportPage'
import MasterPlatformPage from '@/features/master/MasterPlatformPage'

// Tenant app
import DashboardPage from '@/features/tenant-dashboard/DashboardPage'
import AppointmentsPage from '@/features/appointments/AppointmentsPage'
import NewAppointmentPage from '@/features/appointments/NewAppointmentPage'
import AppointmentDetailPage from '@/features/appointments/AppointmentDetailPage'
import CalendarPage from '@/features/appointments/CalendarPage'
import ServicesPage from '@/features/services/ServicesPage'
import ServiceFormPage from '@/features/services/ServiceFormPage'
import ServiceCategoriesPage from '@/features/services/ServiceCategoriesPage'
import ProfessionalsPage from '@/features/professionals/ProfessionalsPage'
import ProfessionalDetailPage from '@/features/professionals/ProfessionalDetailPage'
import CustomersPage from '@/features/customers/CustomersPage'
import CustomerDetailPage from '@/features/customers/CustomerDetailPage'
import PackagesPage from '@/features/packages/PackagesPage'
import PaymentsPage from '@/features/payments/PaymentsPage'
import SchedulePage from '@/features/schedule/SchedulePage'
import AutomationsPage from '@/features/automations/AutomationsPage'
import CommissionsPage from '@/features/commissions/CommissionsPage'
import FormsPage from '@/features/forms/FormsPage'
import UnitsPage from '@/features/units/UnitsPage'
import WaitlistPage from '@/features/units/WaitlistPage'
import ResourcesPage from '@/features/resources/ResourcesPage'
import AuditLogsPage from '@/features/audit/AuditLogsPage'
import MediaPage from '@/features/media/MediaPage'
import NotificationsPage from '@/features/notifications/NotificationsPage'
import SettingsPage from '@/features/settings/SettingsPage'
import GeneralSettingsPage from '@/features/settings/GeneralSettingsPage'
import BookingSettingsPage from '@/features/settings/BookingSettingsPage'
import ThemeSettingsPage from '@/features/settings/ThemeSettingsPage'
import WebhooksPage from '@/features/settings/WebhooksPage'
import PaymentSettingsPage from '@/features/settings/PaymentSettingsPage'
import NotificationSettingsPage from '@/features/settings/NotificationSettingsPage'
import WhatsAppSettingsPage from '@/features/settings/WhatsAppSettingsPage'
import LifecyclePage from '@/features/lifecycle/LifecyclePage'
import ReportsPage from '@/features/reports/ReportsPage'
import ReviewsPage from '@/features/reviews/ReviewsPage'
import CouponsPage from '@/features/coupons/CouponsPage'
import ProcedurePhotosPage from '@/features/procedure-photos/ProcedurePhotosPage'

// Public
import PublicBookingPage from '@/features/public-booking/PublicBookingPage'

// Customer portal
import CustomerAppointmentsPage from '@/features/customer-portal/CustomerAppointmentsPage'
import CustomerPackagesPage from '@/features/customer-portal/CustomerPackagesPage'
import CustomerProfilePage from '@/features/customer-portal/CustomerProfilePage'

function M(page: React.ReactNode) {
  return <ProtectedRoute requiredRole="super_admin"><MasterLayout>{page}</MasterLayout></ProtectedRoute>
}
function A(page: React.ReactNode) {
  return <ProtectedRoute><AppLayout>{page}</AppLayout></ProtectedRoute>
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },

  // Auth
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
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
      { index: true, element: <GeneralSettingsPage /> },
      { path: 'booking', element: <BookingSettingsPage /> },
      { path: 'payment', element: <PaymentSettingsPage /> },
      { path: 'theme', element: <ThemeSettingsPage /> },
      { path: 'notifications', element: <NotificationSettingsPage /> },
      { path: 'webhooks', element: <WebhooksPage /> },
      { path: 'whatsapp', element: <WhatsAppSettingsPage /> },
    ],
  },
  { path: '/app/lifecycle', element: A(<LifecyclePage />) },
  { path: '/app/reports', element: A(<ReportsPage />) },
  { path: '/app/reviews', element: A(<ReviewsPage />) },
  { path: '/app/coupons', element: A(<CouponsPage />) },
  { path: '/app/procedure-photos', element: A(<ProcedurePhotosPage />) },

  // Public booking (mobile-first)
  { path: '/:slug', element: <PublicBookingPage /> },

  // Customer portal (mobile-first)
  { path: '/customer/tenants/:slug/appointments', element: <CustomerProtectedRoute><CustomerAppointmentsPage /></CustomerProtectedRoute> },
  { path: '/customer/tenants/:slug/packages', element: <CustomerProtectedRoute><CustomerPackagesPage /></CustomerProtectedRoute> },
  { path: '/customer/tenants/:slug/profile', element: <CustomerProtectedRoute><CustomerProfilePage /></CustomerProtectedRoute> },

  { path: '*', element: <Navigate to="/login" replace /> },
])

export function AppRouter() { return <RouterProvider router={router} /> }
