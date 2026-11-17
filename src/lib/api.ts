import axios from 'axios';
import type {
  ApiResponse,
  AuthSessionData,
  Company,
  CreateEmailConfigInput,
  CreateCrmPayload,
  CreateGroupPayload,
  CreateLeadPayload,
  CreatePlanPayload,
  CreateSendingTemplatePayload,
  CreateStepPayload,
  CreateCheckoutPayload,
  CheckoutSession,
  CreateUserPayload,
  LeadStepChangePage,
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
  UpdateCrmPayload,
  UpdateEmailConfigInput,
  UpdateGroupPayload,
  UpdateLeadPayload,
  UpdatePlanPayload,
  UpdateSendingTemplatePayload,
  UpdateStepPayload,
  UpdateUserPayload,
  User,
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

    // Assinatura vencida: o backend trancou tudo menos a área de pagamento.
    // Mostrar um 403 solto em cada tela não ajuda ninguém — leva direto para
    // onde o cliente consegue resolver.
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

export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

// --- Users ---
export async function listUsers(page = 1, perPage = 25): Promise<PaginatedResponse<User>> {
  const res = await apiClient.get<PaginatedResponse<User>>('/users', {
    params: { page, per_page: perPage },
  });
  return res.data;
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
export async function listCrms(page = 1, perPage = 25): Promise<PaginatedResponse<Crm>> {
  const res = await apiClient.get<PaginatedResponse<Crm>>('/crms', {
    params: { page, per_page: perPage },
  });
  return res.data;
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
export async function listSteps(
  crmId: number,
  page = 1,
  perPage = 25,
): Promise<PaginatedResponse<Step>> {
  const res = await apiClient.get<PaginatedResponse<Step>>(`/crms/${crmId}/steps`, {
    params: { page, per_page: perPage },
  });
  return res.data;
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
  const res = await apiClient.get<{ data: StepWithCrm[] }>('/steps', {
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
  stepId: number | undefined,
  page = 1,
  perPage = 25,
  search?: string,
  crmId?: number,
): Promise<PaginatedResponse<Lead>> {
  const params: Record<string, string | number> = { page, per_page: perPage };
  if (stepId !== undefined) params.step_id = stepId;
  if (search) params.search = search;
  if (crmId !== undefined) params.crm_id = crmId;
  const res = await apiClient.get<PaginatedResponse<Lead>>('/leads', { params });
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

// --- Sending Templates ---
export async function listSendingTemplates(
  page = 1,
  perPage = 25,
  search?: string,
): Promise<PaginatedResponse<SendingTemplate>> {
  const res = await apiClient.get<PaginatedResponse<SendingTemplate>>('/sending-templates', {
    params: search ? { page, per_page: perPage, search } : { page, per_page: perPage },
  });
  return res.data;
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
export async function listGroups(
  page = 1,
  perPage = 25,
): Promise<PaginatedResponse<Group>> {
  const res = await apiClient.get<PaginatedResponse<Group>>('/groups', {
    params: { page, per_page: perPage },
  });
  return res.data;
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

export async function syncGroupLeads(id: number, leadIds: number[]): Promise<void> {
  await apiClient.put(`/groups/${id}/leads`, { lead_ids: leadIds });
}

// --- Group Sends (campaigns) ---
export async function sendGroupEmails(id: number): Promise<GroupSend> {
  const res = await apiClient.post<ApiResponse<GroupSend>>(`/groups/${id}/send`);
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
export async function listEmailConfigs(
  page = 1,
  perPage = 25,
): Promise<PaginatedResponse<EmailConfig>> {
  const res = await apiClient.get<PaginatedResponse<EmailConfig>>('/email-configs', {
    params: { page, per_page: perPage },
  });
  return res.data;
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
export async function listPlans(page = 1, perPage = 25): Promise<PaginatedResponse<Plan>> {
  const res = await apiClient.get<PaginatedResponse<Plan>>('/plans', {
    params: { page, per_page: perPage },
  });
  return res.data;
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
export async function listSubscriptions(page = 1, perPage = 25): Promise<PaginatedResponse<Subscription>> {
  const res = await apiClient.get<PaginatedResponse<Subscription>>('/subscriptions', {
    params: { page, per_page: perPage },
  });
  return res.data;
}

export async function getSubscription(id: number): Promise<Subscription> {
  const res = await apiClient.get<ApiResponse<Subscription>>(`/subscriptions/${id}`);
  return res.data.data;
}

/**
 * Abre a assinatura no Mercado Pago.
 *
 * Cartão devolve `init_point` (redirecionar para o Checkout Pro).
 */
export async function createCheckout(
  payload: CreateCheckoutPayload,
): Promise<CheckoutSession> {
  const res = await apiClient.post<ApiResponse<CheckoutSession>>(
    '/subscriptions/checkout',
    payload,
  );
  return res.data.data;
}

/** Reconciliação manual, para quando o webhook não alcança a aplicação. */
/**
 * Troca de plano: altera o valor da assinatura que já existe, sem redirect e
 * sem o cliente redigitar o cartão. Se o Mercado Pago recusar a alteração, o
 * backend devolve um checkout novo (`status: 'pending'` + `init_point`).
 */
export async function changeSubscriptionPlan(
  payload: CreateCheckoutPayload,
): Promise<CheckoutSession> {
  const res = await apiClient.patch<ApiResponse<CheckoutSession>>('/subscriptions/plan', payload);
  return res.data.data;
}

/** Contratação aguardando pagamento, com o link para concluí-la. */
export async function getPendingCheckout(): Promise<CheckoutSession | null> {
  const res = await apiClient.get<ApiResponse<CheckoutSession | null>>('/subscriptions/pending');
  return res.data.data;
}

/** Desiste da contratação pendente, liberando a escolha de outro plano. */
export async function discardPendingCheckout(): Promise<{ discarded: number }> {
  const res = await apiClient.delete<ApiResponse<{ discarded: number }>>('/subscriptions/pending');
  return res.data.data;
}

/** Chave pública do gateway, para o SDK tokenizar o cartão no navegador. */
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
export async function listInvoices(page = 1, perPage = 25): Promise<PaginatedResponse<Invoice>> {
  const res = await apiClient.get<PaginatedResponse<Invoice>>('/invoices', {
    params: { page, per_page: perPage },
  });
  return res.data;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const res = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
  return res.data.data;
}

/**
 * Baixa o recibo em PDF.
 *
 * Vai por axios (e não por um link direto) porque a rota exige o bearer token
 * — um `<a href>` sairia sem o header e levaria 401.
 */
export async function downloadInvoicePdf(id: number): Promise<{ blob: Blob; fileName: string }> {
  const res = await apiClient.get<Blob>(`/invoices/${id}/pdf`, { responseType: 'blob' });

  const disposition = String(res.headers['content-disposition'] ?? '');
  const match = disposition.match(/filename="?([^"]+)"?/i);

  // Reconstrói o Blob com o tipo explícito: sem `application/pdf` o navegador
  // trata como download genérico em vez de abrir no visualizador.
  const blob = res.data.type === 'application/pdf'
    ? res.data
    : new Blob([res.data], { type: 'application/pdf' });

  return { blob, fileName: match?.[1] ?? `recibo-${id}.pdf` };
}

export async function payInvoice(id: number): Promise<Invoice> {
  const res = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/pay`);
  return res.data.data;
}

