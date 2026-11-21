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
    stepsAll: (crmId?: number, search?: string) => ['crms', 'steps-all', crmId ?? 0, search ?? ''] as const,
  },
  leads: {
    all: ['leads'] as const,
    byStep: (stepId?: number) => (stepId ? (['leads', { stepId }] as const) : (['leads'] as const)),
    detail: (id: number) => ['leads', id] as const,
    history: (id: number) => ['leads', id, 'history'] as const,
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
    leadIds: (id: number) => ['groups', id, 'lead-ids'] as const,
    leadsPaginated: (id: number, page: number, perPage: number, search: string) => ['groups', id, 'leads', 'paginated', page, perPage, search] as const,
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
  whatsappSenders: {
    all: ['whatsapp-senders'] as const,
    list: (page: number, perPage: number) => ['whatsapp-senders', 'list', page, perPage] as const,
    detail: (id: number) => ['whatsapp-senders', id] as const,
  },
  whatsappTemplates: {
    all: ['whatsapp-templates'] as const,
    list: (page: number, perPage: number) => ['whatsapp-templates', 'list', page, perPage] as const,
    detail: (id: number) => ['whatsapp-templates', id] as const,
  },
  whatsappDispatchLogs: {
    all: ['whatsapp-dispatch-logs'] as const,
    list: (filters: Record<string, string | number | null | undefined>) =>
      ['whatsapp-dispatch-logs', 'list', filters] as const,
  },
  whatsappUnofficialInstances: {
    all: ['whatsapp-unofficial-instances'] as const,
    detail: (id: number) => ['whatsapp-unofficial-instances', id] as const,
  },
  whatsappUnofficialTemplates: {
    all: ['whatsapp-unofficial-templates'] as const,
    detail: (id: number) => ['whatsapp-unofficial-templates', id] as const,
  },
  whatsappUnofficialDispatchLogs: {
    all: ['whatsapp-unofficial-dispatch-logs'] as const,
    list: (filters: Record<string, string | number | null | undefined>) =>
      ['whatsapp-unofficial-dispatch-logs', 'list', filters] as const,
  },
  plans: {
    all: ['plans'] as const,
    detail: (id: number) => ['plans', id] as const,
  },
  billing: {
    config: ['billing', 'config'] as const,
  },
  subscriptions: {
    all: ['subscriptions'] as const,
    pending: ['subscriptions', 'pending'] as const,
    detail: (id: number) => ['subscriptions', id] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (page: number, perPage: number) => ['invoices', 'list', page, perPage] as const,
    detail: (id: number) => ['invoices', id] as const,
  },
};
