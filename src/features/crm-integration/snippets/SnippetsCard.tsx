import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useToast } from '@/src/components/common/Toast';
import { cn } from '@/src/lib/cn';
import { maskTokenMiddle } from '../tokenMask';
import type { Crm } from '@/src/lib/types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

const BODY_EXAMPLE = `{
  "name": "Maria Silva",
  "email": "maria@empresa.com",
  "phone": "(11) 91234-5678",
  "website": "https://site.com.br",
  "description": "Veio do site"
}`;

interface SnippetsCardProps {
  crm: Crm;
  enabled: boolean;
}

function CopyMiniButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copiado para a área de transferência');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
      aria-label={label}
      title={label}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" strokeWidth={2.5} />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copiar
        </>
      )}
    </button>
  );
}

function SnippetBlock({
  title,
  display,
  copyValue,
  copyLabel,
}: {
  title: string;
  display: string;
  copyValue: string;
  copyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 shadow-inner">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {title}
        </span>
        <CopyMiniButton text={copyValue} label={copyLabel} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-200">
        <code>{display}</code>
      </pre>
    </div>
  );
}

export function SnippetsCard({ crm, enabled }: SnippetsCardProps) {
  const endpoint = `${API_BASE}/public/crms/${crm.token}/leads`;
  const maskedToken = maskTokenMiddle(crm.token);
  const endpointDisplay = `POST ${API_BASE}/public/crms/${maskedToken}/leads`;
  const headers = '{\n  "Content-Type": "application/json"\n}';
  const curlCommand = `curl -X POST ${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Maria Silva","email":"maria@empresa.com","phone":"(11) 91234-5678"}'`;
  const curlDisplay = `curl -X POST ${API_BASE}/public/crms/${maskedToken}/leads \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Maria Silva","email":"maria@empresa.com","phone":"(11) 91234-5678"}'`;

  return (
    <section
      aria-labelledby="snippets-section-title"
      className="relative overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
    >
      <h2
        id="snippets-section-title"
        className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
      >
        Como integrar
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Endpoint público de captura — ligue seus formulários, landing pages ou parceiros neste CRM.
      </p>

      <div
        className={cn(
          'mt-4 space-y-3',
          !enabled && 'pointer-events-none select-none opacity-60 blur-[3px]',
        )}
        aria-hidden={!enabled}
      >
        <SnippetBlock
          title="Endpoint"
          display={endpointDisplay}
          copyValue={endpoint}
          copyLabel="Copiar endpoint"
        />
        <SnippetBlock
          title="Headers"
          display={headers}
          copyValue={headers}
          copyLabel="Copiar headers"
        />
        <SnippetBlock
          title="Body (JSON)"
          display={BODY_EXAMPLE}
          copyValue={BODY_EXAMPLE}
          copyLabel="Copiar exemplo de corpo"
        />
        <SnippetBlock
          title="cURL"
          display={curlDisplay}
          copyValue={curlCommand}
          copyLabel="Copiar exemplo cURL"
        />
      </div>

      {!enabled && (
        <div className="absolute inset-x-5 top-24 bottom-5 flex items-center justify-center">
          <div className="flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/95 px-5 py-4 text-center shadow-lg backdrop-blur-sm dark:border-amber-900/60 dark:bg-amber-950/80">
            <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <p className="text-[13px] font-medium leading-snug text-amber-900 dark:text-amber-200">
              Nenhuma etapa selecionada — os snippets ficam ativos quando você configurar a etapa de destino.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
