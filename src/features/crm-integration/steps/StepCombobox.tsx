import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Ban, Check, ChevronDown, Loader2, Plus } from 'lucide-react';
import { useCreateStepMutation } from '@/src/features/crm/hooks';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { cn } from '@/src/lib/cn';
import type { Step } from '@/src/lib/types';
import { TextInput } from '@/src/components/common/TextInput';
import ActionButton from '@/src/components/common/Button';

interface StepComboboxProps {
  crmId: number;
  steps: Step[];
  value: number | null;
  onChange: (stepId: number | null) => void;
  disabled?: boolean;
}

export function StepCombobox({ crmId, steps, value, onChange, disabled }: StepComboboxProps) {
  const { toast } = useToast();
  const createStepMutation = useCreateStepMutation(crmId);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const orderedSteps = useMemo(
    () => [...steps].sort((a, b) => a.position - b.position || a.id - b.id),
    [steps],
  );

  const term = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (term ? orderedSteps.filter((s) => s.name.toLowerCase().includes(term)) : orderedSteps),
    [orderedSteps, term],
  );

  const canCreate = term.length >= 2 && !orderedSteps.some((s) => s.name.toLowerCase() === term);
  const selectableCount = 1 + filtered.length + (canCreate ? 1 : 0);

  const selectedStep = orderedSteps.find((s) => s.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(-1);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const selectValue = (next: number | null) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (name.length < 2) return;
    const nextPosition = orderedSteps.length > 0 ? Math.max(...orderedSteps.map((s) => s.position)) + 1 : 0;
    try {
      const created = await createStepMutation.mutateAsync({ name, position: nextPosition });
      toast.success('Etapa criada');
      onChange(created.id);
      setOpen(false);
      setQuery('');
    } catch (error) {
      toast.error('Erro ao criar etapa', getApiErrorMessage(error));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % selectableCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + selectableCount) % selectableCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex === -1) {
        if (canCreate) void handleCreate();
        else if (filtered.length > 0) selectValue(filtered[0].id);
        return;
      }
      if (activeIndex === 0) {
        selectValue(null);
        return;
      }
      const filteredIndex = activeIndex - 1;
      if (filteredIndex < filtered.length) {
        selectValue(filtered[filteredIndex].id);
        return;
      }
      if (canCreate) void handleCreate();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        disabled={disabled || createStepMutation.isPending}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-950/[0.12] bg-white px-3.5 py-2 text-left text-sm text-zinc-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#101012] dark:text-zinc-100',
          !selectedStep && 'text-zinc-400 dark:text-zinc-500',
        )}
      >
        <span className="min-w-0 truncate">
          {selectedStep
            ? `${selectedStep.position}. ${selectedStep.name}`
            : value !== null
              ? 'Etapa não encontrada'
              : 'Nenhuma etapa configurada'}
        </span>
        {createStepMutation.isPending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />
        ) : (
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')} />
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-950/[0.1] bg-white shadow-[var(--shadow-pop)] dark:border-white/[0.1] dark:bg-[#1b1b1f]">
          <div className="border-b border-zinc-950/[0.06] p-2 dark:border-white/[0.06]">
            <TextInput
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar etapa..."
              aria-label="Buscar etapa"
              className="w-full rounded-lg border border-zinc-950/[0.1] bg-transparent px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
            />
          </div>

          <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            <li role="option" aria-selected={value === null}>
              <button
                type="button"
                onClick={() => selectValue(null)}
                onMouseEnter={() => setActiveIndex(0)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                  activeIndex === 0 && 'bg-zinc-950/[0.05] dark:bg-white/[0.07]',
                  value === null
                    ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400',
                )}
              >
                <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Nenhum (desativar integração)
                {value === null && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
              </button>
            </li>

            {filtered.map((step, index) => {
              const optionIndex = index + 1;
              const selected = step.id === value;
              return (
                <li key={step.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => selectValue(step.id)}
                    onMouseEnter={() => setActiveIndex(optionIndex)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                      activeIndex === optionIndex && 'bg-zinc-950/[0.05] dark:bg-white/[0.07]',
                      selected
                        ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-700 dark:text-zinc-300',
                    )}
                  >
                    <span className="min-w-0 truncate">
                      {step.position}. {step.name}
                    </span>
                    {selected && <Check className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && !canCreate && term.length > 0 && (
              <li className="px-3 py-2.5 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Nenhuma etapa encontrada
              </li>
            )}

            {canCreate && (
              <li role="option" aria-selected={false}>
                <ActionButton
                  type="button"
                  fullWidth
                  size="small"
                  onClick={() => void handleCreate()}
                  onMouseEnter={() => setActiveIndex(selectableCount - 1)}
                  sx={{ justifyContent: 'flex-start' }}
                  className={cn(
                    activeIndex === selectableCount - 1 && 'ring-2 ring-blue-300 dark:ring-blue-500',
                  )}
                  startIcon={<Plus className="h-4 w-4 shrink-0" aria-hidden="true" />}
                >
                  Criar etapa &quot;{query.trim()}&quot;
                </ActionButton>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
