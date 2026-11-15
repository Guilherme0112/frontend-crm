import axios from 'axios';
import type {
  ApiResponse,
  AuthSessionData,
  Company,
  CreateCrmPayload,
  CreateGroupPayload,
  CreateLeadPayload,
  CreatePaymentMethodPayload,
  CreatePlanPayload,
  CreateSendingTemplatePayload,
  CreateStepPayload,
  CreateSubscriptionPayload,
  CreateUserPayload,
  Crm,
  Group,
  Invoice,
  Lead,
  LoginPayload,
  MeData,
  PaymentMethod,
  Plan,
  RegisterPayload,
  SendingTemplate,
  Step,
  Subscription,
  UpdateCompanyPayload,
  UpdateCrmPayload,
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

// --- Leads ---
export async function listLeads(stepId?: number): Promise<Lead[]> {
  const res = await apiClient.get<ApiResponse<Lead[]>>('/leads', {
    params: stepId ? { step_id: stepId } : undefined,
  });
  return res.data.data;
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

export async function updateLeadStep(id: number, stepId: number): Promise<Lead> {
  const res = await apiClient.patch<ApiResponse<Lead>>(`/leads/${id}/step`, {
    step_id: stepId,
  });
  return res.data.data;
}

// --- Sending Templates ---
export async function listSendingTemplates(): Promise<SendingTemplate[]> {
  const res = await apiClient.get<ApiResponse<SendingTemplate[]>>('/sending-templates');
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

// --- Subscriptions ---
export async function listSubscriptions(): Promise<Subscription[]> {
  const res = await apiClient.get<ApiResponse<Subscription[]>>('/subscriptions');
  return res.data.data;
}

export async function getSubscription(id: number): Promise<Subscription> {
  const res = await apiClient.get<ApiResponse<Subscription>>(`/subscriptions/${id}`);
  return res.data.data;
}

export async function createSubscription(
  payload: CreateSubscriptionPayload,
): Promise<Subscription> {
  const res = await apiClient.post<ApiResponse<Subscription>>('/subscriptions', payload);
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

export async function payInvoice(id: number): Promise<Invoice> {
  const res = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/pay`);
  return res.data.data;
}

// --- Payment Methods ---
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await apiClient.get<ApiResponse<PaymentMethod[]>>('/payment-methods');
  return res.data.data;
}

export async function createPaymentMethod(
  payload: CreatePaymentMethodPayload,
): Promise<PaymentMethod> {
  const res = await apiClient.post<ApiResponse<PaymentMethod>>('/payment-methods', payload);
  return res.data.data;
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await apiClient.delete(`/payment-methods/${id}`);
}

export async function setDefaultPaymentMethod(id: number): Promise<PaymentMethod> {
  const res = await apiClient.patch<ApiResponse<PaymentMethod>>(
    `/payment-methods/${id}/default`,
  );
  return res.data.data;
}
