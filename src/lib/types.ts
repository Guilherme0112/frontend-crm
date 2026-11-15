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
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string | null;
  template_id: number;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string | null;
  template_id?: number;
}

export type PlanInterval = 'monthly' | 'yearly';

export interface Plan {
  id: number;
  name: string;
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

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface Subscription {
  id: number;
  plan_id: number;
  payment_method_id?: number | null;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at?: string | null;
  canceled_at?: string | null;
  created_at?: string;
}

export interface CreateSubscriptionPayload {
  plan_id: number;
  payment_method_id?: number | null;
}

export type InvoiceStatus = 'open' | 'paid' | 'void';

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

export type PaymentMethodType = 'card' | 'pix' | 'boleto';

export interface PaymentMethod {
  id: number;
  type: PaymentMethodType;
  brand?: string | null;
  last4?: string | null;
  holder_name?: string | null;
  is_default: boolean;
  created_at?: string;
}

export interface CreatePaymentMethodPayload {
  type: PaymentMethodType;
  brand?: string | null;
  last4?: string | null;
  holder_name?: string | null;
  is_default?: boolean;
}
