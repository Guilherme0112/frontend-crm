import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/src/lib/cn';
import { inputClassName } from './FormField';

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteProps {
  id?: string;
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  className?: string;
  /** Sobrescreve a classe do botão-gatilho (use apenas se precisar de estilo totalmente customizado). */
  fieldClassName?: string;
  /** Aplica a borda vermelha de erro, alinhada ao padrão do FormField. */
  hasError?: boolean;
  /** Esconde o botão X de limpar (padrão: true). Use em campos obrigatórios. */
  clearable?: boolean;
}

/**
 * Combobox acessível com busca/filtro. Substitui <select> por uma experiência
 * de autocomplete com teclado: digite para filtrar, setas para navegar,
 * Enter para selecionar, Escape para fechar.
 */
export function Autocomplete({
  id,
  value,
  options,
  onChange,
  placeholder = 'Selecione...',
  emptyLabel,
  emptyMessage = 'Nenhuma opção encontrada',
  ariaLabel,
  ariaDescribedBy,
  disabled,
  className,
  fieldClassName,
  hasError,
  clearable = true,
}: AutocompleteProps) {
  const autoId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const term = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        (option.description ?? '').toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term),
    );
  }, [options, term]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const pick = (option: AutocompleteOption | null) => {
    onChange(option ? option.value : '');
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    const total = filtered.length + (emptyLabel !== undefined && term === '' ? 1 : 0);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (total === 0 ? 0 : (prev + 1) % total));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (total === 0 ? 0 : (prev - 1 + total) % total));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (emptyLabel !== undefined && term === '' && activeIndex === 0) {
        pick(null);
        return;
      }
      const index = emptyLabel !== undefined && term === '' ? activeIndex - 1 : activeIndex;
      const option = filtered[index];
      if (option) pick(option);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const clearSelection = () => {
    onChange('');
    setQuery('');
    searchRef.current?.focus();
  };

  const showEmptyLabel = emptyLabel !== undefined && term === '';
  const cursor = showEmptyLabel ? activeIndex : activeIndex + 1;

  return (
    <div
      ref={rootRef}
      id={autoId}
      className={cn('relative', className)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${autoId}-listbox`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          fieldClassName ??
            cn(
              'flex w-full items-center justify-between gap-2 rounded-lg border py-2 pl-3.5 pr-2 text-left text-sm shadow-sm transition-shadow focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100',
              hasError
                ? 'border-red-400 bg-white focus:border-red-500 focus:ring-red-500/20 dark:border-red-800 dark:bg-[#101012]'
                : 'border-zinc-950/[0.12] bg-white focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-white/[0.12] dark:bg-[#101012] dark:focus:border-zinc-400 dark:focus:ring-white/10',
            ),
          !selected && 'text-zinc-400 dark:text-zinc-500',
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.label : placeholder}
        </span>
        {selected && clearable && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Limpar seleção"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            className="shrink-0 rounded-md p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-950/[0.1] bg-white shadow-[var(--shadow-pop)] dark:border-white/[0.12] dark:bg-[#1b1b1f]">
          <div className="flex items-center gap-2 border-b border-zinc-950/[0.06] px-3 py-2 dark:border-white/[0.06]">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Buscar..."
              aria-label="Filtrar opções"
              className="w-full bg-transparent py-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
            />
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
              {filtered.length}
            </span>
          </div>

          <ul id={`${autoId}-listbox`} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {showEmptyLabel && (
              <li role="option" aria-selected={value === ''}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(0)}
                  onClick={() => pick(null)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                    activeIndex === 0 ? 'bg-zinc-950/[0.05] dark:bg-white/[0.06]' : '',
                    value === '' ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400',
                  )}
                >
                  <span className="flex-1 truncate">{emptyLabel}</span>
                  {value === '' && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            )}
            {filtered.map((option, i) => {
              const idx = i + (showEmptyLabel ? 1 : 0);
              const selectedOption = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={selectedOption}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => pick(option)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors',
                      cursor === idx ? 'bg-zinc-950/[0.05] dark:bg-white/[0.06]' : '',
                      selectedOption ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {selectedOption && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-center text-xs text-zinc-400 dark:text-zinc-500">
                {emptyMessage}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
