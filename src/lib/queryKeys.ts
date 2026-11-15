export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  company: {
    detail: ['company'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: number) => ['users', id] as const,
  },
  crms: {
    all: ['crms'] as const,
    detail: (id: number) => ['crms', id] as const,
    steps: (crmId: number) => ['crms', crmId, 'steps'] as const,
  },
  leads: {
    all: ['leads'] as const,
    byStep: (stepId?: number) => (stepId ? (['leads', { stepId }] as const) : (['leads'] as const)),
    detail: (id: number) => ['leads', id] as const,
  },
  templates: {
    all: ['sending-templates'] as const,
    detail: (id: number) => ['sending-templates', id] as const,
  },
  groups: {
    all: ['groups'] as const,
    detail: (id: number) => ['groups', id] as const,
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
    detail: (id: number) => ['invoices', id] as const,
  },
  paymentMethods: {
    all: ['payment-methods'] as const,
  },
};
