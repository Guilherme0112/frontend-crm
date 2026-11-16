import { useState } from 'react';
import { Banknote, Check, Copy, ExternalLink, QrCode } from 'lucide-react';
import { useToast } from '@/src/components/common/Toast';
import { formatDateTime } from '@/src/lib/format';
import type { BillingMethod } from '@/src/lib/types';

export interface ChargeData {
  billing_method: BillingMethod;
  qr_code?: string | null;
  qr_code_base64?: string | null;
  ticket_url?: string | null;
  barcode?: string | null;
  charge_expires_at?: string | null;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copiado para a área de transferência');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <div className="mt-1.5 flex items-stretch gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-zinc-950/[0.08] bg-zinc-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
          {value}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-950/[0.12] bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Cobrança de pix ou boleto pronta para o cliente pagar.
 *
 * Diferente do cartão, aqui não há débito automático: enquanto esta cobrança
 * não for paga a assinatura não ativa, e todo mês uma nova é emitida.
 */
export function ChargeDetails({ charge }: { charge: ChargeData }) {
  const isPix = charge.billing_method === 'pix';

  return (
    <div className="space-y-4 rounded-xl border border-zinc-950/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="flex items-center gap-2">
        {isPix ? (
          <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.8} />
        ) : (
          <Banknote className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.8} />
        )}
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {isPix ? 'Pague com Pix' : 'Boleto bancário'}
        </h3>
      </div>

      {isPix && charge.qr_code_base64 && (
        <div className="flex justify-center rounded-xl border border-zinc-950/[0.07] bg-white p-4 dark:border-white/[0.07]">
          <img
            // O fundo branco é obrigatório: leitor de QR precisa de contraste,
            // e no tema escuro o código ficaria ilegível sobre a superfície.
            src={`data:image/png;base64,${charge.qr_code_base64}`}
            alt="QR Code do Pix"
            className="h-52 w-52"
          />
        </div>
      )}

      {isPix && charge.qr_code && <CopyField label="Pix copia e cola" value={charge.qr_code} />}

      {!isPix && charge.barcode && (
        <CopyField label="Linha digitável" value={charge.barcode} />
      )}

      {charge.ticket_url && (
        <a
          href={charge.ticket_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {isPix ? 'Abrir cobrança no Mercado Pago' : 'Abrir boleto para impressão'}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {charge.charge_expires_at && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Válido até{' '}
          <span className="font-mono tabular-nums">
            {formatDateTime(charge.charge_expires_at)}
          </span>
          . Depois disso é preciso gerar uma nova cobrança.
        </p>
      )}

      <p className="border-t border-zinc-950/[0.07] pt-3 text-xs text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
        A confirmação do pagamento{' '}
        {isPix ? 'costuma levar alguns segundos' : 'leva até 3 dias úteis'}. A assinatura é
        ativada automaticamente quando o Mercado Pago confirmar.
      </p>
    </div>
  );
}
