import IconButton from '@mui/material/IconButton';
import type { IconButtonProps } from '@mui/material/IconButton';
import { alpha, type Theme } from '@mui/material/styles';

type Tone = 'primary' | 'error' | 'neutral';

interface TableActionButtonProps extends Omit<IconButtonProps, 'sx'> {
  tone?: Tone;
}

function toneStyles(theme: Theme, tone: Tone) {
  if (tone === 'primary') {
    return {
      color: theme.palette.primary.main,
      bgcolor: alpha(theme.palette.primary.main, 0.09),
      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.17) },
    };
  }

  if (tone === 'error') {
    return {
      color: theme.palette.error.main,
      bgcolor: alpha(theme.palette.error.main, 0.09),
      '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.17) },
    };
  }

  return {
    color: theme.palette.text.secondary,
    bgcolor: alpha(theme.palette.text.primary, 0.05),
    '&:hover': {
      color: theme.palette.text.primary,
      bgcolor: alpha(theme.palette.text.primary, 0.1),
    },
  };
}

/** Botão de ícone para ações em linhas de tabela/listas. */
export function TableActionButton({ tone = 'neutral', ...props }: TableActionButtonProps) {
  return (
    <IconButton
      size="small"
      {...props}
      sx={(theme) => ({ borderRadius: 1, ...toneStyles(theme, tone) })}
    />
  );
}

export default TableActionButton;
