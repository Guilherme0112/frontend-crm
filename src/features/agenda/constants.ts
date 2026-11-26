import type { AgendaEventStatus } from '@/src/lib/types';

/** Opção sintética dos autocompletes de lead para avançar a página da busca. */
export const LOAD_MORE_LEADS = '__agenda_load_more_leads__';

export const AGENDA_STATUS_OPTIONS: Array<{ value: AgendaEventStatus; label: string }> = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'no_show', label: 'Não compareceu' },
];

export const AGENDA_STATUS_META: Record<
  string,
  { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }
> = {
  scheduled: { tone: 'warning', label: 'Agendado' },
  completed: { tone: 'success', label: 'Concluído' },
  canceled: { tone: 'neutral', label: 'Cancelado' },
  no_show: { tone: 'danger', label: 'Não compareceu' },
};

export const AGENDA_TYPE_LABEL: Record<string, string> = {
  meeting: 'Reunião',
  call: 'Ligação',
  follow_up: 'Follow-up',
};

export const AGENDA_ACTION_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  rescheduled: 'Remarcado',
  completed: 'Concluído',
  canceled: 'Cancelado',
  no_show: 'Não compareceu',
  reminder_failed: 'Falha no lembrete',
};
