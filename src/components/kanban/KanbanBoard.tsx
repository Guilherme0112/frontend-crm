import { useState, type DragEvent } from 'react';
import type { Lead, Step } from '@/src/lib/types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  steps: Step[];
  leads: Lead[];
  onMoveLead: (leadId: number, targetStepId: number) => void;
  onSelectLead: (leadId: number) => void;
  onEditStep: (step: Step) => void;
  onDeleteStep: (step: Step) => void;
}

export function KanbanBoard({
  steps,
  leads,
  onMoveLead,
  onSelectLead,
  onEditStep,
  onDeleteStep,
}: KanbanBoardProps) {
  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, leadId: number) => {
    setDraggingLeadId(leadId);
    e.dataTransfer.setData('text/plain', String(leadId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
  };

  const handleDropLead = (leadId: number, targetStepId: number) => {
    setDraggingLeadId(null);
    const current = leads.find((l) => l.id === leadId);
    if (!current || current.step_id === targetStepId) return;
    onMoveLead(leadId, targetStepId);
  };

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4">
      {steps.map((step) => {
        const columnLeads = leads.filter((lead) => lead.step_id === step.id);
        return (
          <KanbanColumn
            key={step.id}
            step={step}
            leads={columnLeads}
            draggingLeadId={draggingLeadId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDropLead={handleDropLead}
            onSelectLead={onSelectLead}
            onEditStep={onEditStep}
            onDeleteStep={onDeleteStep}
          />
        );
      })}
    </div>
  );
}
