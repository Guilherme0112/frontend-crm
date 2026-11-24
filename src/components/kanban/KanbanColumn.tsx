import { type FormEvent, useEffect, useRef, useState, type DragEvent } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha } from '@mui/material/styles';
import {
  GripVertical,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import type { Step } from '@/src/lib/types';
import { cn } from '@/src/lib/cn';
import { currencyToCents, formatCents } from '@/src/lib/format';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { useCreateLeadMutation } from '@/src/features/leads/hooks';
import { useLeadsInfiniteQuery } from '@/src/features/leads/hooks';
import { useToast } from '@/src/components/common/Toast';
import ActionButton from '@/src/components/common/Button';
import { TableActionButton } from '@/src/components/common/TableActionButton';
import { Modal } from '@/src/components/common/Modal';
import { ModalActions } from '@/src/components/common/ModalActions';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { KanbanCard } from './KanbanCard';
import { KanbanInlineLeadForm, type InlineLeadValues } from './KanbanInlineLeadForm';

const PER_PAGE = 10;

interface KanbanColumnProps {
  step: Step;
  draggingLeadId: number | null;
  draggingStepId: number | null;
  onDragStart: (e: DragEvent<HTMLDivElement>, leadId: number) => void;
  onDragEnd: () => void;
  onDropLead: (
    leadId: number,
    targetStepId: number,
    options: { previousId: number | null; nextId: number | null },
  ) => void;
  onSelectLead: (leadId: number) => void;
  onEditStep: (step: Step) => void;
  onDeleteStep: (step: Step) => void;
  onStepGripDragStart: (stepId: number) => void;
  onStepDrop: (draggedId: number, targetStepId: number) => void;
  /** true enquanto ainda há páginas de etapas a carregar — reorder exige lista completa */
  reorderDisabled?: boolean;
}

export function KanbanColumn({
  step,
  draggingLeadId,
  draggingStepId,
  onDragStart,
  onDragEnd,
  onDropLead,
  onSelectLead,
  onEditStep,
  onDeleteStep,
  onStepGripDragStart,
  onStepDrop,
  reorderDisabled = false,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  /** Índice do gap onde o composer de novo lead está aberto (0..leads.length) */
  const [addingAt, setAddingAt] = useState<number | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterForm, setFilterForm] = useState({ name: '' });
  const [columnFilter, setColumnFilter] = useState('');
  /** Posição de inserção calculada durante o drag (0..leads.length), null fora de arraste */
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const createLeadMutation = useCreateLeadMutation();
  const effectiveSearch = columnFilter.trim();
  const leadsQuery = useLeadsInfiniteQuery(step.id, effectiveSearch || undefined, PER_PAGE);
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const leads = leadsQuery.items;
  const hasMore = Boolean(leadsQuery.hasNextPage);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !leadsQuery.isFetchingNextPage) {
          void leadsQuery.fetchNextPage();
        }
      },
      { root, rootMargin: '120px 0px', threshold: 0.01 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, leadsQuery.isFetchingNextPage, leadsQuery.hasNextPage]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    // Permite drop tanto de leads quanto de colunas sendo reordenadas
    if (
      e.dataTransfer.types.includes('text/plain') ||
      e.dataTransfer.types.includes('application/x-step')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropIndex(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('application/x-step');
    if (raw) {
      setDropIndex(null);
      const draggedId = Number(raw);
      if (Number.isFinite(draggedId) && draggedId > 0) {
        onStepDrop(draggedId, step.id);
      }
      return;
    }
    const leadRaw = e.dataTransfer.getData('text/plain');
    const leadId = Number(leadRaw);
    setDropIndex(null);
    if (Number.isFinite(leadId) && leadId > 0) {
      onDropLead(leadId, step.id, neighborIdsFor(leadId, dropIndex));
    }
  };

  // Calcula os vizinhos (prev/next) da posição de inserção, excluindo o lead arrastado.
  const neighborIdsFor = (
    draggedLeadId: number,
    index: number | null,
  ): { previousId: number | null; nextId: number | null } => {
    if (index === null || effectiveSearch) {
      return { previousId: null, nextId: null };
    }

    const draggedIndex = leads.findIndex((lead) => lead.id === draggedLeadId);
    const others = draggedIndex === -1 ? leads : leads.filter((lead) => lead.id !== draggedLeadId);

    let mapped = index;
    if (draggedIndex !== -1 && draggedIndex < index) {
      mapped = index - 1;
    }

    const previousId = mapped > 0 ? others[mapped - 1]?.id ?? null : null;
    const nextId = mapped < others.length ? others[mapped]?.id ?? null : null;

    // Mesmo lugar de onde o lead saiu — não faz nada a menos que a etapa tenha mudado (o caller decide).
    return { previousId, nextId };
  };

  const onCreateInlineLead = async (values: InlineLeadValues) => {
    try {
      await createLeadMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        step_id: step.id,
        value_cents: currencyToCents(values.value ?? ''),
      });
      toast.success('Lead adicionado à etapa');
      setAddingAt(null);
      void leadsQuery.refetch();
    } catch (error) {
      toast.error('Erro ao criar lead', getApiErrorMessage(error));
    }
  };

  const insertGap = (index: number) => {
    const canShow = draggingLeadId === null && addingAt === null;
    return (
      <div
        key={`gap-${index}`}
        aria-hidden={!canShow}
        className="group/gap relative z-10 -my-[5.5px] flex h-[11px] shrink-0 items-center justify-center"
      >
        {canShow && (
          <>
            {/* Linha divisória */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-blue-500/80 opacity-0 transition-opacity duration-150 group-hover/gap:opacity-100"
            />
            {/* Botão + */}
            <TableActionButton tone="primary" onClick={() => setAddingAt(index)} aria-label="Criar lead aqui" title="Criar lead aqui">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
            </TableActionButton>
          </>
        )}
      </div>
    );
  };

  const renderInlineForm = () => (
    <KanbanInlineLeadForm
      isPending={createLeadMutation.isPending}
      onSubmit={(values) => void onCreateInlineLead(values)}
      onCancel={() => setAddingAt(null)}
    />
  );

  const dropLineSlot = (
    <div
      aria-hidden="true"
      className="pointer-events-none z-10 -my-[6px] flex h-[12px] items-center"
    >
      <div className="h-[3px] w-full rounded-full bg-blue-500/90 shadow-[0_0_0_1px_rgba(37,99,235,0.35)]" />
    </div>
  );

  const handleCardDragOver = (index: number) => (e: DragEvent<HTMLDivElement>) => {
    if (draggingLeadId === null || effectiveSearch) return;
    if (e.dataTransfer.types.includes('application/x-step')) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    setDropIndex(before ? index : index + 1);
  };

  const openFilter = () => {
    setMenuAnchor(null);
    setFilterForm({ name: '' });
    setFilterModalOpen(true);
  };

  const applyFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setColumnFilter(filterForm.name.trim());
    setFilterModalOpen(false);
  };

  const clearFilter = () => {
    setFilterForm({ name: '' });
    setColumnFilter('');
    setFilterModalOpen(false);
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`Etapa ${step.name}`}
      className={cn(
        'flex w-80 max-h-[calc(100vh-5.5rem)] shrink-0 flex-col rounded-2xl border border-zinc-950/[0.07] bg-zinc-950/[0.035] transition-colors dark:border-white/[0.07] dark:bg-white/[0.035]',
        isDragOver && 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-950/30',
        draggingStepId === step.id && 'opacity-60 ring-2 ring-blue-500/40',
      )}
    >
      {/* Column Header */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-950/[0.07] px-3.5 py-3 dark:border-white/[0.07]">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {step.name}
          </h3>
          {step.description && (
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {step.description}
            </p>
          )}
          {/* Total vem do próprio Step (GET /crms/{id}/steps) — sem request extra. */}
          <p
            className="mt-1 truncate text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400"
            title="Soma dos valores dos leads desta etapa"
          >
            {formatCents(step.leads_value_total_cents, step.currency)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            draggable={!reorderDisabled}
            onDragStart={(e) => {
              if (reorderDisabled) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.setData('application/x-step', String(step.id));
              e.dataTransfer.effectAllowed = 'move';
              onStepGripDragStart(step.id);
            }}
            onDragEnd={() => onStepGripDragStart(-1)}
            disabled={reorderDisabled}
            title={reorderDisabled ? 'Carregue todas as etapas para poder reordenar' : 'Arrastar para reordenar a etapa'}
            aria-label={reorderDisabled ? 'Reordenar desabilitado — carregue todas as etapas' : `Arrastar para reordenar ${step.name}`}
            aria-grabbed={draggingStepId === step.id}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              reorderDisabled
                ? 'cursor-not-allowed text-zinc-200 dark:text-zinc-700'
                : 'cursor-grab text-zinc-400 hover:bg-white hover:text-zinc-700 active:cursor-grabbing dark:hover:bg-white/[0.06] dark:hover:text-zinc-100',
            )}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <IconButton
            size="small"
            title="Ações da etapa"
            aria-label={`Ações da etapa ${step.name}`}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              '&:hover': {
                color: 'primary.main',
                borderColor: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      {/* Cards list — rolável com paginação infinita */}
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {leads.map((lead, index) => (
          <div key={lead.id} onDragOver={handleCardDragOver(index)}>
            {insertGap(index)}
            {addingAt === index && renderInlineForm()}
            {dropIndex === index && dropLineSlot}
            <KanbanCard
              lead={lead}
              isDragging={draggingLeadId === lead.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onSelect={onSelectLead}
            />
          </div>
        ))}

        {insertGap(leads.length)}
        {addingAt === leads.length && renderInlineForm()}
        {dropIndex === leads.length && dropLineSlot}

        {/* Sentinel / skeleton de paginação */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>Carregando mais…</span>
          </div>
        )}

        {leadsQuery.isPending && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" aria-hidden="true" />
          </div>
        )}

        {!hasMore && leads.length > PER_PAGE && (
          <p className="py-1 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-300 dark:text-zinc-600">
            Fim
          </p>
        )}

        {leads.length === 0 && !leadsQuery.isPending && addingAt === null && (
          <div className="rounded-lg border border-dashed border-zinc-950/[0.12] px-3 py-6 text-center text-xs text-zinc-500 dark:border-white/[0.12] dark:text-zinc-400">
            Arraste um lead para cá ou adicione abaixo
          </div>
        )}

        {/* Rodapé: botão de adicionar (o composer aparece no gap do fim da lista) */}
        {addingAt !== leads.length && (
          <ActionButton
            type="button"
            fullWidth
            size="small"
            onClick={() => setAddingAt(leads.length)}
            className="mt-1"
            startIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Adicionar lead
          </ActionButton>
        )}
      </div>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 170,
              mt: 0.5,
              borderRadius: 1.5,
              boxShadow: 'var(--shadow-pop)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onEditStep(step);
          }}
        >
          <ListItemIcon>
            <Pencil className="h-4 w-4" />
          </ListItemIcon>
          Editar
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            setMenuAnchor(null);
            onDeleteStep(step);
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Trash2 className="h-4 w-4" />
          </ListItemIcon>
          Excluir
        </MenuItem>
        <MenuItem onClick={openFilter}>
          <ListItemIcon>
            <Search className="h-4 w-4" />
          </ListItemIcon>
          Filtrar
        </MenuItem>
      </Menu>

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={`Filtrar leads · ${step.name}`}
        description="Filtre os leads desta etapa por nome."
      >
        <form onSubmit={applyFilter} className="space-y-4">
          <FormField label="Nome" htmlFor={`stage-filter-name-${step.id}`}>
            <TextInput
              id={`stage-filter-name-${step.id}`}
              limit={255}
              type="text"
              placeholder="Ex.: Maria Silva"
              value={filterForm.name}
              onChange={(event) =>
                setFilterForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FormField>

          <ModalActions
            onCancel={() => setFilterModalOpen(false)}
            submitLabel="Aplicar filtro"
            extraAction={
              <Button
                type="button"
                variant="text"
                color="primary"
                size="small"
                startIcon={<RotateCcw className="h-4 w-4" />}
                onClick={clearFilter}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Limpar filtro
              </Button>
            }
          />
        </form>
      </Modal>
    </section>
  );
}
