import { useEffect, useState } from 'react';

const SDK_URL = 'https://sdk.mercadopago.com/js/v2';

type MercadoPagoCtor = new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;

export interface MercadoPagoInstance {
  bricks: () => {
    create: (
      brick: 'cardPayment',
      containerId: string,
      settings: Record<string, unknown>,
    ) => Promise<{ unmount: () => void }>;
  };
}

declare global {
  interface Window {
    MercadoPago?: MercadoPagoCtor;
  }
}

/** Promise única por página: o script não pode ser injetado duas vezes. */
let loader: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();

  loader ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);

    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('SDK do Mercado Pago não carregou')));
      return;
    }

    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Deixa tentar de novo numa próxima montagem em vez de travar a página
      // para sempre com uma promise rejeitada em cache.
      loader = null;
      reject(new Error('SDK do Mercado Pago não carregou'));
    };
    document.head.appendChild(script);
  });

  return loader;
}

/**
 * Carrega o SDK do Mercado Pago sob demanda.
 *
 * Falhar aqui não pode impedir o cliente de pagar: quem chama cai no Checkout
 * Pro por redirect quando `failed` é true.
 */
export function useMercadoPagoSdk(publicKey: string | null | undefined) {
  const [sdk, setSdk] = useState<MercadoPagoInstance | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!publicKey) return;

    let active = true;

    loadSdk()
      .then(() => {
        if (!active || !window.MercadoPago) return;
        setSdk(new window.MercadoPago(publicKey, { locale: 'pt-BR' }));
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [publicKey]);

  return { sdk, failed, ready: sdk !== null };
}
