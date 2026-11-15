import { useState } from 'react';
import { Check, Copy, Lock, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { useRegenerateCrmTokenMutation } from '@/src/features/crm/hooks';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { maskTokenMiddle } from '../tokenMask';
import type { Crm } from '@/src/lib/types';

const REGENERATED_FLAG = 'crm-integration-token-regenerated';

interface TokenSectionProps {
  crm: Crm;
}

export function TokenSection({ crm }: TokenSectionProps) {
  const { toast } = useToast();
  const regenerateMutation = useRegenerateCrmTokenMutation();
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(
    () => sessionStorage.getItem(REGENERATED_FLAG) === '1',
  );

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(crm.token);
      setCopied(true);
      toast.success('Token copiado');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o token');
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync(crm.id);
      toast.success('Token regenerado — atualize suas integrações');
      try {
        sessionStorage.setItem(REGENERATED_FLAG, '1');
      } catch {
        // sessionStorage indisponível — banner fica só em memória
      }
      setShowBanner(true);
      setConfirmOpen(false);
    } catch (error) {
      toast.error('Erro ao regenerar token', getApiErrorMessage(error));
    }
  };

  return (
    <section
      aria-labelledby="token-section-title"
      className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950/[0.04] text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400">
          <Lock className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h2
            id="token-section-title"
            className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            Token da integração
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Seu token público (somente escrita). Leads chegam pelo endpoint — nenhum dado é lido.
          </p>
        </div>
      </div>

      {showBanner && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            Token regenerado. Integrações que usam o antigo vão falhar com erro 404 até serem atualizadas.
          </span>
          <button
            type="button"
            onClick={() => {
              setShowBanner(false);
              try {
                sessionStorage.removeItem(REGENERATED_FLAG);
              } catch {
                // ignore
              }
            }}
            className="rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
            aria-label="Dispensar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <code
          className="min-w-0 flex-1 select-all truncate rounded-xl border border-zinc-950/[0.1] bg-zinc-50 px-3.5 py-2.5 font-mono text-xs tracking-wide text-zinc-600 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300"
          title="Token mascarado — use Copiar para obter o valor completo"
          aria-label="Token público (mascarado)"
        >
          {maskTokenMiddle(crm.token)}
        </code>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void copyToken()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-950/[0.1] bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" strokeWidth={1.8} />
                Copiar
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
            Regenerar
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleRegenerate()}
        isPending={regenerateMutation.isPending}
        variant="danger"
        title="Regenerar token?"
        description="O token atual é usado pelas suas integrações (landing pages, scraping de formulários, parceiros). Se você regenerar, qualquer chamada à API pública vai parar de funcionar até a integração ser atualizada."
        confirmLabel="Regenerar"
      />
    </section>
  );
}
