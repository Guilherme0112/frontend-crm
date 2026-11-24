import MuiButton from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import { cn } from '../../lib/cn';

/**
 * Botão padrão do app: ação principal com o gradiente SaldUp.
 * Ações secundárias (Cancelar, ícones, perigo) podem sobrescrever
 * `variant` e `color` explicitamente — nesses casos o gradiente não é aplicado.
 */
function Button({ variant = 'contained', color = 'primary', className, ...props }: ButtonProps) {
  const isPrimary = variant === 'contained' && (color ?? 'primary') === 'primary';

  return (
    <MuiButton
      variant={variant}
      color={color}
      className={cn(isPrimary && 'btn-saldup', className)}
      {...props}
    />
  );
}

// Preserva a tipagem polimórfica do MUI (component={Link}, href, etc.).
export default Button as typeof MuiButton;
export type { ButtonProps };
