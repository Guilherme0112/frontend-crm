import { useMemo } from 'react';

interface EmailPreviewProps {
  /** Corpo do template já com as variáveis substituídas (pode conter HTML). */
  html: string;
  height?: number;
  title?: string;
}

const FULL_DOCUMENT_PATTERN = /<!doctype|<html[\s>]/i;

/**
 * Envolve o corpo num documento HTML mínimo de email (usado quando o
 * template é um fragmento). `white-space: pre-wrap` preserva quebras de
 * linha de templates em texto puro. Templates que já são um documento
 * completo (<!DOCTYPE ...>) são usados como estão.
 */
export function buildEmailDocument(body: string): string {
  if (FULL_DOCUMENT_PATTERN.test(body)) {
    return body;
  }

  return (
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"></head>' +
    '<body style="margin:0;padding:14px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;' +
    'font-size:14px;line-height:1.6;color:#18181b;white-space:pre-wrap;word-wrap:break-word;">' +
    body +
    '</body></html>'
  );
}

/**
 * Renderiza a pré-visualização do email num iframe com sandbox (sem scripts).
 */
export function EmailPreview({ html, height = 260, title = 'Pré-visualização do email' }: EmailPreviewProps) {
  const sourceDoc = useMemo(() => buildEmailDocument(html), [html]);

  return (
    <iframe
      sandbox=""
      title={title}
      className="w-full rounded-lg border border-zinc-950/[0.08] bg-white shadow-sm dark:border-white/[0.1]"
      style={{ height }}
      srcDoc={sourceDoc}
    />
  );
}
