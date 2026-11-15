import type { DragEvent } from 'react';
import { GripVertical, Mail, Phone } from 'lucide-react';
import type { Lead } from '@/src/lib/types';
import { cn } from '@/src/lib/cn';

interface KanbanCardProps {
  lead: Lead;
  isDragging?: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>, leadId: number) => void;
  onDragEnd: () => void;
  onSelect: (leadId: number) => void;
}

export function KanbanCard({
  lead,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onSelect,
}: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(lead.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(lead.id);
        }
      }}
      className={cn(
        'group cursor-grab rounded-lg border border-slate-200 bg-white p-3.5 transition-all duration-150 hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700',
        isDragging && 'opacity-50 scale-[0.98]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
          {lead.name}
        </h4>
        <GripVertical
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400 dark:text-slate-700 dark:group-hover:text-slate-500"
          aria-hidden="true"
        />
      </div>

      <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
        <p className="flex items-center gap-1.5 truncate">
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{lead.email}</span>
        </p>
        {lead.phone && (
          <p className="flex items-center gap-1.5 font-mono tabular-nums">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>{lead.phone}</span>
          </p>
        )}
      </div>

      {lead.description && (
        <p className="mt-2.5 line-clamp-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {lead.description}
        </p>
      )}
    </div>
  );
}
