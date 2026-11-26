/**
 * Helpers de data da agenda. O backend trafega UTC; cada consulta usa os
 * limites do dia local (`Intl` sem `timeZone`, que usa o timezone do navegador).
 */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function startOfWeek(value: Date): Date {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  // getDay(): 0 = domingo. Segunda é o primeiro dia da grade.
  const offset = date.getDay() === 0 ? -6 : 1 - date.getDay();
  date.setDate(date.getDate() + offset);
  return date;
}

export function addDays(value: Date, days: number): Date {
  const date = new Date(value.getTime());
  date.setDate(date.getDate() + days);
  return date;
}

/** `Y-m-d\TH:i:s+00:00`, formato aceito por `date_format:Y-m-d\TH:i:sP`. */
export function toIsoUtc(value: Date): string {
  return `${value.toISOString().slice(0, 19)}+00:00`;
}

export function weekRange(anchor: Date): { from: string; to: string } {
  const start = startOfWeek(anchor);
  return { from: toIsoUtc(start), to: toIsoUtc(addDays(start, 7)) };
}

/** Chave `YYYY-MM-DD` no timezone local, usada para agrupar a grade. */
export function localDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** ISO UTC -> valor de `<input type="datetime-local">` no timezone local. */
export function toLocalInput(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Valor local -> ISO UTC; vazio vira string vazia para a validação do zod. */
export function fromLocalInput(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toIsoUtc(date);
}

export function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
  return `${formatter.format(start)} – ${formatter.format(end)} ${end.getFullYear()}`;
}

export function formatDayHeading(date: Date): string {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
    .format(date)
    .replace('.', '');
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** Cabeçalho completo do dia selecionado, ex.: `quinta-feira, 26 de novembro de 2026`. */
export function formatFullDay(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return localDateKey(a) === localDateKey(b);
}
