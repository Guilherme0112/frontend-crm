/**
 * Mascara apenas os 12 caracteres centrais do token público.
 * display = head + 12 bolinhas + tail; o valor completo só vai para a área de transferência.
 */
export function maskTokenMiddle(token: string): string {
  const MASK = '••••••••••••'; // 12 chars
  if (token.length <= MASK.length + 2) return token;
  const head = Math.floor((token.length - MASK.length) / 2);
  return token.slice(0, head) + MASK + token.slice(head + MASK.length);
}
