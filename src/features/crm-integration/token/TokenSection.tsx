import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
import { Check, Copy, Lock, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { useRegenerateCrmTokenMutation } from '@/src/features/crm/hooks';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { useCopyToClipboard } from '@/src/lib/useCopyToClipboard';
import { maskTokenMiddle } from '../tokenMask';
import type { Crm } from '@/src/lib/types';

interface TokenSectionProps {
  crm: Crm;
}

export function TokenSection({ crm }: TokenSectionProps) {
  const { toast } = useToast();
  const regenerateMutation = useRegenerateCrmTokenMutation();
  const flagKey = `crm-integration-token-regenerated:${crm.id}`;
  const { copied, copy } = useCopyToClipboard();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(
    () => sessionStorage.getItem(flagKey) === '1',
  );

  const copyToken = async () => {
    try {
      await copy(crm.token);
      toast.success('Token copiado');
    } catch {
      toast.error('Não foi possível copiar o token');
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync(crm.id);
      toast.success('Token regenerado — atualize suas integrações');
      try {
        sessionStorage.setItem(flagKey, '1');
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
      className="rounded-2xl border border-zinc-950/[0.07] bg-white p-4 shadow-sm sm:p-5 dark:border-white/[0.07] dark:bg-[#17171a]"
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
          <IconButton
            size="small"
            aria-label="Dispensar aviso"
            onClick={() => {
              setShowBanner(false);
              try {
                sessionStorage.removeItem(flagKey);
              } catch {
                /* ignore */
              }
            }}
          >
            <X className="h-4 w-4" />
          </IconButton>
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
        {/* Empilhados no celular: "Copiar" primeiro, que é o que se faz aqui no
            dia a dia, e "Regenerar" por último e afastado — ele invalida todas as
            integrações do cliente e não pode estar no caminho do polegar. */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <ActionButton
            type="button"
            onClick={() => void copyToken()}
            sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 40, sm: 'auto' }, flexShrink: 0 }}
            startIcon={
              copied ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.8} />
              )
            }
          >
            {copied ? 'Copiado' : 'Copiar'}
          </ActionButton>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setConfirmOpen(true)}
            startIcon={<RefreshCw className="h-4 w-4" strokeWidth={1.8} />}
            className="mt-2 sm:mt-0"
            sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 40, sm: 'auto' }, flexShrink: 0 }}
          >
            Regenerar
          </Button>
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
