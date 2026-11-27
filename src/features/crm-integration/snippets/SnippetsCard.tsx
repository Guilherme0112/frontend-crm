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

/** Espelho das regras de `CreatePublicLeadRequest` (API pública de captura). */
const FIELD_RULES: Array<{ field: string; rule: string; required?: boolean }> = [
  { field: 'name', rule: 'Texto, até 255 caracteres', required: true },
  { field: 'email', rule: 'E-mail válido, até 255 caracteres', required: true },
  { field: 'phone', rule: 'Opcional — (11) 91234-5678 ou +55 (11) 91234-5678; o DDI 55 é aplicado se vier sem' },
  { field: 'website', rule: 'Opcional — texto, até 255 caracteres' },
  { field: 'description', rule: 'Opcional — texto livre' },
  { field: 'utm_source', rule: 'Opcional — até 255 caracteres' },
  { field: 'utm_medium', rule: 'Opcional — até 255 caracteres' },
  { field: 'utm_campaign', rule: 'Opcional — até 255 caracteres' },
  { field: 'utm_term', rule: 'Opcional — até 255 caracteres' },
  { field: 'utm_content', rule: 'Opcional — até 255 caracteres' },
  { field: 'utm_device', rule: 'Opcional — até 40 caracteres (ex: mobile, desktop, tablet)' },
  { field: 'referrer', rule: 'Opcional — até 512 caracteres' },
  { field: 'landing_page', rule: 'Opcional — até 512 caracteres' },
];

const FIELD_RULES_COPY = FIELD_RULES.map(
  ({ field, rule, required }) => `${field}${required ? '*' : ''} — ${rule}`,
).join('\n') + '\n\n* obrigatório';

const RESPONSES_EXAMPLE = `204 No Content        Lead capturado (resposta sem corpo)
422 Unprocessable     Campo inválido: { "message": "...", "errors": { "email": ["..."] } }
                      Também ocorre se o CRM não tiver etapa de destino configurada
429 Too Many Requests Limite de 30 envios por minuto excedido`;

const ATTRIBUTION_SNIPPET = (endpoint: string) => `// 0) Detecção do dispositivo (usada no envio, não no 1º acesso).
function detectarDispositivo() {
  var ua = navigator.userAgent || '';
  var uaDataMobile = navigator.userAgentData && navigator.userAgentData.mobile === true;

  // iPadOS (iOS 13+) se apresenta como Mac: o toque entrega que é tablet.
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'tablet';
  // Android tablet normalmente vem sem o token "Mobile".
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet';

  if (uaDataMobile || /Mobi|Android|iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return 'mobile';

  // Fallback para simulação/UA atípico (DevTools que só reduz a largura):
  // a largura já define o dispositivo — não exigir toque nem UA mobile.
  var largura = window.innerWidth || screen.width || 99999;
  if (largura <= 768) return 'mobile';
  if (largura <= 1024) return 'tablet';
  return 'desktop';
}

// 1) Em TODAS as páginas: guarda a origem assim que a pessoa chega.
// Sem isso o UTM se perde quando ela navega para outra página antes de converter.
(function () {
  var qs = new URLSearchParams(location.search);
  var attr = JSON.parse(sessionStorage.getItem('crm_attr') || '{}');

  // UTMs: a primeira visita é a que conta.
  if (qs.get('utm_source') && !attr.utm_source) {
    attr.utm_source = qs.get('utm_source');
    attr.utm_medium = qs.get('utm_medium');
    attr.utm_campaign = qs.get('utm_campaign');
    attr.utm_term = qs.get('utm_term');
    attr.utm_content = qs.get('utm_content');
    attr.referrer = document.referrer || null;
    attr.landing_page = location.href;
  }
  // Se o anúncio mandou ?utm_device=, ele tem prioridade sobre a detecção.
  if (qs.get('utm_device')) attr.utm_device_url = qs.get('utm_device');

  sessionStorage.setItem('crm_attr', JSON.stringify(attr));
})();

// 2) No envio do formulário: valida como a API e manda os dados + a origem.
// Campos do form: name* e email* (obrigatórios); phone, website e description (opcionais).
document.getElementById('lead-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  var form = new FormData(e.target);
  function valor(campo) {
    return (form.get(campo) || '').toString().trim();
  }

  var dados = {
    name: valor('name'),
    email: valor('email'),
    phone: valor('phone') || null,       // formato: (11) 91234-5678
    website: valor('website') || null,
    description: valor('description') || null
  };
  var attr = JSON.parse(sessionStorage.getItem('crm_attr') || '{}');
  // Calcula o device AGORA: nunca reaproveita o da 1ª visita (foi o que fez
  // o simulador de celular enviar "desktop"). O da URL tem prioridade.
  attr.utm_device = attr.utm_device_url || detectarDispositivo();
  delete attr.utm_device_url; // não deixa um device da URL vazar para o próximo envio
  sessionStorage.setItem('crm_attr', JSON.stringify(attr));

  // Validação espelho da API (evita 422 por campo inválido).
  var erros = [];
  if (!dados.name || dados.name.length > 255) erros.push('Nome obrigatório (máx. 255)');
  if (!dados.email || dados.email.length > 255 || !/^[^@\\s]+@[^@\\s]+$/.test(dados.email)) {
    erros.push('E-mail válido obrigatório (máx. 255)');
  }
  if (dados.phone && !/^\\(\\d{2}\\) \\d{4,5}-\\d{4}$/.test(dados.phone)) {
    erros.push('Telefone no formato (11) 91234-5678');
  }
  if (dados.website && dados.website.length > 255) erros.push('Website: máx. 255');
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (chave) {
    if (attr[chave] && String(attr[chave]).length > 255) erros.push(chave + ': máx. 255');
  });
  if (attr.utm_device && String(attr.utm_device).length > 40) erros.push('utm_device: máx. 40');
  if (attr.referrer && String(attr.referrer).length > 512) erros.push('referrer: máx. 512');
  if (attr.landing_page && String(attr.landing_page).length > 512) erros.push('landing_page: máx. 512');
  if (erros.length) {
    alert(erros.join('\\n'));
    return;
  }

  var res = await fetch('${endpoint}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign(dados, attr))
  });

  if (res.status === 204) {
    // sucesso: a API não devolve corpo, apenas 204 No Content
    // redirecione para a página de obrigado
  } else if (res.status === 422) {
    var body = await res.json();
    console.error(body.message, body.errors); // erros por campo
  } else if (res.status === 429) {
    // muitas tentativas: limite de 30 envios por minuto
  }
});`;

const FORM_HTML_EXAMPLE = `<form id="lead-form">
  <input name="name" required maxlength="255" placeholder="Nome">
  <input name="email" type="email" required maxlength="255" placeholder="E-mail">
  <input name="phone" pattern="\\(\\d{2}\\) \\d{4,5}-\\d{4}" placeholder="(11) 91234-5678">
  <input name="website" maxlength="255" placeholder="https://site.com.br">
  <textarea name="description" placeholder="Mensagem"></textarea>
  <button type="submit">Enviar</button>
</form>`;

const DEBUG_DEVICE_EXAMPLE = `// Cole no console depois de colar o script acima:
console.log({
  ua: navigator.userAgent,
  uaDataMobile: navigator.userAgentData && navigator.userAgentData.mobile,
  innerWidth: window.innerWidth,
  touchPoints: navigator.maxTouchPoints,
  detectado: detectarDispositivo(),
  salvoNoStorage: JSON.parse(sessionStorage.getItem('crm_attr') || '{}')
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
  const curlBody =
    '{"name":"Maria Silva","email":"maria@empresa.com","phone":"(11) 91234-5678",' +
    '"website":"https://site.com.br","description":"Veio do site",' +
    '"utm_source":"instagram","utm_device":"mobile"}';
  const curlCommand = `curl -i -X POST ${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '${curlBody}'`;
  const curlDisplay = `curl -i -X POST ${endpointDisplayUrl} \\\n  -H "Content-Type: application/json" \\\n  -d '${curlBody}'`;

  return (
    <section
      aria-labelledby="snippets-section-title"
      className="relative overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white p-4 shadow-sm sm:p-5 dark:border-white/[0.07] dark:bg-[#17171a]"
    >
      <h2
        id="snippets-section-title"
        className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
      >
        Como integrar
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Endpoint público de captura — ligue seus formulários, landing pages ou parceiros neste CRM.
        Envie <code className="font-mono text-[11px]">name</code> e{' '}
        <code className="font-mono text-[11px]">email</code> (obrigatórios), os demais campos
        abaixo são opcionais. Inclua a origem para saber de onde cada lead veio.
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
        <div className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950 shadow-inner">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Campos e validação (o que a API aceita)
            </span>
            <CopyMiniButton text={FIELD_RULES_COPY} label="Copiar regras dos campos" />
          </div>
          <ul className="divide-y divide-white/[0.06] px-4 font-mono text-[11px] leading-relaxed">
            {FIELD_RULES.map(({ field, rule, required }) => (
              <li key={field} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3">
                <code className="w-40 shrink-0 text-zinc-100">
                  {field}
                  {required && <span className="ml-1 text-amber-400">*</span>}
                </code>
                <span className="text-zinc-400">{rule}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-zinc-500">
            * obrigatório. Campos fora desta lista são ignorados pela API.
          </p>
        </div>
        <SnippetBlock
          title="cURL"
          display={curlDisplay}
          copyValue={curlCommand}
          copyLabel="Copiar exemplo cURL"
        />
        <SnippetBlock
          title="Respostas"
          display={RESPONSES_EXAMPLE}
          copyValue={RESPONSES_EXAMPLE}
          copyLabel="Copiar respostas da API"
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
              <span className="font-semibold">3. O dispositivo é calculado no envio.</span> O{' '}
              <code className="font-mono text-[11px]">utm_device</code> (
              <span className="font-mono text-[11px]">mobile</span> /{' '}
              <span className="font-mono text-[11px]">desktop</span> /{' '}
              <span className="font-mono text-[11px]">tablet</span>) é detectado pelo navegador na
              hora do submit — não fica preso ao dispositivo da primeira visita (isso fazia celular
              enviar <span className="font-mono text-[11px]">desktop</span>). iPadOS e tablets
              Android também são tratados. Se a plataforma de anúncios mandar o device na URL — o
              Google Ads faz isso com{' '}
              <code className="font-mono text-[11px]">{'{device}'}</code> — esse valor tem
              prioridade. Se o teste ainda mostrar{' '}
              <span className="font-mono text-[11px]">desktop</span>, confira a URL (pode estar com{' '}
              <code className="font-mono text-[11px]">?utm_device=desktop</code>) e rode o bloco de
              diagnóstico abaixo.
            </li>
            <li>
              <span className="font-semibold">4. Valide antes de enviar.</span> O script abaixo
              espelha a API: exige <code className="font-mono text-[11px]">name</code> e{' '}
              <code className="font-mono text-[11px]">email</code>, aceita{' '}
              <code className="font-mono text-[11px]">phone</code> como{' '}
              <span className="font-mono text-[11px]">(11) 91234-5678</span> ou{' '}
              <span className="font-mono text-[11px]">+55 (11) 91234-5678</span> (DDD com 4 ou 5
              dígitos; sem DDI, o 55 é aplicado ao salvar) e aplica os limites de tamanho da
              tabela acima. Sucesso é{' '}
              <span className="font-mono text-[11px]">204</span>, sem corpo na resposta;{' '}
              <span className="font-mono text-[11px]">422</span> indica campo inválido e{' '}
              <span className="font-mono text-[11px]">429</span>, limite de 30 envios/minuto.
            </li>
          </ol>
        </div>

        <SnippetBlock
          title="Formulário (HTML)"
          display={FORM_HTML_EXAMPLE}
          copyValue={FORM_HTML_EXAMPLE}
          copyLabel="Copiar formulário HTML"
          code
        />
        <SnippetBlock
          title="Envio com captura de origem e validação (JS)"
          display={ATTRIBUTION_SNIPPET(endpointDisplayUrl)}
          copyValue={ATTRIBUTION_SNIPPET(endpoint)}
          copyLabel="Copiar script de captura com UTM"
          code
        />
        <SnippetBlock
          title="Diagnosticar dispositivo (console)"
          display={DEBUG_DEVICE_EXAMPLE}
          copyValue={DEBUG_DEVICE_EXAMPLE}
          copyLabel="Copiar diagnóstico de dispositivo"
          code
        />
      </div>

      {!enabled && (
        <div className="absolute inset-x-4 top-24 bottom-4 flex items-center justify-center sm:inset-x-5 sm:bottom-5">
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
