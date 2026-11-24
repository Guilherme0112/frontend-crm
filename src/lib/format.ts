/** `+55 (11) 98765-4321` — o DDI é obrigatório. */
export const PHONE_REGEX = /^\+\d{2} \(\d{2}\) \d{4,5}-\d{4}$/;
export const ZIP_REGEX = /^\d{5}-?\d{3}$/;
export const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function formatCurrency(value: number, currency = 'BRL'): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(Number(value) || 0);
  } catch {
    return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',')}`;
  }
}

/**
 * O backend trafega dinheiro em centavos inteiros (`value_cents`,
 * `leads_value_total_cents`) justamente para não ter float no fio. A conversão
 * para reais acontece só aqui, na borda de apresentação.
 */
export function formatCents(cents: number | null | undefined, currency = 'BRL'): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return '—';
  return formatCurrency(cents / 100, currency);
}

/**
 * Máscara de digitação de valor: trabalha só com os dígitos e reconstrói o
 * formato do zero, então é idempotente ao ser reaplicada sobre o próprio
 * resultado no `onChange` — mesma regra do `maskPhone`.
 */
export function maskCurrency(value: string): string {
  const digits = onlyDigits(value).slice(0, 13);
  if (!digits) return '';
  return (Number(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte o texto mascarado de volta para centavos. Vazio vira `null`, não `0`. */
export function currencyToCents(value: string): number | null {
  const digits = onlyDigits(value);
  return digits ? Number(digits) : null;
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds)) {
    return '—';
  }
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = parseApiDate(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

// Normaliza strings "YYYY-MM-DD HH:MM:SS" vindas do banco para ISO "YYYY-MM-DDTHH:MM:SS".
function parseApiDate(value: string): Date {
  return new Date(value.includes('T') ? value : value.replace(' ', 'T'));
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = parseApiDate(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** `+55 (11) 98765-4321` tem 19 caracteres — é o maxLength dos inputs de telefone. */
export const PHONE_MAX_LENGTH = 19;

/**
 * Formata para `+55 (11) 98765-4321`.
 *
 * **O DDI é digitado manualmente**: nada é injetado. Os 2 primeiros dígitos são
 * sempre o DDI, os 2 seguintes o DDD e o resto o número — 13 dígitos ao todo
 * (12 para fixo). Quem esquecer o DDI não passa no `PHONE_REGEX` e vê o erro,
 * em vez de ter um 55 posto por conta própria.
 *
 * Trabalha só com os dígitos e reconstrói o formato do zero, então reaplicar a
 * máscara sobre o próprio resultado é estável — é isso que a torna segura no
 * `onChange`, onde ela recebe de volta o valor que acabou de emitir.
 */
export function maskPhone(value: string): string {
  let digits = onlyDigits(value);
  // Prefixo de discagem internacional (00 55 11 ...).
  if (digits.startsWith('00')) digits = digits.slice(2);
  // 2 (DDI) + 2 (DDD) + 9 (número) = 13.
  digits = digits.slice(0, 13);
  if (digits.length === 0) return '';

  const ddi = digits.slice(0, 2);
  if (digits.length <= 2) return `+${ddi}`;

  const rest = digits.slice(2);
  const prefix = `+${ddi} `;
  if (rest.length <= 2) return `${prefix}(${rest}`;
  if (rest.length <= 6) return `${prefix}(${rest.slice(0, 2)}) ${rest.slice(2)}`;
  if (rest.length <= 10) {
    return `${prefix}(${rest.slice(0, 2)}) ${rest.slice(2, 6)}-${rest.slice(6)}`;
  }
  return `${prefix}(${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7, 11)}`;
}

export function normalizeWhatsappPhone(value: string): string {
  let digits = onlyDigits(value);
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return '55' + digits;
  return digits;
}

export function maskZipCode(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function maskCpfCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  // CNPJ: 00.000.000/0000-00
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function isValidCpfOrCnpjDigits(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 11 || digits.length === 14;
}

export function getInitials(name?: string | null): string {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
