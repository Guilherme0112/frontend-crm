export const DEFAULT_SAMPLE_VARS: Record<string, string> = {
  name: 'Mariana Costa',
  nome: 'Mariana Costa',
  email: 'mariana@empresa.com.br',
  company: 'Acme Brasil',
  empresa: 'Acme Brasil',
  phone: '(11) 98765-4321',
  telefone: '(11) 98765-4321',
  website: 'https://empresa.com.br',
  site: 'https://empresa.com.br',
};

/** Todas as variáveis conhecidas, usadas só para a barra de inserção rápida. */
export const QUICK_VARS = [
  { token: 'name', label: 'Nome' },
  { token: 'email', label: 'Email' },
  { token: 'company', label: 'Empresa' },
  { token: 'phone', label: 'Telefone' },
  { token: 'website', label: 'Site' },
];

export function extractPlaceholders(body: string): string[] {
  const matches = body.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
  const seen = new Set<string>();
  for (const m of matches) {
    seen.add(m[1]);
  }
  return Array.from(seen);
}

export function renderTemplatePreview(
  body: string,
  sampleMap: Record<string, string>,
): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const val = sampleMap[key] ?? DEFAULT_SAMPLE_VARS[key.toLowerCase()];
    return val || `[${key}]`;
  });
}

/** Divide o texto em parágrafos (linhas em branco separam). */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
