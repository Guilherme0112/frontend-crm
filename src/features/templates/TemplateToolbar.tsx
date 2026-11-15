import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  ChevronDown,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
  Variable,
} from 'lucide-react';
import { cn } from '@/src/lib/cn';

interface TemplateToolbarProps {
  textareaId: string;
  value: string;
  onChange: (next: string, caret: number) => void;
}

const VARIABLES = [
  { token: '{{name}}', label: 'Nome' },
  { token: '{{nome}}', label: 'Nome (alias)' },
  { token: '{{email}}', label: 'E-mail' },
  { token: '{{company}}', label: 'Empresa' },
  { token: '{{empresa}}', label: 'Empresa (alias)' },
  { token: '{{phone}}', label: 'Telefone' },
  { token: '{{telefone}}', label: 'Telefone (alias)' },
];

/**
 * Barra de ferramentas de formatação para o corpo HTML do template.
 * Opera sobre a seleção do textarea; cada ação envolve/insere marcação HTML.
 */
export function TemplateToolbar({ textareaId, value, onChange }: TemplateToolbarProps) {
  const [varsOpen, setVarsOpen] = useState(false);
  const varsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!varsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (varsRef.current && !varsRef.current.contains(event.target as Node)) {
        setVarsOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [varsOpen]);

  const applyWrap = (before: string, after: string, placeholder: string) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.substring(start, end) || placeholder;
    const next = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(next, start + before.length + selected.length + after.length);
  };

  const insertSnippet = (snippet: string) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.substring(0, start) + snippet + value.substring(end);
    onChange(next, start + snippet.length);
  };

  const insertLink = () => {
    const url = window.prompt('URL do link:', 'https://');
    if (!url || url === 'https://') return;
    applyWrap(
      `<a href="${url}" style="color:#2563eb;font-weight:600;text-decoration:underline">`,
      '</a>',
      'texto do link',
    );
  };

  const toolBtn =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-950/[0.06] hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100';

  return (
    <div
      role="toolbar"
      aria-label="Formatação do email"
      className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-zinc-950/[0.12] bg-zinc-50 px-2 py-1.5 dark:border-white/[0.12] dark:bg-white/[0.04]"
    >
      <button type="button" className={toolBtn} title="Negrito" aria-label="Negrito" onClick={() => applyWrap('<strong>', '</strong>', 'texto em negrito')}>
        <Bold className="h-4 w-4" strokeWidth={2.2} />
      </button>
      <button type="button" className={toolBtn} title="Itálico" aria-label="Itálico" onClick={() => applyWrap('<em>', '</em>', 'texto em itálico')}>
        <Italic className="h-4 w-4" strokeWidth={2} />
      </button>
      <button type="button" className={toolBtn} title="Sublinhado" aria-label="Sublinhado" onClick={() => applyWrap('<u>', '</u>', 'texto sublinhado')}>
        <Underline className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        className={toolBtn}
        title="Título"
        aria-label="Título"
        onClick={() => applyWrap('<h2 style="margin:16px 0 8px;font-size:18px;line-height:1.3;color:#18181b">', '</h2>', 'Título do email')}
      >
        <Heading2 className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        className={toolBtn}
        title="Lista com marcadores"
        aria-label="Lista com marcadores"
        onClick={() => applyWrap('<ul style="margin:8px 0;padding-left:22px">\n  <li>', '</li>\n</ul>', 'item da lista')}
      >
        <List className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        className={toolBtn}
        title="Lista numerada"
        aria-label="Lista numerada"
        onClick={() => applyWrap('<ol style="margin:8px 0;padding-left:22px">\n  <li>', '</li>\n</ol>', 'item da lista')}
      >
        <ListOrdered className="h-4 w-4" strokeWidth={2} />
      </button>
      <button type="button" className={toolBtn} title="Inserir link" aria-label="Inserir link" onClick={insertLink}>
        <Link2 className="h-4 w-4" strokeWidth={2} />
      </button>

      <span className="mx-1 h-5 w-px bg-zinc-950/[0.12] dark:bg-white/[0.12]" aria-hidden="true" />

      {/* Inserir variável */}
      <div ref={varsRef} className="relative">
        <button
          type="button"
          onClick={() => setVarsOpen((prev) => !prev)}
          aria-expanded={varsOpen}
          aria-haspopup="listbox"
          title="Inserir variável"
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/50"
        >
          <Variable className="h-3.5 w-3.5" strokeWidth={2} />
          <span>Variável</span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', varsOpen && 'rotate-180')} aria-hidden="true" />
        </button>
        {varsOpen && (
          <div
            role="listbox"
            className="absolute left-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-zinc-950/[0.1] bg-white py-1 shadow-lg dark:border-white/[0.12] dark:bg-[#1b1b1f]"
          >
            {VARIABLES.map((v) => (
              <button
                key={v.token}
                type="button"
                role="option"
                onClick={() => {
                  insertSnippet(v.token);
                  setVarsOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-zinc-950/[0.05] dark:hover:bg-white/[0.06]"
              >
                <span className="font-mono text-[10px] text-violet-700 dark:text-violet-300">{v.token}</span>
                <span className="text-zinc-500 dark:text-zinc-400">{v.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
