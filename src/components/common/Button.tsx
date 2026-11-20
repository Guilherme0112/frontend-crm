import MuiButton from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';

/**
 * Botão padrão do app: azul (primary) e preenchido.
 * Ações secundárias (Cancelar, ícones, perigo) podem sobrescrever
 * `variant` e `color` explicitamente.
 */
function Button({ variant = 'contained', color = 'primary', ...props }: ButtonProps) {
  return <MuiButton variant={variant} color={color} {...props} />;
}

// Preserva a tipagem polimórfica do MUI (component={Link}, href, etc.).
export default Button as typeof MuiButton;
export type { ButtonProps };
