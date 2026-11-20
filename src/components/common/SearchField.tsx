import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/** Campo de busca MUI compartilhado por CRM, grupos, templates e quadros. */
export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar...',
  ariaLabel = 'Buscar',
  className,
}: SearchFieldProps) {
  return (
    <TextField
      type="search"
      variant="standard"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={className}
      slotProps={{
        htmlInput: { 'aria-label': ariaLabel },
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ mr: 0.75 }}>
              <Search className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end" sx={{ ml: 0.25 }}>
              <IconButton
                size="small"
                onClick={() => onChange('')}
                aria-label="Limpar busca"
                sx={{
                  color: 'text.secondary',
                  p: 0.4,
                  borderRadius: 1,
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
      sx={(theme) => ({
        mx: 0.5,
        '& .MuiInputBase-root': {
          fontSize: 13,
          '& .MuiInputBase-input': { padding: '4px 0' },
        },
        '& .MuiInputAdornment-root': {
          color: theme.palette.text.secondary,
        },
        '& .MuiInput-underline:before': {
          borderBottomColor: theme.palette.divider,
          transition: 'border-bottom-color 150ms ease',
        },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
          borderBottomColor: alpha(theme.palette.text.primary, 0.35),
        },
        '& .MuiInput-underline:after': {
          borderBottomColor: theme.palette.primary.main,
          borderBottomWidth: 2,
        },
        '& .MuiInputBase-input::placeholder': {
          color: theme.palette.text.secondary,
          opacity: 0.8,
        },
        '& input[type="search"]::-webkit-search-cancel-button': { display: 'none' },
      })}
    />
  );
}
