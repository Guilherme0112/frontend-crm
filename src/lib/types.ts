export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorPayload {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface Address {
  id?: number;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip_code?: string | null;
  ibge_code?: string | null;
}

export interface Company {
  id: number;
  name: string;
  document_number?: string | null;
  description?: string | null;
  website?: string | null;
  address?: Address | null;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  address_id?: number | null;
  address?: Address | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSessionData {
  user: User;
  company: Company;
  token: string;
  token_type: string;
}

export interface MeData {
  user: User;
  company: Company;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  company_name: string;
  company_document?: string | null;
  company_website?: string | null;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string | null;
}

export interface UpdateCompanyPayload {
  name?: string;
  description?: string | null;
  website?: string | null;
  document_number?: string | null;
  address?: Address | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  is_active?: boolean;
  address?: Address | null;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  is_active?: boolean;
  address?: Address | null;
}

export interface Crm {
  id: number;
  name: string;
  description?: string | null;
  token: string;
  color: string;
  public_step_id?: number | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCrmPayload {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface UpdateCrmPayload {
  name?: string;
  description?: string | null;
  color?: string | null;
  public_step_id?: number | null;
}

export interface Step {
  id: number;
  crm_id: number;
  name: string;
  description?: string | null;
  position: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStepPayload {
  name: string;
  description?: string | null;
  position?: number;
}

export interface UpdateStepPayload {
  name?: string;
  description?: string | null;
  position?: number;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  step_id: number;
  position: number;
  step_name?: string | null;
  crm_id?: number | null;
  crm_name?: string | null;
  description?: string | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLeadPayload {
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  step_id: number;
  description?: string | null;
}

export interface UpdateLeadPayload {
  name?: string;
  email?: string;
  phone?: string | null;
  website?: string | null;
  step_id?: number;
  description?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  utm_device?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
}

export interface SendingTemplate {
  id: number;
  name: string;
  description?: string | null;
  body: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSendingTemplatePayload {
  name: string;
  description?: string | null;
  body: string;
}

export interface UpdateSendingTemplatePayload {
  name?: string;
  description?: string | null;
  body?: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  template_id: number;
  email_config_id?: number | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string | null;
  template_id: number;
  email_config_id?: number | null;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string | null;
  template_id?: number;
  email_config_id?: number | null;
}

export type GroupSendStatus = 'processing' | 'completed' | 'completed_with_errors';
export type GroupRecipientStatus = 'queued' | 'sent' | 'failed';

export interface GroupSend {
  id: number;
  group_id: number;
  subject: string;
  template_name: string;
  from_address: string;
  from_name: string;
  total: number;
  sent: number;
  failed: number;
  status: GroupSendStatus;
  created_at: string;
}

export interface GroupSendPage {
  total: number;
  page: number;
  per_page: number;
  items: GroupSend[];
}

export interface GroupSendRecipient {
  id: number;
  lead_id: number | null;
  lead_name: string;
  lead_email: string;
  status: GroupRecipientStatus;
  attempts: number;
  error_message: string | null;
  sent_at: string | null;
}

export interface GroupSendRecipientsPage {
  total: number;
  page: number;
  per_page: number;
  items: GroupSendRecipient[];
}

export interface LeadStepChange {
  id: number;
  lead: {
    id: number;
    name: string;
    email: string | null;
  };
  from_step: { id: number; name: string | null } | null;
  to_step: { id: number; name: string | null } | null;
  changed_by: { id: number; name: string | null } | null;
  source: 'manual' | 'public' | 'system';
  created_at: string;
}

export interface LeadStepChangePage {
  total: number;
  page: number;
  per_page: number;
  items: LeadStepChange[];
}

export interface LeadHistoryMovement {
  id: number;
  from_step_name: string | null;
  to_step_name: string | null;
  changed_by_name: string | null;
  source: 'manual' | 'public' | 'system' | string;
}

export interface LeadHistoryEmail {
  id: number;
  status: GroupRecipientStatus;
  attempts: number;
  error_message: string | null;
  sent_at: string | null;
  lead_email: string | null;
  send_id: number | null;
  send_subject: string | null;
  template_name: string | null;
  group_id: number | null;
  group_name: string | null;
}

export interface LeadHistoryEntry {
  id: string;
  type: 'movement' | 'email';
  created_at: string;
  data: LeadHistoryMovement | LeadHistoryEmail;
}

export interface LeadHistory {
  lead: {
    id: number;
    name: string;
    email: string;
  };
  source: LeadSource | null;
  timeline: LeadHistoryEntry[];
  counts: {
    movements: number;
    emails: number;
  };
}

export interface LeadSource {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  utm_device: string | null;
  referrer: string | null;
  landing_page: string | null;
}

export interface LeadSourceReportRow {
  source: string;
  leads: number;
  last_captured_at: string | null;
}

export interface LeadSourcesReport {
  total_attributed_leads: number;
  rows: LeadSourceReportRow[];
}

export interface CrmDashboardStepRow {
  step_id: number;
  name: string;
  position: number;
  leads: number;
}

export interface CrmDashboardChange {
  id: number;
  lead: { name: string; email: string | null };
  from_step_name: string | null;
  to_step_name: string | null;
  changed_by_name: string | null;
  source: 'manual' | 'public' | 'system';
  created_at: string;
}

export interface CrmDashboardDwellRow {
  step_id: number;
  name: string;
  position: number;
  avg_seconds: number | null;
  observations: number;
}

export interface CrmDashboardReport {
  window_days: number;
  leads_total: number;
  leads_last_30_days: number;
  avg_dwell_per_step: CrmDashboardDwellRow[];
  general_avg_dwell_seconds: number | null;
  dwell_observations: number;
  leads_by_step: CrmDashboardStepRow[];
  leads_by_source_last_30_days: { source: string; leads: number }[];
  leads_by_device_last_30_days: CrmDeviceRow[];
  recent_step_changes: CrmDashboardChange[];
}

export interface CrmDeviceRow {
  device: string;
  leads: number;
}

export interface CrmsComparisonStepRow {
  position: number;
  name: string;
  leads: number;
}

export interface CrmsComparisonSourceRow {
  source: string;
  leads: number;
}

export interface CrmsComparisonRow {
  crm_id: number;
  name: string;
  color: string;
  steps_count: number;
  leads_total: number;
  leads_last_30_days: number;
  step_changes_last_30_days: number;
  top_source: string | null;
  leads_by_step: CrmsComparisonStepRow[];
  sources_last_30_days: CrmsComparisonSourceRow[];
}

export interface CrmsComparisonReport {
  window_days: number;
  totals: {
    leads_total: number;
    leads_last_30_days: number;
    step_changes_last_30_days: number;
  };
  sources_last_30_days: CrmsComparisonSourceRow[];
  devices_last_30_days: CrmDeviceRow[];
  rows: CrmsComparisonRow[];
}

export type EmailEncryption = 'tls' | 'ssl' | 'none';

export interface EmailConfig {
  id: number;
  name: string;
  host: string;
  port: number;
  encryption: EmailEncryption;
  username: string;
  has_password: boolean;
  from_address: string;
  from_name: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmailConfigInput {
  name: string;
  host: string;
  port: number;
  encryption: EmailEncryption;
  username: string;
  password: string;
  from_address: string;
  from_name: string;
}

export type UpdateEmailConfigInput = Partial<Omit<CreateEmailConfigInput, 'password'>> & {
  password?: string; // omit/empty -> keep stored password
};

export type PlanInterval = 'monthly' | 'yearly';

export interface Plan {
  id: number;
  name: string;
  /** Identificador usado no checkout (o backend cobra por slug, não por id). */
  slug: string | null;
  description?: string | null;
  price: number;
  currency: string;
  interval: PlanInterval;
  is_active: boolean;
  created_at?: string;
}

export interface CreatePlanPayload {
  name: string;
  description?: string | null;
  price: number;
  currency?: string;
  interval?: PlanInterval;
  is_active?: boolean;
}

export interface UpdatePlanPayload {
  name?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  interval?: PlanInterval;
  is_active?: boolean;
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'pending';

/** Cartão debitado automaticamente pelo Mercado Pago, via preapproval. */
export type BillingMethod = 'card';

export interface Subscription {
  id: number;
  plan_id: number;
  payment_method_id?: number | null;
  status: SubscriptionStatus;
  billing_method?: BillingMethod;
  starts_at: string;
  external_id?: string | null;
  /** Troca de plano: a assinatura que esta substitui quando o pagamento entrar. */
  replaces_subscription_id?: number | null;
  /** Inadimplência: até quando o acesso continua valendo com a parcela em aberto. */
  grace_until?: string | null;
  ends_at?: string | null;
  canceled_at?: string | null;
  created_at?: string;
}

export interface CreateCheckoutPayload {
  plan_slug: string;
  billing_method: BillingMethod;
  /**
   * Cartão tokenizado pelo SDK do Mercado Pago no navegador. Só o token sai
   * daqui — número, CVV e validade nunca chegam ao backend.
   *
   * Ausente: o backend devolve `init_point` e o pagamento vai por redirect.
   */
  card_token_id?: string;
}

/** Resposta de POST /subscriptions/checkout. */
export interface CheckoutSession {
  subscription_id: number;
  plan_slug: string;
  status: SubscriptionStatus;
  billing_method: BillingMethod;
  external_id: string | null;
  /** Preenchido quando é troca de plano: a assinatura que será substituída. */
  replaces_subscription_id: number | null;
  /** URL do Checkout Pro para onde redirecionar. */
  init_point: string | null;
}

// O backend (DemoDataSeeder) grava 'overdue' para faturas vencidas e não pagas;
// a API devolve o status como string, então cobrimos também esse valor.
export type InvoiceStatus = 'open' | 'paid' | 'void' | 'overdue';

export interface Invoice {
  id: number;
  subscription_id: number;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at?: string | null;
  created_at?: string;
}


export interface DashboardRecentLead {
  id: number;
  name: string;
  email: string | null;
  step_name: string;
  crm_id: number;
  crm_name: string;
  crm_color: string | null;
  created_at: string;
}

export interface DashboardRecentAuditChange {
  id: number;
  source: 'manual' | 'public' | 'system';
  lead_id: number;
  lead_name: string | null;
  lead_email: string | null;
  from_step_name: string | null;
  to_step_name: string | null;
  changed_by_name: string | null;
  crm_id: number | null;
  crm_name: string | null;
  crm_color: string | null;
  created_at: string;
}

export interface DashboardSummary {
  window_days: number;
  metrics: {
    total_leads: number;
    total_crms: number;
    leads_created_last_30_days: number;
  };
  recent_crms: Crm[];
  recent_leads: DashboardRecentLead[];
  recent_audit: DashboardRecentAuditChange[];
  billing: {
    open_invoices_total: number;
    open_invoices_count: number;
    recent_invoices: Invoice[];
  };
  subscription?: {
    status: string;
    plan_name?: string;
    amount?: number;
    currency?: string;
    ends_at?: string;
    plan_id?: number;
  } | null;
}

// --- WhatsApp ---
export interface WhatsappSender {
  id: number;
  name: string;
  phone_number: string | null;
  phone_number_id: string;
  has_access_token: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWhatsappSenderInput {
  name: string;
  phone_number?: string | null;
  phone_number_id: string;
  access_token: string;
  is_active?: boolean;
}

export type UpdateWhatsappSenderInput = Partial<Omit<CreateWhatsappSenderInput, 'access_token'>> & {
  access_token?: string; // omit/empty -> keep stored token
};

export interface WhatsappTemplate {
  id: number;
  name: string;
  language: string;
  category?: string | null;
  variable_mapping: Record<string, unknown> | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWhatsappTemplateInput {
  name: string;
  language: string;
  category?: string | null;
  variable_mapping?: Record<string, unknown> | null;
  is_active?: boolean;
}

export type UpdateWhatsappTemplateInput = Partial<CreateWhatsappTemplateInput>;

export type WhatsappDispatchStatus = 'pending' | 'sent' | 'failed';

export interface WhatsappDispatchLog {
  id: number;
  company_id: number;
  group_id: number | null;
  lead_id: number | null;
  whatsapp_sender_id: number;
  whatsapp_template_id: number;
  recipient_phone: string;
  status: WhatsappDispatchStatus;
  wamid: string | null;
  error_message: string | null;
  sent_at: string | null;
  attempts: number;
  created_by: number | null;
  created_at?: string;
  updated_at?: string;
}

/* (pagination removed: API returns only items) */

export interface WhatsappDispatchResult {
  total: number;
  queued: number;
  failed: number;
  logs: number[];
  provider?: 'official' | 'unofficial';
}

export interface WhatsappUnofficialInstance {
  id: number;
  name: string;
  provider: string;
  base_url: string;
  instance_key: string;
  phone_number?: string | null;
  status: string;
  last_status_checked_at?: string | null;
  is_active: boolean;
  has_api_key: boolean;
  settings?: Record<string, unknown> | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWhatsappUnofficialInstanceInput {
  name: string;
  provider?: string;
  base_url?: string | null;
  api_key?: string | null;
  instance_key: string;
  phone_number?: string | null;
  is_active?: boolean;
  settings?: Record<string, unknown> | null;
}

export type UpdateWhatsappUnofficialInstanceInput = Partial<Omit<CreateWhatsappUnofficialInstanceInput, 'api_key'>> & {
  api_key?: string;
};

export interface WhatsappUnofficialTemplate {
  id: number;
  name: string;
  body: string;
  variable_mapping: Record<string, unknown> | null;
  is_active: boolean;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWhatsappUnofficialTemplateInput {
  name: string;
  body: string;
  variable_mapping?: Record<string, unknown> | null;
  is_active?: boolean;
}

export type UpdateWhatsappUnofficialTemplateInput = Partial<CreateWhatsappUnofficialTemplateInput>;

export interface WhatsappUnofficialDispatchLog {
  id: number;
  company_id: number;
  group_id: number | null;
  lead_id: number | null;
  whatsapp_unofficial_instance_id: number;
  whatsapp_unofficial_template_id: number | null;
  recipient_phone: string;
  message_body?: string | null;
  status: WhatsappDispatchStatus | 'skipped';
  external_message_id: string | null;
  error_code?: string | null;
  error_message: string | null;
  attempts: number;
  sent_at: string | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}
