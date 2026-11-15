import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { Step } from '@/src/lib/types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  steps: Step[];
  searchQuery: string;
  hasMore: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onMoveLead: (
    leadId: number,
    targetStepId: number,
    options: { previousId: number | null; nextId: number | null },
  ) => void;
  onSelectLead: (leadId: number) => void;
  onEditStep: (step: Step) => void;
  onDeleteStep: (step: Step) => void;
  onReorderSteps: (orderedIds: number[]) => void;
  reorderDisabled?: boolean;
}

export function KanbanBoard({
  steps,
  searchQuery,
  hasMore,
  isFetchingNextPage,
  onLoadMore,
  onMoveLead,
  onSelectLead,
  onEditStep,
  onDeleteStep,
  onReorderSteps,
  reorderDisabled = false,
}: KanbanBoardProps) {
  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);
  const [draggingStepId, setDraggingStepId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Rolagem horizontal até o fim → busca automática da próxima página de etapas
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin: '200px 0px', threshold: 0.01 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, steps.length, isFetchingNextPage]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, leadId: number) => {
    setDraggingLeadId(leadId);
    e.dataTransfer.setData('text/plain', String(leadId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
  };

  const handleDropLead = (
    leadId: number,
    targetStepId: number,
    options: { previousId: number | null; nextId: number | null },
  ) => {
    setDraggingLeadId(null);
    onMoveLead(leadId, targetStepId, options);
  };

  const handleStepDrop = (draggedId: number, targetStepId: number) => {
    setDraggingStepId(null);
    if (draggedId === targetStepId) return;

    const ordered = steps.map((step) => step.id).filter((id) => id !== draggedId);
    const targetIndex = ordered.indexOf(targetStepId);
    if (targetIndex === -1) return;
    ordered.splice(targetIndex, 0, draggedId);

    // Sem mudança real de ordem, não chama o backend
    const currentOrder = steps.map((step) => step.id);
    if (ordered.every((id, i) => id === currentOrder[i])) {
      return;
    }
    onReorderSteps(ordered);
  };

  return (
    <div ref={scrollRef} className="flex items-start gap-4 overflow-x-auto pb-4">
      {steps.map((step) => (
        <KanbanColumn
          key={step.id}
          step={step}
          searchQuery={searchQuery}
          draggingLeadId={draggingLeadId}
          draggingStepId={draggingStepId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDropLead={handleDropLead}
          onSelectLead={onSelectLead}
          onEditStep={onEditStep}
          onDeleteStep={onDeleteStep}
          onStepGripDragStart={setDraggingStepId}
          onStepDrop={handleStepDrop}
          reorderDisabled={reorderDisabled}
        />
      ))}
      {/* Sentinel de paginação horizontal */}
      {hasMore && (
        <div
          ref={sentinelRef}
          aria-label="Carregando mais etapas"
          className="flex h-96 w-72 shrink-0 items-center justify-center rounded-2xl border border-dashed border-zinc-950/[0.12] text-zinc-400 dark:border-white/[0.12] dark:text-zinc-500"
        >
          <div className="flex flex-col items-center gap-2 text-xs">
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Carregando etapas…</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" aria-hidden="true" />
                <span>Role para carregar mais</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
