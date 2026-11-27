import type { UserRole } from '@/src/lib/types';

/**
 * Espelho de `permission:reports` do backend (`Core\Domain\Company\Permission`).
 *
 * Existe só para a tela **não oferecer** o que o servidor vai recusar: um botão
 * "Dashboard" que devolve 403 é pior que botão nenhum. A autorização de verdade
 * continua sendo a do backend — esconder no front não protege nada, e por isso
 * nenhuma rota depende só disto.
 */
export function canViewReports(role: UserRole | undefined): boolean {
  return role === 'owner' || role === 'admin';
}
