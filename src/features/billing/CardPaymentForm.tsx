import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useMercadoPagoSdk } from './useMercadoPagoSdk';

interface CardPaymentFormProps {
  publicKey: string | null | undefined;
  /** Valor da assinatura, exibido pelo formulário do Mercado Pago. */
  amount: number;
  payerEmail?: string;
  /**
   * Recebe só o token: dados do cartão nunca saem do iframe do gateway.
   * A promise devolvida mantém o loading do Brick até o backend responder.
   */
  onToken: (cardTokenId: string) => void | Promise<unknown>;
  /** Chamado quando o SDK não carrega — quem usa cai no redirect. */
  onUnavailable: () => void;
  disabled?: boolean;
}

/**
 * Formulário de cartão do Mercado Pago (Card Payment Brick).
 *
 * Os campos vivem dentro de um iframe do gateway: número, CVV e validade nunca
 * tocam o nosso JS nem o nosso backend. O que sai daqui é um token de uso
 * único.
 */
export function CardPaymentForm({
  publicKey,
  amount,
  payerEmail,
  onToken,
  onUnavailable,
  disabled,
}: CardPaymentFormProps) {
  const containerId = useId().replace(/:/g, '-');
  const { sdk, failed } = useMercadoPagoSdk(publicKey);
  const [brickError, setBrickError] = useState<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    if (failed) onUnavailableRef.current();
  }, [failed]);

  useEffect(() => {
    if (!sdk) return;

    let controller: { unmount: () => void } | null = null;
    let active = true;

    sdk
      .bricks()
      .create('cardPayment', containerId, {
        initialization: {
          amount,
          payer: payerEmail ? { email: payerEmail } : undefined,
        },
        customization: {
          // Assinatura é débito recorrente: parcelamento não se aplica.
          paymentMethods: { maxInstallments: 1 },
          visual: { style: { theme: 'default' } },
        },
        callbacks: {
          onReady: () => setBrickError(null),
          onSubmit: (formData: { token?: string }) => {
            // O Brick espera uma promise para encerrar o estado de carregamento:
            // devolvemos a da chamada ao backend, não uma já resolvida.
            if (!formData.token) return Promise.resolve();

            return Promise.resolve(onTokenRef.current(formData.token));
          },
          onError: () =>
            setBrickError('Não foi possível validar o cartão. Confira os dados e tente novamente.'),
        },
      })
      .then((instance) => {
        if (active) {
          controller = instance;
        } else {
          instance.unmount();
        }
      })
      .catch(() => {
        if (active) onUnavailableRef.current();
      });

    return () => {
      active = false;
      controller?.unmount();
    };
    // amount entra na dependência: mudou o plano, o Brick é remontado.
    // onUnavailable fica no ref para um callback inline não desmontar o Brick.
  }, [sdk, containerId, amount, payerEmail]);

  if (failed) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Não foi possível carregar o formulário de cartão. Você será redirecionado ao Mercado Pago
          para concluir o pagamento.
        </span>
      </div>
    );
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : undefined}>
      {!sdk && (
        <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Carregando formulário seguro...
        </p>
      )}

      <div id={containerId} />

      {brickError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{brickError}</span>
        </div>
      )}
    </div>
  );
}
