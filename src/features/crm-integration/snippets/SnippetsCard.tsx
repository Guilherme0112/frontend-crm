import { Check, Copy, Megaphone, TriangleAlert } from 'lucide-react';
import { useToast } from '@/src/components/common/Toast';
import ActionButton from '@/src/components/common/Button';
import { cn } from '@/src/lib/cn';
import { useCopyToClipboard } from '@/src/lib/useCopyToClipboard';
import { maskTokenMiddle } from '../tokenMask';
import type { Crm } from '@/src/lib/types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

const BODY_EXAMPLE = `{
  "name": "Maria Silva",
  "email": "maria@empresa.com",
  "phone": "(11) 91234-5678",
  "website": "https://site.com.br",
  "description": "Veio do site",

  "utm_source": "instagram",
  "utm_medium": "cpc",
  "utm_campaign": "promo-novembro",
  "utm_term": null,
  "utm_content": null,
  "utm_device": "mobile",
  "referrer": "https://l.instagram.com/",
  "landing_page": "https://site.com.br/precos"
}`;

const ATTRIBUTION_SNIPPET = (endpoint: string) => `// 1) Em TODAS as páginas: guarda a origem assim que a pessoa chega.
// Sem isso o UTM se perde quando ela navega para outra página antes de converter.
(function () {
  var qs = new URLSearchParams(location.search);
  if (qs.get('utm_source') && !sessionStorage.getItem('crm_attr')) {
    sessionStorage.setItem('crm_attr', JSON.stringify({
      utm_source: qs.get('utm_source'),
      utm_medium: qs.get('utm_medium'),
      utm_campaign: qs.get('utm_campaign'),
      utm_term: qs.get('utm_term'),
      utm_content: qs.get('utm_content'),
      // vem do anúncio se você mandar ?utm_device=, senão detecta pelo navegador
      utm_device: qs.get('utm_device') || detectarDispositivo(),
      referrer: document.referrer || null,
      landing_page: location.href
    }));
  }

  function detectarDispositivo() {
    var ua = navigator.userAgent;
    if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
    if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return 'mobile';
    return 'desktop';
  }
})();

// 2) No envio do formulário: manda os dados + a origem guardada.
document.getElementById('lead-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  var form = new FormData(e.target);
  var attr = JSON.parse(sessionStorage.getItem('crm_attr') || '{}');

  var res = await fetch('${endpoint}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone') || null  // formato (11) 91234-5678
    }, attr))
  });

  if (res.ok) {
    // sucesso: redirecione para a página de obrigado
  } else if (res.status === 422) {
    // dados inválidos (e-mail ou formato do telefone)
  } else if (res.status === 429) {
    // muitas tentativas: limite de 30 envios por minuto
  }
});`;

const AD_LINK_EXAMPLE = `https://seusite.com.br/?utm_source=instagram&utm_medium=cpc&utm_campaign=promo-novembro`;

interface SnippetsCardProps {
  crm: Crm;
  enabled: boolean;
}

function CopyMiniButton({ text, label }: { text: string; label: string }) {
  const { copied, copy } = useCopyToClipboard();
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await copy(text);
      toast.success('Copiado para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <ActionButton
      type="button"
      size="small"
      onClick={() => void handleCopy()}
      aria-label={label}
      title={label}
      startIcon={
        copied ? (
          <Check className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <Copy className="h-3 w-3" />
        )
      }
    >
      {copied ? 'Copiado' : 'Copiar'}
    </ActionButton>
  );
}

function SnippetBlock({
  title,
  display,
  copyValue,
  copyLabel,
  code = false,
}: {
  title: string;
  display: string;
  copyValue: string;
  copyLabel: string;
  /** Código de verdade: rola na horizontal em vez de quebrar no meio das palavras. */
  code?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 shadow-inner">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {title}
        </span>
        <CopyMiniButton text={copyValue} label={copyLabel} />
      </div>
      <pre
        className={cn(
          'overflow-x-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-200',
          code ? 'whitespace-pre' : 'whitespace-pre-wrap break-all',
        )}
      >
        <code>{display}</code>
      </pre>
    </div>
  );
}

export function SnippetsCard({ crm, enabled }: SnippetsCardProps) {
  const endpoint = `${API_BASE}/public/crms/${crm.token}/leads`;
  const maskedToken = maskTokenMiddle(crm.token);
  const endpointDisplayUrl = `${API_BASE}/public/crms/${maskedToken}/leads`;
  const endpointDisplay = `POST ${endpointDisplayUrl}`;
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
        Envie os campos de origem junto para saber de onde cada lead veio.
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

        {/* Atribuição — explica por que e como mandar os UTMs */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
          <div className="flex items-start gap-2.5">
            <Megaphone
              className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-blue-900 dark:text-blue-200">
                Mande a origem junto — senão o lead chega sem saber de onde veio
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-blue-900/80 dark:text-blue-200/80">
                O CRM não descobre a origem sozinho: ele só registra o que o seu formulário
                enviar. Quem chega sem <code className="font-mono text-[11px]">utm_source</code>{' '}
                entra no relatório de Fontes de leads como{' '}
                <span className="font-mono text-[11px]">(sem origem)</span>.
              </p>
            </div>
          </div>

          <ol className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-blue-900/90 dark:text-blue-200/90">
            <li>
              <span className="font-semibold">1. Carimbe seus links de divulgação.</span> Use um
              link diferente por canal — é o que permite separar Instagram de Google depois:
              <code className="mt-1 block overflow-x-auto rounded-lg bg-blue-950/90 px-3 py-2 font-mono text-[11px] text-blue-100 dark:bg-black/40">
                {AD_LINK_EXAMPLE}
              </code>
            </li>
            <li>
              <span className="font-semibold">2. Guarde a origem na chegada.</span> Se a pessoa
              entra pelo anúncio e navega até a página de contato antes de preencher, o UTM some
              da URL. Por isso o código abaixo salva no{' '}
              <code className="font-mono text-[11px]">sessionStorage</code> no primeiro acesso e
              só usa na hora do envio.
            </li>
            <li>
              <span className="font-semibold">3. O dispositivo vem de graça.</span> O{' '}
              <code className="font-mono text-[11px]">utm_device</code> (
              <span className="font-mono text-[11px]">mobile</span> /{' '}
              <span className="font-mono text-[11px]">desktop</span> /{' '}
              <span className="font-mono text-[11px]">tablet</span>) é detectado pelo próprio
              navegador no script abaixo. Se a sua plataforma de anúncios já manda o device na
              URL — o Google Ads faz isso com{' '}
              <code className="font-mono text-[11px]">{'{device}'}</code> — o valor da URL tem
              prioridade.
            </li>
          </ol>
        </div>

        <SnippetBlock
          title="Formulário com captura de origem (HTML/JS)"
          display={ATTRIBUTION_SNIPPET(endpointDisplayUrl)}
          copyValue={ATTRIBUTION_SNIPPET(endpoint)}
          copyLabel="Copiar script de captura com UTM"
          code
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
