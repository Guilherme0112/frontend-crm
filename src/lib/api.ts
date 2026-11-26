import axios from 'axios';
import type {
  ApiResponse,
  AuthSessionData,
  AgendaEvent,
  AgendaEventPage,
  Company,
  CreateEmailConfigInput,
  CreateAgendaEventPayload,
  CreateCrmPayload,
  CreateGroupPayload,
  CreateLeadPayload,
  CreatePlanPayload,
  CreateSendingTemplatePayload,
  CreateStepPayload,
  CreateCheckoutPayload,
  CheckoutSession,
  CreateUserPayload,
  CreateWhatsappSenderInput,
  CreateWhatsappTemplateInput,
  LeadStepChangePage,
  LeadHistory,
  ListAgendaEventsParams,
  LeadSource,
  LeadSourcesReport,
  DashboardSummary,
  GroupSend,
  GroupSendPage,
  GroupSendRecipientsPage,
  Crm,
  CrmDashboardReport,
  CrmsComparisonReport,
  EmailConfig,
  Group,
  Invoice,
  Lead,
  LoginPayload,
  MeData,
  Plan,
  RegisterPayload,
  SendingTemplate,
  Step,
  Subscription,
  UpdateCompanyPayload,
  UpdateAgendaEventPayload,
  UpdateCrmPayload,
  UpdateEmailConfigInput,
  UpdateGroupPayload,
  UpdateLeadPayload,
  UpdatePlanPayload,
  UpdateSendingTemplatePayload,
  UpdateStepPayload,
  UpdateUserPayload,
  UpdateWhatsappSenderInput,
  UpdateWhatsappTemplateInput,
  UpdateWhatsappUnofficialInstanceInput,
  UpdateWhatsappUnofficialTemplateInput,
  User,
  WhatsappDispatchLog,
  WhatsappDispatchResult,
  WhatsappSender,
  WhatsappTemplate,
  WhatsappUnofficialDispatchLog,
  WhatsappUnofficialInstance,
  WhatsappUnofficialTemplate,
  CreateWhatsappUnofficialInstanceInput,
  CreateWhatsappUnofficialTemplateInput,
} from './types';

export const AUTH_TOKEN_KEY = 'crm_token';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

type UnauthorizedCallback = () => void;
let unauthorizedCallback: UnauthorizedCallback | null = null;
let isHandlingUnauthorized = false;

export function registerUnauthorizedHandler(cb: UnauthorizedCallback) {
  unauthorizedCallback = cb;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Timezone'] =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url || '';
    const isAuthCredentialAttempt =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (status === 401 && !isAuthCredentialAttempt) {
      clearStoredToken();
      if (!isHandlingUnauthorized && unauthorizedCallback) {
        isHandlingUnauthorized = true;
        try {
          unauthorizedCallback();
        } finally {
          setTimeout(() => {
            isHandlingUnauthorized = false;
          }, 500);
        }
      }
    }

    if (status === 403 && error?.response?.data?.subscription_blocked === true) {
      const onBilling = window.location.pathname.startsWith('/billing');

      if (!onBilling) {
        window.location.assign('/billing');
      }
    }

    return Promise.reject(error);
  },
);

// --- Auth ---
export async function login(payload: LoginPayload): Promise<AuthSessionData> {
  const res = await apiClient.post<ApiResponse<AuthSessionData>>('/auth/login', payload);
  return res.data.data;
}

export async function register(payload: RegisterPayload): Promise<AuthSessionData> {
  const res = await apiClient.post<ApiResponse<AuthSessionData>>('/auth/register', payload);
  return res.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function me(): Promise<MeData> {
  const res = await apiClient.get<ApiResponse<MeData>>('/auth/me');
  return res.data.data;
}

// --- Company ---
export async function getCompany(): Promise<Company> {
  const res = await apiClient.get<ApiResponse<Company>>('/company');
  return res.data.data;
}

export async function updateCompany(payload: UpdateCompanyPayload): Promise<Company> {
  const res = await apiClient.put<ApiResponse<Company>>('/company', payload);
  return res.data.data;
}

// --- Users ---
export async function listUsers(): Promise<User[]> {
  const res = await apiClient.get<ApiResponse<User[]>>('/users');
  return res.data.data;
}

export async function getUser(id: number): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
  return res.data.data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await apiClient.post<ApiResponse<User>>('/users', payload);
  return res.data.data;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, payload);
  return res.data.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

// --- CRMs ---
export async function listCrms(): Promise<Crm[]> {
  const res = await apiClient.get<ApiResponse<Crm[]>>('/crms');
  return res.data.data;
}

export async function getCrm(id: number): Promise<Crm> {
  const res = await apiClient.get<ApiResponse<Crm>>(`/crms/${id}`);
  return res.data.data;
}

export async function createCrm(payload: CreateCrmPayload): Promise<Crm> {
  const res = await apiClient.post<ApiResponse<Crm>>('/crms', payload);
  return res.data.data;
}

export async function updateCrm(id: number, payload: UpdateCrmPayload): Promise<Crm> {
  const res = await apiClient.put<ApiResponse<Crm>>(`/crms/${id}`, payload);
  return res.data.data;
}

export async function regenerateCrmToken(id: number): Promise<Crm> {
  const res = await apiClient.post<ApiResponse<Crm>>(`/crms/${id}/regenerate-token`);
  return res.data.data;
}

export async function reorderSteps(crmId: number, orderedStepIds: number[]): Promise<void> {
  await apiClient.put(`/crms/${crmId}/steps/reorder`, { step_ids: orderedStepIds });
}

export async function deleteCrm(id: number): Promise<void> {
  await apiClient.delete(`/crms/${id}`);
}

// --- Steps ---
export async function listSteps(crmId: number): Promise<Step[]> {
  const res = await apiClient.get<ApiResponse<Step[]>>(`/crms/${crmId}/steps`);
  return res.data.data;
}

export async function createStep(crmId: number, payload: CreateStepPayload): Promise<Step> {
  const res = await apiClient.post<ApiResponse<Step>>(`/crms/${crmId}/steps`, payload);
  return res.data.data;
}

export async function updateStep(stepId: number, payload: UpdateStepPayload): Promise<Step> {
  const res = await apiClient.put<ApiResponse<Step>>(`/steps/${stepId}`, payload);
  return res.data.data;
}

export async function deleteStep(stepId: number): Promise<void> {
  await apiClient.delete(`/steps/${stepId}`);
}

export interface StepWithCrm {
  id: number;
  name: string;
  position: number;
  crm_id: number;
  crm_name: string;
}

export async function listStepsAll(
  crmId?: number,
  search?: string,
  limit?: number,
): Promise<StepWithCrm[]> {
  const res = await apiClient.get<ApiResponse<StepWithCrm[]>>('/steps', {
    params: {
      ...(crmId !== undefined ? { crm_id: crmId } : {}),
      ...(search ? { search } : {}),
      ...(limit !== undefined ? { limit } : {}),
    },
  });
  return res.data.data;
}

// --- Leads ---
export async function listLeads(
  stepId?: number,
  search?: string,
  crmId?: number,
): Promise<Lead[]> {
  const params: Record<string, string | number> = {};
  if (stepId !== undefined) params.step_id = stepId;
  if (search) params.search = search;
  if (crmId !== undefined) params.crm_id = crmId;
  const res = await apiClient.get<ApiResponse<Lead[]>>('/leads', { params });
  return res.data.data;
}

export async function listLeadsPaginated(
  stepId?: number,
  search?: string,
  crmId?: number,
  page = 1,
  perPage = 15,
): Promise<{ data: Lead[]; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }> {
  const params: Record<string, string | number> = { page, per_page: perPage };
  if (stepId !== undefined) params.step_id = stepId;
  if (search) params.search = search;
  if (crmId !== undefined) params.crm_id = crmId;
  const res = await apiClient.get<{ data: Lead[]; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }>('/leads', { params });
  return res.data;
}

export async function getLead(id: number): Promise<Lead> {
  const res = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
  return res.data.data;
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const res = await apiClient.post<ApiResponse<Lead>>('/leads', payload);
  return res.data.data;
}

export async function updateLead(id: number, payload: UpdateLeadPayload): Promise<Lead> {
  const res = await apiClient.put<ApiResponse<Lead>>(`/leads/${id}`, payload);
  return res.data.data;
}

export async function deleteLead(id: number): Promise<void> {
  await apiClient.delete(`/leads/${id}`);
}

export async function updateLeadStep(
  id: number,
  stepId: number,
  options: { previousId?: number | null; nextId?: number | null } = {},
): Promise<Lead> {
  const res = await apiClient.patch<ApiResponse<Lead>>(`/leads/${id}/step`, {
    step_id: stepId,
    previous_id: options.previousId ?? null,
    next_id: options.nextId ?? null,
  });
  return res.data.data;
}

// --- Agenda de leads ---
export async function listAgendaEvents(params: ListAgendaEventsParams): Promise<AgendaEventPage> {
  const res = await apiClient.get<AgendaEventPage>('/agenda-events', { params });
  return res.data;
}

export async function getAgendaEvent(id: number): Promise<AgendaEvent> {
  const res = await apiClient.get<ApiResponse<AgendaEvent>>(`/agenda-events/${id}`);
  return res.data.data;
}

export async function createAgendaEvent(payload: CreateAgendaEventPayload): Promise<AgendaEvent> {
  const res = await apiClient.post<ApiResponse<AgendaEvent>>('/agenda-events', payload);
  return res.data.data;
}

export async function updateAgendaEvent(
  id: number,
  payload: UpdateAgendaEventPayload,
): Promise<AgendaEvent> {
  const res = await apiClient.put<ApiResponse<AgendaEvent>>(`/agenda-events/${id}`, payload);
  return res.data.data;
}

// --- Sending Templates ---
export async function listSendingTemplates(search?: string): Promise<SendingTemplate[]> {
  const res = await apiClient.get<ApiResponse<SendingTemplate[]>>('/sending-templates', {
    params: search ? { search } : {},
  });
  return res.data.data;
}

export async function getSendingTemplate(id: number): Promise<SendingTemplate> {
  const res = await apiClient.get<ApiResponse<SendingTemplate>>(`/sending-templates/${id}`);
  return res.data.data;
}

export async function createSendingTemplate(
  payload: CreateSendingTemplatePayload,
): Promise<SendingTemplate> {
  const res = await apiClient.post<ApiResponse<SendingTemplate>>('/sending-templates', payload);
  return res.data.data;
}

export async function updateSendingTemplate(
  id: number,
  payload: UpdateSendingTemplatePayload,
): Promise<SendingTemplate> {
  const res = await apiClient.put<ApiResponse<SendingTemplate>>(`/sending-templates/${id}`, payload);
  return res.data.data;
}

export async function deleteSendingTemplate(id: number): Promise<void> {
  await apiClient.delete(`/sending-templates/${id}`);
}

// --- Groups ---
export async function listGroups(): Promise<Group[]> {
  const res = await apiClient.get<ApiResponse<Group[]>>('/groups');
  return res.data.data;
}

export async function getGroup(id: number): Promise<Group> {
  const res = await apiClient.get<ApiResponse<Group>>(`/groups/${id}`);
  return res.data.data;
}

export async function createGroup(payload: CreateGroupPayload): Promise<Group> {
  const res = await apiClient.post<ApiResponse<Group>>('/groups', payload);
  return res.data.data;
}

export async function updateGroup(id: number, payload: UpdateGroupPayload): Promise<Group> {
  const res = await apiClient.put<ApiResponse<Group>>(`/groups/${id}`, payload);
  return res.data.data;
}

export async function deleteGroup(id: number): Promise<void> {
  await apiClient.delete(`/groups/${id}`);
}

export async function getGroupLeads(id: number): Promise<Lead[]> {
  const res = await apiClient.get<ApiResponse<Lead[]>>(`/groups/${id}/leads`);
  return res.data.data;
}

export async function getGroupLeadIds(id: number): Promise<number[]> {
  const res = await apiClient.get<ApiResponse<number[]>>(`/groups/${id}/leads`, { params: { ids_only: 1 } });
  return res.data.data;
}

export async function listGroupLeadsPaginated(
  id: number,
  page = 1,
  perPage = 10,
  search = '',
): Promise<{ data: Lead[]; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }> {
  const res = await apiClient.get<{ data: Lead[] | { data: Lead[] }; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }>(
    `/groups/${id}/leads`,
    { params: { page, per_page: perPage, ...(search ? { search } : {}) } },
  );
  const body = res.data;
  const data = Array.isArray(body.data) ? body.data : (body.data as any)?.data ?? [];
  return { data, meta: body.meta };
}

export async function getLeadStepChanges(
  crmId: number,
  page = 1,
  perPage = 25,
): Promise<LeadStepChangePage> {
  const res = await apiClient.get<ApiResponse<LeadStepChangePage>>(
    `/crms/${crmId}/lead-step-changes`,
    { params: { page, per_page: perPage } },
  );
  return res.data.data;
}

export async function getLeadSourcesReport(): Promise<LeadSourcesReport> {
  const res = await apiClient.get<ApiResponse<LeadSourcesReport>>('/reports/lead-sources');
  return res.data.data;
}

export async function getCrmDashboard(crmId: number): Promise<CrmDashboardReport> {
  const res = await apiClient.get<ApiResponse<CrmDashboardReport>>(`/crms/${crmId}/dashboard`);
  return res.data.data;
}

export async function getCrmsComparison(): Promise<CrmsComparisonReport> {
  const res = await apiClient.get<ApiResponse<CrmsComparisonReport>>('/reports/crms-comparison');
  return res.data.data;
}

export async function getLeadSource(leadId: number): Promise<LeadSource> {
  const res = await apiClient.get<ApiResponse<LeadSource>>(`/leads/${leadId}/source`);
  return res.data.data;
}

export async function getLeadHistory(leadId: number, limit = 100): Promise<LeadHistory> {
  const res = await apiClient.get<ApiResponse<LeadHistory>>(`/leads/${leadId}/history`, {
    params: { limit },
  });
  return res.data.data;
}

export async function syncGroupLeads(id: number, leadIds: number[]): Promise<void> {
  await apiClient.put(`/groups/${id}/leads`, { lead_ids: leadIds });
}

// --- Group Sends (campaigns) ---
export async function sendGroupEmails(
  id: number,
  payload: { template_id: number; email_config_id: number },
): Promise<GroupSend> {
  const res = await apiClient.post<ApiResponse<GroupSend>>(`/groups/${id}/send`, payload);
  return res.data.data;
}

export async function listGroupSends(
  id: number,
  page = 1,
  perPage = 10,
): Promise<GroupSendPage> {
  const res = await apiClient.get<ApiResponse<GroupSendPage>>(`/groups/${id}/sends`, {
    params: { page, per_page: perPage },
  });
  return res.data.data;
}

export async function listGroupSendRecipients(
  id: number,
  sendId: number,
  page = 1,
  perPage = 25,
): Promise<GroupSendRecipientsPage> {
  const res = await apiClient.get<ApiResponse<GroupSendRecipientsPage>>(
    `/groups/${id}/sends/${sendId}/recipients`,
    { params: { page, per_page: perPage } },
  );
  return res.data.data;
}

// --- Email Configs ---
export async function listEmailConfigs(): Promise<EmailConfig[]> {
  const res = await apiClient.get<ApiResponse<EmailConfig[]>>('/email-configs');
  return res.data.data;
}

export async function getEmailConfig(id: number): Promise<EmailConfig> {
  const res = await apiClient.get<ApiResponse<EmailConfig>>(`/email-configs/${id}`);
  return res.data.data;
}

export async function createEmailConfig(payload: CreateEmailConfigInput): Promise<EmailConfig> {
  const res = await apiClient.post<ApiResponse<EmailConfig>>('/email-configs', payload);
  return res.data.data;
}

export async function updateEmailConfig(
  id: number,
  payload: UpdateEmailConfigInput,
): Promise<EmailConfig> {
  const res = await apiClient.put<ApiResponse<EmailConfig>>(`/email-configs/${id}`, payload);
  return res.data.data;
}

export async function deleteEmailConfig(id: number): Promise<void> {
  await apiClient.delete(`/email-configs/${id}`);
}

// --- Plans ---
export async function listPlans(): Promise<Plan[]> {
  const res = await apiClient.get<ApiResponse<Plan[]>>('/plans');
  return res.data.data;
}

export async function getPlan(id: number): Promise<Plan> {
  const res = await apiClient.get<ApiResponse<Plan>>(`/plans/${id}`);
  return res.data.data;
}

export async function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  const res = await apiClient.post<ApiResponse<Plan>>('/plans', payload);
  return res.data.data;
}

export async function updatePlan(id: number, payload: UpdatePlanPayload): Promise<Plan> {
  const res = await apiClient.put<ApiResponse<Plan>>(`/plans/${id}`, payload);
  return res.data.data;
}

export async function deletePlan(id: number): Promise<void> {
  await apiClient.delete(`/plans/${id}`);
}

// --- Dashboard ---
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return res.data.data;
}

// --- Subscriptions ---
export async function listSubscriptions(): Promise<Subscription[]> {
  const res = await apiClient.get<ApiResponse<Subscription[]>>('/subscriptions');
  return res.data.data;
}

export async function getSubscription(id: number): Promise<Subscription> {
  const res = await apiClient.get<ApiResponse<Subscription>>(`/subscriptions/${id}`);
  return res.data.data;
}

export async function createCheckout(
  payload: CreateCheckoutPayload,
): Promise<CheckoutSession> {
  const res = await apiClient.post<ApiResponse<CheckoutSession>>(
    '/subscriptions/checkout',
    payload,
  );
  return res.data.data;
}

export async function changeSubscriptionPlan(
  payload: CreateCheckoutPayload,
): Promise<CheckoutSession> {
  const res = await apiClient.patch<ApiResponse<CheckoutSession>>('/subscriptions/plan', payload);
  return res.data.data;
}

export async function getPendingCheckout(): Promise<CheckoutSession | null> {
  const res = await apiClient.get<ApiResponse<CheckoutSession | null>>('/subscriptions/pending');
  return res.data.data;
}

export async function discardPendingCheckout(): Promise<{ discarded: number }> {
  const res = await apiClient.delete<ApiResponse<{ discarded: number }>>('/subscriptions/pending');
  return res.data.data;
}

export async function getBillingConfig(): Promise<{ mercadopago_public_key: string | null }> {
  const res = await apiClient.get<ApiResponse<{ mercadopago_public_key: string | null }>>(
    '/subscriptions/config',
  );
  return res.data.data;
}

export async function syncSubscription(id: number): Promise<Subscription> {
  const res = await apiClient.post<ApiResponse<Subscription>>(`/subscriptions/${id}/sync`);
  return res.data.data;
}

export async function cancelSubscription(id: number): Promise<Subscription> {
  const res = await apiClient.patch<ApiResponse<Subscription>>(`/subscriptions/${id}/cancel`);
  return res.data.data;
}

// --- Invoices ---
export async function listInvoices(): Promise<Invoice[]> {
  const res = await apiClient.get<ApiResponse<Invoice[]>>('/invoices');
  return res.data.data;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const res = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
  return res.data.data;
}

export async function downloadInvoicePdf(id: number): Promise<{ blob: Blob; fileName: string }> {
  const res = await apiClient.get<Blob>(`/invoices/${id}/pdf`, { responseType: 'blob' });

  const disposition = String(res.headers['content-disposition'] ?? '');
  const match = disposition.match(/filename="?([^"]+)"?/i);

  const blob = res.data.type === 'application/pdf'
    ? res.data
    : new Blob([res.data], { type: 'application/pdf' });

  return { blob, fileName: match?.[1] ?? `recibo-${id}.pdf` };
}

export async function payInvoice(id: number): Promise<Invoice> {
  const res = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/pay`);
  return res.data.data;
}

// --- WhatsApp Senders ---
export async function listWhatsappSenders(): Promise<WhatsappSender[]> {
  const res = await apiClient.get<ApiResponse<WhatsappSender[]>>('/whatsapp-senders');
  return res.data.data;
}

export async function getWhatsappSender(id: number): Promise<WhatsappSender> {
  const res = await apiClient.get<ApiResponse<WhatsappSender>>(`/whatsapp-senders/${id}`);
  return res.data.data;
}

export async function createWhatsappSender(
  payload: CreateWhatsappSenderInput,
): Promise<WhatsappSender> {
  const res = await apiClient.post<ApiResponse<WhatsappSender>>('/whatsapp-senders', payload);
  return res.data.data;
}

export async function updateWhatsappSender(
  id: number,
  payload: UpdateWhatsappSenderInput,
): Promise<WhatsappSender> {
  const res = await apiClient.put<ApiResponse<WhatsappSender>>(`/whatsapp-senders/${id}`, payload);
  return res.data.data;
}

export async function deleteWhatsappSender(id: number): Promise<void> {
  await apiClient.delete(`/whatsapp-senders/${id}`);
}

// --- WhatsApp Templates ---
export async function listWhatsappTemplates(): Promise<WhatsappTemplate[]> {
  const res = await apiClient.get<ApiResponse<WhatsappTemplate[]>>('/whatsapp-templates');
  return res.data.data;
}

export async function getWhatsappTemplate(id: number): Promise<WhatsappTemplate> {
  const res = await apiClient.get<ApiResponse<WhatsappTemplate>>(`/whatsapp-templates/${id}`);
  return res.data.data;
}

export async function createWhatsappTemplate(
  payload: CreateWhatsappTemplateInput,
): Promise<WhatsappTemplate> {
  const res = await apiClient.post<ApiResponse<WhatsappTemplate>>('/whatsapp-templates', payload);
  return res.data.data;
}

export async function updateWhatsappTemplate(
  id: number,
  payload: UpdateWhatsappTemplateInput,
): Promise<WhatsappTemplate> {
  const res = await apiClient.put<ApiResponse<WhatsappTemplate>>(`/whatsapp-templates/${id}`, payload);
  return res.data.data;
}

export async function deleteWhatsappTemplate(id: number): Promise<void> {
  await apiClient.delete(`/whatsapp-templates/${id}`);
}

// --- WhatsApp Dispatch ---
export type SendGroupWhatsappPayload =
  | { provider?: 'official'; whatsapp_sender_id: number; whatsapp_template_id: number }
  | {
      provider: 'unofficial';
      whatsapp_unofficial_instance_id: number;
      whatsapp_unofficial_template_id: number;
    };

export async function sendGroupWhatsapp(
  groupId: number,
  payload: SendGroupWhatsappPayload,
): Promise<WhatsappDispatchResult> {
  const res = await apiClient.post<ApiResponse<WhatsappDispatchResult>>(
    `/groups/${groupId}/send-whatsapp`,
    payload,
  );
  return res.data.data;
}

export interface WhatsappDispatchLogFilters {
  group_id?: number;
  lead_id?: number;
  status?: string;
}

export async function listWhatsappDispatchLogs(
  filters: WhatsappDispatchLogFilters & { page?: number; per_page?: number } = {},
): Promise<{ data: WhatsappDispatchLog[]; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }> {
  const res = await apiClient.get<{ data: WhatsappDispatchLog[]; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }>('/whatsapp-dispatch-logs', {
    params: filters,
  });
  return res.data;
}


// --- WhatsApp Unofficial Instances ---
export async function listWhatsappUnofficialInstances(): Promise<WhatsappUnofficialInstance[]> {
  const res = await apiClient.get<ApiResponse<WhatsappUnofficialInstance[]>>('/whatsapp-unofficial-instances');
  return res.data.data;
}

export async function createWhatsappUnofficialInstance(
  payload: CreateWhatsappUnofficialInstanceInput,
): Promise<WhatsappUnofficialInstance> {
  const res = await apiClient.post<ApiResponse<WhatsappUnofficialInstance>>('/whatsapp-unofficial-instances', payload);
  return res.data.data;
}

export async function updateWhatsappUnofficialInstance(
  id: number,
  payload: UpdateWhatsappUnofficialInstanceInput,
): Promise<WhatsappUnofficialInstance> {
  const res = await apiClient.put<ApiResponse<WhatsappUnofficialInstance>>(`/whatsapp-unofficial-instances/${id}`, payload);
  return res.data.data;
}

export async function deleteWhatsappUnofficialInstance(id: number): Promise<void> {
  await apiClient.delete(`/whatsapp-unofficial-instances/${id}`);
}

export async function connectWhatsappUnofficialInstance(id: number): Promise<{ data: WhatsappUnofficialInstance; meta: { qr_code?: string | null; pairing_code?: string | null; message?: string | null } }> {
  const res = await apiClient.post<ApiResponse<WhatsappUnofficialInstance> & { meta?: { qr_code?: string | null; pairing_code?: string | null; message?: string | null } }>(`/whatsapp-unofficial-instances/${id}/connect`);
  return { data: res.data.data, meta: res.data.meta ?? {} };
}

export async function getWhatsappUnofficialInstanceStatus(id: number): Promise<WhatsappUnofficialInstance> {
  const res = await apiClient.get<ApiResponse<WhatsappUnofficialInstance>>(`/whatsapp-unofficial-instances/${id}/status`);
  return res.data.data;
}

export async function disconnectWhatsappUnofficialInstance(id: number): Promise<WhatsappUnofficialInstance> {
  const res = await apiClient.post<ApiResponse<WhatsappUnofficialInstance>>(`/whatsapp-unofficial-instances/${id}/disconnect`);
  return res.data.data;
}

// --- WhatsApp Unofficial Templates ---
export async function listWhatsappUnofficialTemplates(): Promise<WhatsappUnofficialTemplate[]> {
  const res = await apiClient.get<ApiResponse<WhatsappUnofficialTemplate[]>>('/whatsapp-unofficial-templates');
  return res.data.data;
}

export async function createWhatsappUnofficialTemplate(
  payload: CreateWhatsappUnofficialTemplateInput,
): Promise<WhatsappUnofficialTemplate> {
  const res = await apiClient.post<ApiResponse<WhatsappUnofficialTemplate>>('/whatsapp-unofficial-templates', payload);
  return res.data.data;
}

export async function updateWhatsappUnofficialTemplate(
  id: number,
  payload: UpdateWhatsappUnofficialTemplateInput,
): Promise<WhatsappUnofficialTemplate> {
  const res = await apiClient.put<ApiResponse<WhatsappUnofficialTemplate>>(`/whatsapp-unofficial-templates/${id}`, payload);
  return res.data.data;
}

export async function deleteWhatsappUnofficialTemplate(id: number): Promise<void> {
  await apiClient.delete(`/whatsapp-unofficial-templates/${id}`);
}

export async function listWhatsappUnofficialDispatchLogs(
  filters: { group_id?: number; lead_id?: number; status?: string; instance_id?: number; page?: number; per_page?: number } = {},
): Promise<{ data: WhatsappUnofficialDispatchLog[]; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }> {
  const res = await apiClient.get<{ data: WhatsappUnofficialDispatchLog[]; meta: { current_page: number; per_page: number; total: number; last_page: number; from: number | null; to: number | null } }>('/whatsapp-unofficial-dispatch-logs', {
    params: filters,
  });
  return res.data;
}

