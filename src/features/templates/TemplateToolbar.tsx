import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
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


  return (
    <div
      role="toolbar"
      aria-label="Formatação do email"
      className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-zinc-950/[0.12] bg-zinc-50 px-2 py-1.5 dark:border-white/[0.12] dark:bg-white/[0.04]"
    >
      <IconButton size="small" title="Negrito" aria-label="Negrito" onClick={() => applyWrap('<strong>', '</strong>', 'texto em negrito')}>
        <Bold className="h-4 w-4" strokeWidth={2.2} />
      </IconButton>
      <IconButton size="small" title="Itálico" aria-label="Itálico" onClick={() => applyWrap('<em>', '</em>', 'texto em itálico')}>
        <Italic className="h-4 w-4" strokeWidth={2} />
      </IconButton>
      <IconButton size="small" title="Sublinhado" aria-label="Sublinhado" onClick={() => applyWrap('<u>', '</u>', 'texto sublinhado')}>
        <Underline className="h-4 w-4" strokeWidth={2} />
      </IconButton>
      <IconButton size="small"
        title="Título"
        aria-label="Título"
        onClick={() => applyWrap('<h2 style="margin:16px 0 8px;font-size:18px;line-height:1.3;color:#18181b">', '</h2>', 'Título do email')}
      >
        <Heading2 className="h-4 w-4" strokeWidth={2} />
      </IconButton>
      <IconButton size="small"
        title="Lista com marcadores"
        aria-label="Lista com marcadores"
        onClick={() => applyWrap('<ul style="margin:8px 0;padding-left:22px">\n  <li>', '</li>\n</ul>', 'item da lista')}
      >
        <List className="h-4 w-4" strokeWidth={2} />
      </IconButton>
      <IconButton size="small"
        title="Lista numerada"
        aria-label="Lista numerada"
        onClick={() => applyWrap('<ol style="margin:8px 0;padding-left:22px">\n  <li>', '</li>\n</ol>', 'item da lista')}
      >
        <ListOrdered className="h-4 w-4" strokeWidth={2} />
      </IconButton>
      <IconButton size="small" title="Inserir link" aria-label="Inserir link" onClick={insertLink}>
        <Link2 className="h-4 w-4" strokeWidth={2} />
      </IconButton>

      <span className="mx-1 h-5 w-px bg-zinc-950/[0.12] dark:bg-white/[0.12]" aria-hidden="true" />

      {/* Inserir variável */}
      <div ref={varsRef} className="relative">
        <ActionButton
          type="button"
          size="small"
          onClick={() => setVarsOpen((prev) => !prev)}
          aria-expanded={varsOpen}
          aria-haspopup="listbox"
          title="Inserir variável"
          startIcon={<Variable className="h-3.5 w-3.5" strokeWidth={2} />}
          endIcon={
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', varsOpen && 'rotate-180')}
              aria-hidden="true"
            />
          }
        >
          Variável
        </ActionButton>
        {varsOpen && (
          <div
            role="listbox"
            className="absolute left-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-zinc-950/[0.1] bg-white py-1 shadow-lg dark:border-white/[0.12] dark:bg-[#1b1b1f]"
          >
            {VARIABLES.map((v) => (
              <Button variant="contained" color="inherit" key={v.token} role="option" onClick={() => { insertSnippet(v.token); setVarsOpen(false); }} className="w-full">
                <span className="font-mono text-[10px] text-violet-700 dark:text-violet-300">{v.token}</span>
                <span className="text-zinc-500 dark:text-zinc-400">{v.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
