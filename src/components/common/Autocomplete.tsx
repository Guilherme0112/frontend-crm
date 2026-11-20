import { useEffect, useRef, useState } from 'react';
import MuiAutocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useFieldMeta } from './FormField';

export interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteProps {
  id?: string;
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  className?: string;
  fieldClassName?: string;
  hasError?: boolean;
  clearable?: boolean;
  onSearch?: (term: string) => void;
  debounceMs?: number;
  loading?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
}

export function Autocomplete({
  id,
  value,
  options,
  onChange,
  placeholder = 'Selecione...',
  emptyMessage = 'Nenhuma opção encontrada',
  ariaLabel,
  ariaDescribedBy,
  disabled,
  className,
  hasError,
  clearable = true,
  onSearch,
  debounceMs = 300,
  loading = false,
  variant = 'standard',
  size = 'medium',
}: AutocompleteProps) {
  const field = useFieldMeta();

  // Com busca no servidor a lista muda a cada consulta, e a opção escolhida
  // pode não estar na leva atual. Sem guardá-la, o campo apagaria sozinho.
  const lastSelected = useRef<AutocompleteOption | null>(null);
  const found = options.find((option) => option.value === value) ?? null;

  if (found) lastSelected.current = found;
  if (value === '') lastSelected.current = null;

  const selected = found ?? (value !== '' ? lastSelected.current : null);

  const [term, setTerm] = useState('');
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (! onSearchRef.current) return;

    const timer = window.setTimeout(() => onSearchRef.current?.(term), debounceMs);

    return () => window.clearTimeout(timer);
  }, [term, debounceMs]);

  return (
    <MuiAutocomplete
      id={id}
      className={className}
      options={options}
      value={selected}
      disabled={disabled}
      disableClearable={!clearable}
      openOnFocus
      loading={loading}
      filterOptions={onSearch ? (x) => x : undefined}
      noOptionsText={loading ? 'Carregando...' : emptyMessage}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, current) => option.value === current.value}
      onChange={(_, option) => onChange(option?.value ?? '')}
      onInputChange={(_, next, reason) => {
        if (reason === 'input') setTerm(next);
      }}
      renderOption={(props, option) => {
        const { key, ...liProps } = props as typeof props & { key: string };

        return (
          <li key={key} {...liProps}>
            <Stack spacing={0}>
              <Typography variant="body2">{option.label}</Typography>
              {option.description && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
            </Stack>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          size={size}
          label={field.label}
          required={field.required}
          helperText={field.error ?? field.hint}
          placeholder={placeholder}
          error={hasError ?? Boolean(field.error)}
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps?.htmlInput,
              'aria-label': ariaLabel,
              'aria-describedby': ariaDescribedBy,
            },
          }}
        />
      )}
    />
  );
}
