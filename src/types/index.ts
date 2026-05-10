export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  tenant_id?: string
  tenant_name?: string
  tenant_slug?: string
}

export interface CustomerAccount {
  id: string
  name: string
  email: string
  phone?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  status: string
  timezone: string
  email?: string
  phone?: string
  created_at: string
  subscription?: {
    plan_id: string
    status: string
    billing_mode: string
    trial_ends_at?: string
  }
}

export interface Plan {
  id: string
  name: string
  price_monthly: number
  max_appointments: number
  max_professionals: number
  is_active: boolean
}

export interface LimitOverride {
  max_appointments?: number
  max_professionals?: number
  max_units?: number
  [key: string]: unknown
}

export interface FeatureFlags {
  [key: string]: boolean
}

export interface TenantTheme {
  primary_color?: string
  logo_url?: string
  dark_logo_url?: string
  favicon_url?: string
}

export interface TenantSettings {
  public_name?: string
  description?: string
  website_url?: string
  [key: string]: unknown
}

export interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  user_id?: string
  created_at: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
}

// Auth
export interface AuthTokens {
  access_token: string
  refresh_token?: string
  token_type?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CustomerLoginRequest {
  email: string
  password: string
}

export interface CustomerRegisterRequest {
  name: string
  email: string
  phone?: string
  password: string
}

// Customer portal
export interface CustomerPortalProfile {
  id: string
  name: string
  email: string
  phone?: string
}

export interface Appointment {
  id: string
  start_datetime: string
  end_datetime: string
  status: string
  total_price?: number
  customer_name?: string
  professional?: { name: string }
  appointment_services?: { service_name_snapshot: string }[]
  cancellation_reason?: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  rescheduled_from_id?: string
  rescheduled_to_id?: string
}

export interface CustomerPackage {
  id: string
  package_name: string
  sessions_total: number
  sessions_used: number
  status: string
}

export interface ProcedureHistory {
  id: string
  appointment_id: string
  notes?: string
  created_at: string
}

// Customer
export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  tags?: CustomerTag[]
  created_at: string
}

export interface CustomerNote {
  id: string
  text: string
  created_at: string
}

export interface CustomerTag {
  id: string
  name: string
  color?: string
}

// Dashboard
export interface DashboardSummary {
  appointments_today: number
  appointments_this_week: number
  total_customers: number
  revenue_this_month: number
  occupancy_rate: number
}

export interface AppointmentsByStatus {
  status: string
  count: number
}

export interface RevenueByProfessional {
  professional_name: string
  revenue: number
}

export interface RevenueByService {
  service_name: string
  revenue: number
}

export interface NewCustomersOverTime {
  date: string
  count: number
}

// Media
export interface MediaFile {
  id: string
  url: string
  filename: string
  size?: number
  created_at: string
}

// Page section customization
export interface PageSectionConfig {
  visible?: boolean
  label?: string
  title?: string
  subtitle?: string
  background_color?: string
  background_image_url?: string
  overlay_opacity?: number
  cta_text?: string
}

export interface PageSections {
  hero?: PageSectionConfig
  about?: PageSectionConfig
  services?: PageSectionConfig
  team?: PageSectionConfig
  products?: PageSectionConfig
  portfolio?: PageSectionConfig
  reviews?: PageSectionConfig
  footer?: PageSectionConfig
}

// Public booking page
export interface PublicTenantInfo {
  tenant: {
    name: string
    short_description?: string
    category?: string
    phone?: string
    whatsapp?: string
    address?: string
    instagram?: string
  }
  theme: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    background_color?: string
    button_color?: string
    font_family?: string
  }
  settings: {
    show_prices?: boolean
    show_duration?: boolean
    allow_professional_choice?: boolean
    allow_any_professional?: boolean
    allow_multiple_services?: boolean
    allow_customer_cancel?: boolean
    allow_customer_reschedule?: boolean
    require_customer_cpf?: boolean
    require_terms_acceptance?: boolean
    homepage_title?: string
    homepage_subtitle?: string
    confirmation_message?: string
    terms_text?: string
    cancellation_policy_text?: string
  }
  booking_policy: {
    min_minutes_before_booking?: number
    max_days_ahead_booking?: number
    slot_interval_minutes?: number
  }
  business_hours: Array<{
    weekday: number
    open_time?: string
    close_time?: string
    is_closed: boolean
  }>
  page_sections?: PageSections
}

export interface Professional {
  id: string
  name: string
  bio?: string
  photo_url?: string
  service_ids?: string[]
}

export interface AppointmentCreate {
  professional_id?: string
  service_ids: string[]
  start_datetime: string
  customer_notes?: string
  source?: string
}

// PlanCreate
export interface PlanCreate {
  name: string
  description?: string
  price_monthly: number
  max_appointments: number
  max_professionals: number
  max_units?: number
  is_active?: boolean
}
