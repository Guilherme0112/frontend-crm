import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  UserX,
  Video,
} from 'lucide-react';
import ActionButton from '@/src/components/common/Button';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Pagination } from '@/src/components/common/Pagination';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { StatusIndicator } from '@/src/components/common/StatusBadge';
import { TableActionsMenu } from '@/src/components/common/TableActionsMenu';
import { cn } from '@/src/lib/cn';
import type { AgendaEvent, AgendaEventStatus } from '@/src/lib/types';
import { AgendaEventDrawer } from './AgendaEventDrawer';
import {
  AGENDA_STATUS_META,
  AGENDA_STATUS_OPTIONS,
  AGENDA_TYPE_LABEL,
  LOAD_MORE_LEADS,
} from './constants';
import {
  addDays,
  formatDayHeading,
  formatFullDay,
  formatTime,
  formatWeekRange,
  isSameDay,
  localDateKey,
  startOfWeek,
  weekRange,
} from './dates';
import {
  useAgendaEventsQuery,
  useAgendaLeadsQuery,
  useAgendaUsersQuery,
  useCancelAgendaEventMutation,
  useCompleteAgendaEventMutation,
  useNoShowAgendaEventMutation,
} from './hooks';

interface DrawerState {
  eventId: number | null;
  presetLeadId?: number | null;
}

function EventRow({
  event,
  onOpen,
  onComplete,
  onCancel,
  onNoShow,
}: {
  event: AgendaEvent;
  onOpen: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onNoShow: () => void;
}) {
  const status = AGENDA_STATUS_META[event.status] ?? { tone: 'neutral' as const, label: event.status };

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]',
        event.status === 'canceled' && 'opacity-60',
      )}
    >
      <td className="whitespace-nowrap px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          {formatTime(event.starts_at)} – {formatTime(event.ends_at)}
        </span>
      </td>
      <td className="max-w-[280px] px-5 py-3.5">
        <button
          type="button"
          onClick={onOpen}
          className="block max-w-full truncate text-left text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
        >
          {event.title}
        </button>
        {event.meeting_url && (
          <a
            href={event.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            <Video className="h-3.5 w-3.5" /> Abrir link
          </a>
        )}
      </td>
      <td className="max-w-[200px] px-5 py-3.5">
        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {event.lead?.name ?? '—'}
        </p>
        {event.lead?.email && (
          <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">{event.lead.email}</p>
        )}
      </td>
      <td className="px-5 py-3.5 text-sm text-zinc-600 dark:text-zinc-400">
        {event.assignee?.name ?? '—'}
      </td>
      <td className="px-5 py-3.5">
        <span className="inline-flex rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
          {AGENDA_TYPE_LABEL[event.type] ?? event.type}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <StatusIndicator tone={status.tone} label={status.label} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <TableActionsMenu
          label={`Ações de ${event.title}`}
          actions={[
            { label: 'Ver / editar', icon: <Pencil className="h-4 w-4" />, onClick: onOpen },
            ...(event.status === 'scheduled'
              ? [
                  {
                    label: 'Concluir',
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    onClick: onComplete,
                  },
                  {
                    label: 'Não compareceu',
                    icon: <UserX className="h-4 w-4" />,
                    onClick: onNoShow,
                  },
                  {
                    label: 'Cancelar',
                    icon: <Ban className="h-4 w-4" />,
                    tone: 'danger' as const,
                    onClick: onCancel,
                  },
                ]
              : []),
          ]}
        />
      </td>
    </tr>
  );
}

export function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const weekday = new Date().getDay();
    return weekday === 0 ? 6 : weekday - 1; // segunda = 0
  });
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [status, setStatus] = useState<AgendaEventStatus | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: number; leadId: number } | null>(null);
  // Users/leads só entram quando o filtro é aberto; eventos entram por dia.
  const [assigneeFilterOpen, setAssigneeFilterOpen] = useState(false);
  const [leadFilterOpen, setLeadFilterOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const [dayPage, setDayPage] = useState(1);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const selectedDate = useMemo(
    () => addDays(weekStart, selectedDayIndex),
    [weekStart, selectedDayIndex],
  );
  useEffect(() => {
    setLeadPage(1);
  }, [leadSearch]);

  const usersQuery = useAgendaUsersQuery(assigneeFilterOpen);
  const leadsQuery = useAgendaLeadsQuery(leadFilterOpen, leadSearch || undefined, leadPage);
  const date = localDateKey(selectedDate);
  const params = useMemo(
    () => ({
      date,
      assigned_to: assignedTo,
      lead_id: leadId,
      status,
      page: dayPage,
      per_page: 10,
    }),
    [date, assignedTo, leadId, status, dayPage],
  );
  const agendaQuery = useAgendaEventsQuery(params);
  const events = agendaQuery.data?.data ?? [];
  const meta = agendaQuery.data?.meta;

  const completeMutation = useCompleteAgendaEventMutation();
  const cancelMutation = useCancelAgendaEventMutation();
  const noShowMutation = useNoShowAgendaEventMutation();

  const fullDayLabel = formatFullDay(selectedDate);

  const goToToday = () => {
    const today = new Date();
    setWeekStart(startOfWeek(today));
    const weekday = today.getDay();
    setSelectedDayIndex(weekday === 0 ? 6 : weekday - 1);
    setDayPage(1);
  };

  const goToPreviousDay = () => {
    setDayPage(1);
    if (selectedDayIndex === 0) {
      setWeekStart((current) => addDays(current, -7));
      setSelectedDayIndex(6);
      return;
    }
    setSelectedDayIndex((index) => index - 1);
  };

  const goToNextDay = () => {
    setDayPage(1);
    if (selectedDayIndex === 6) {
      setWeekStart((current) => addDays(current, 7));
      setSelectedDayIndex(0);
      return;
    }
    setSelectedDayIndex((index) => index + 1);
  };

  const userOptions = (usersQuery.data ?? []).map((user) => ({
    value: String(user.id),
    label: user.name,
  }));
  const leadOptions = (leadsQuery.data ?? []).map((lead) => ({
    value: String(lead.id),
    label: lead.name,
  }));
  const leadSelectOptions = [
    ...leadOptions,
    ...(leadPage < (leadsQuery.meta?.last_page ?? 1)
      ? [{ value: LOAD_MORE_LEADS, label: 'Carregar mais leads…' }]
      : []),
  ];
  const statusOptions = AGENDA_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync(cancelTarget);
      setCancelTarget(null);
    } catch {
      // O toast de erro já foi exibido pelo hook; mantém o diálogo aberto.
    }
  };

  const quickAction = (
    mutation: { mutate: (vars: { id: number; leadId: number }) => void },
    event: AgendaEvent,
  ) => mutation.mutate({ id: event.id, leadId: event.lead_id });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Agenda</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Agenda de leads
          </h1>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Compromissos, remarcações e lembretes da equipe.
          </p>
        </div>

        <ActionButton
          type="button"
          onClick={() => setDrawer({ eventId: null })}
          className="shrink-0 whitespace-nowrap"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
          startIcon={<Plus className="h-4 w-4" />}
        >
          Novo evento
        </ActionButton>
      </div>

      <div className="flex flex-col gap-4 border-b border-zinc-950/[0.06] pb-4 dark:border-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            <IconButton
              size="small"
              aria-label="Dia anterior"
              title="Dia anterior"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Button size="small" variant="outlined" color="inherit" onClick={goToToday}>
              Hoje
            </Button>
            <IconButton
              size="small"
              aria-label="Próximo dia"
              title="Próximo dia"
              onClick={goToNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
            <span className="ml-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {formatDayHeading(selectedDate)}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Dia {selectedDayIndex + 1}/7
            </span>
            <span className="ml-2 hidden text-xs text-zinc-400 dark:text-zinc-500 sm:inline">
              {formatWeekRange(weekStart)}
            </span>
          </div>

          <div
            className="flex w-full gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Dias da semana"
          >
            {days.map((day, index) => {
              const isSelected = index === selectedDayIndex;
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={localDateKey(day)}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  title={`Buscar eventos de ${formatFullDay(day)}`}
                  onClick={() => {
                    setSelectedDayIndex(index);
                    setDayPage(1);
                  }}
                  className={cn(
                    'flex min-w-[96px] flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors',
                    isSelected
                      ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800/60 dark:bg-blue-500/10 dark:text-blue-200'
                      : 'border-zinc-950/[0.07] bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-zinc-300 dark:hover:bg-white/[0.05]',
                  )}
                >
                  <span className="text-xs font-semibold">{formatDayHeading(day)}</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isToday ? 'hoje' : 'ver eventos'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3">
            <Autocomplete
              id="agenda-assignee-filter"
              ariaLabel="Filtrar por responsável"
              placeholder="Todos os responsáveis"
              value={assignedTo === null ? '' : String(assignedTo)}
              onChange={(value) => {
                setAssignedTo(value === '' ? null : Number(value));
                setDayPage(1);
              }}
              onOpen={() => setAssigneeFilterOpen(true)}
              options={userOptions}
              emptyMessage="Nenhum responsável encontrado"
              loading={assigneeFilterOpen && usersQuery.isFetching}
              className="w-full"
            />
            <Autocomplete
              id="agenda-lead-filter"
              ariaLabel="Filtrar por lead"
              placeholder="Todos os leads"
              value={leadId === null ? '' : String(leadId)}
              onChange={(value) => {
                if (value === LOAD_MORE_LEADS) {
                  setLeadPage((page) => page + 1);
                  return;
                }
                setLeadId(value === '' ? null : Number(value));
                setDayPage(1);
              }}
              onOpen={() => setLeadFilterOpen(true)}
              onSearch={setLeadSearch}
              options={leadSelectOptions}
              emptyMessage="Nenhum lead encontrado"
              loading={leadFilterOpen && leadsQuery.isFetching}
              className="w-full"
            />
            <Autocomplete
              id="agenda-status-filter"
              ariaLabel="Filtrar por status"
              placeholder="Todos os status"
              value={status ?? ''}
              onChange={(value) => {
                setStatus(value === '' ? null : (value as AgendaEventStatus));
                setDayPage(1);
              }}
              options={statusOptions}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {agendaQuery.isPending && (
        <div className="overflow-hidden rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <TableRowsSkeleton rows={5} cols={7} />
        </div>
      )}

      {agendaQuery.isError && (
        <ErrorState
          title="Não foi possível carregar a agenda"
          error={agendaQuery.error}
          onRetry={() => void agendaQuery.refetch()}
        />
      )}

      {agendaQuery.isSuccess && events.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Nenhum evento neste dia"
          description="Use a navegação de dias ou crie um novo evento para começar."
          action={
            <ActionButton
              type="button"
              onClick={() => setDrawer({ eventId: null })}
              startIcon={<Plus className="h-4 w-4" />}
            >
              Novo evento
            </ActionButton>
          }
        />
      )}

      {agendaQuery.isSuccess && events.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-950/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
            <h2 className="font-display text-[15px] font-semibold capitalize text-zinc-900 dark:text-zinc-100">
              {fullDayLabel}
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {meta?.total ?? 0} {meta?.total === 1 ? 'evento' : 'eventos'} · mais cedo primeiro
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-950/[0.07] text-xs font-medium text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                  <th className="px-5 py-3">Horário</th>
                  <th className="px-5 py-3">Compromisso</th>
                  <th className="px-5 py-3">Lead</th>
                  <th className="px-5 py-3">Responsável</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
                {events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onOpen={() => setDrawer({ eventId: event.id })}
                    onComplete={() => quickAction(completeMutation, event)}
                    onNoShow={() => quickAction(noShowMutation, event)}
                    onCancel={() => setCancelTarget({ id: event.id, leadId: event.lead_id })}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-zinc-950/[0.06] px-5 dark:border-white/[0.06]">
            <Pagination
              page={dayPage}
              lastPage={meta?.last_page ?? 1}
              total={meta?.total ?? 0}
              from={meta?.from ?? null}
              to={meta?.to ?? null}
              onPageChange={setDayPage}
              ariaLabel="Paginação dos eventos do dia"
            />
          </div>

          <div className="grid grid-cols-2 items-center gap-2 border-t border-zinc-950/[0.06] px-5 py-2.5 dark:border-white/[0.06] sm:flex sm:flex-wrap sm:justify-between">
            <Button
              size="small"
              variant="text"
              color="inherit"
              className="order-2 w-full sm:order-none sm:w-auto"
              startIcon={<ChevronLeft className="h-4 w-4" />}
              onClick={goToPreviousDay}
            >
              Dia anterior
            </Button>
            <span className="order-1 col-span-2 text-center text-xs text-zinc-500 dark:text-zinc-400 sm:order-none sm:col-span-1 sm:text-left">
              Dia {selectedDayIndex + 1} de 7 · {formatWeekRange(weekStart)}
            </span>
            <Button
              size="small"
              variant="text"
              color="inherit"
              className="order-3 w-full sm:order-none sm:w-auto"
              endIcon={<ChevronRight className="h-4 w-4" />}
              onClick={goToNextDay}
            >
              Próximo dia
            </Button>
          </div>
        </section>
      )}

      <AgendaEventDrawer
        open={drawer !== null}
        eventId={drawer?.eventId ?? null}
        presetLeadId={drawer?.presetLeadId ?? null}
        onClose={() => setDrawer(null)}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void handleConfirmCancel()}
        isPending={cancelMutation.isPending}
        title="Cancelar evento"
        description="O evento será marcado como cancelado e o horário liberado. O histórico do lead será mantido."
        confirmLabel="Cancelar evento"
      />
    </div>
  );
}
