export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  company: {
    detail: ['company'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (page: number, perPage: number) => ['users', 'list', page, perPage] as const,
    detail: (id: number) => ['users', id] as const,
  },
  audit: {
    leadStepChanges: (crmId: number) => ['crms', crmId, 'lead-step-changes'] as const,
  },
  reports: {
    leadSources: ['reports', 'lead-sources'] as const,
    crmsComparison: ['reports', 'crms-comparison'] as const,
    crmDashboard: (crmId: number) => ['crms', crmId, 'dashboard'] as const,
  },
  crms: {
    all: ['crms'] as const,
    detail: (id: number) => ['crms', id] as const,
    steps: (crmId: number) => ['crms', crmId, 'steps'] as const,
    stepsAll: (crmId?: number) => ['crms', 'steps-all', crmId ?? 0] as const,
  },
  leads: {
    all: ['leads'] as const,
    byStep: (stepId?: number) => (stepId ? (['leads', { stepId }] as const) : (['leads'] as const)),
    detail: (id: number) => ['leads', id] as const,
  },
  templates: {
    all: ['sending-templates'] as const,
    list: (page: number, perPage: number, search: string) =>
      ['sending-templates', 'list', page, perPage, search] as const,
    detail: (id: number) => ['sending-templates', id] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: (page: number, perPage: number) => ['groups', 'list', page, perPage] as const,
    detail: (id: number) => ['groups', id] as const,
    leads: (id: number) => ['groups', id, 'leads'] as const,
    sends: (id: number) => ['groups', id, 'sends'] as const,
    sendsList: (id: number, page: number, perPage: number) =>
      ['groups', id, 'sends', 'list', page, perPage] as const,
    recipients: (id: number, sendId: number, page: number, perPage: number) =>
      ['groups', id, 'sends', sendId, 'recipients', page, perPage] as const,
  },
  emailConfigs: {
    all: ['email-configs'] as const,
    list: (page: number, perPage: number) => ['email-configs', 'list', page, perPage] as const,
    detail: (id: number) => ['email-configs', id] as const,
  },
  plans: {
    all: ['plans'] as const,
    detail: (id: number) => ['plans', id] as const,
  },
  subscriptions: {
    all: ['subscriptions'] as const,
    detail: (id: number) => ['subscriptions', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (page: number, perPage: number) => ['invoices', 'list', page, perPage] as const,
    detail: (id: number) => ['invoices', id] as const,
  },
  paymentMethods: {
    all: ['payment-methods'] as const,
  },
};
