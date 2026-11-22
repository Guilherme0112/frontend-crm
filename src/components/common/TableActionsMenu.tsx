import { useState, type MouseEvent, type ReactNode } from 'react';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { alpha } from '@mui/material/styles';
import { MoreVertical } from 'lucide-react';

export interface TableMenuAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

interface TableActionsMenuProps {
  actions: TableMenuAction[];
  label?: string;
}

/** Menu de ações (três pontinhos) usado nas linhas de tabelas e listas. */
export function TableActionsMenu({ actions, label = 'Ações' }: TableActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        onClick={openMenu}
        sx={{
          color: 'text.secondary',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          '&:hover': {
            color: 'primary.main',
            borderColor: 'primary.main',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          },
        }}
      >
        <MoreVertical className="h-4 w-4" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
              mt: 0.5,
              borderRadius: 1.5,
              boxShadow: 'var(--shadow-pop)',
            },
          },
        }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.label}
            disabled={action.disabled}
            sx={action.tone === 'danger' ? { color: 'error.main' } : undefined}
            onClick={(event) => {
              event.stopPropagation();
              closeMenu();
              action.onClick();
            }}
          >
            {action.icon && (
              <ListItemIcon sx={action.tone === 'danger' ? { color: 'inherit' } : undefined}>
                {action.icon}
              </ListItemIcon>
            )}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default TableActionsMenu;
