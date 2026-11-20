/**
 * Copia texto usando a Clipboard API quando disponível e cai para um
 * textarea oculto em origens inseguras (onde `navigator.clipboard` é undefined).
 */
export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    if (!document.execCommand('copy')) {
      throw new Error('Não foi possível copiar o texto');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
