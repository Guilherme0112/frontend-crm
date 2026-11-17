import { createContext, useContext, useMemo, type ReactNode } from 'react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';

interface FieldMeta {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
}

const FieldContext = createContext<FieldMeta | null>(null);

export function useFieldMeta(): FieldMeta {
  return useContext(FieldContext) ?? {};
}

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  floatingLabel?: boolean;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
  floatingLabel = true,
}: FormFieldProps) {
  const meta = useMemo<FieldMeta>(
    () => (floatingLabel ? { label, required, error, hint, htmlFor } : { error, hint }),
    [floatingLabel, label, required, error, hint, htmlFor],
  );

  return (
    <FieldContext.Provider value={meta}>
      <FormControl
        fullWidth
        error={Boolean(error)}
        required={required}
        className={className}
        sx={{ mb: 2, ...(floatingLabel ? null : { gap: 1 }) }}
      >
        {! floatingLabel && (
          <FormLabel
            htmlFor={htmlFor}
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: 'text.primary',
              '&.Mui-focused, &.Mui-error': { color: 'text.primary' },
            }}
          >
            {label}
          </FormLabel>
        )}

        {children}

        {(error || hint) && ! floatingLabel && (
          <FormHelperText role={error ? 'alert' : undefined} sx={{ mx: 0 }}>
            {error ?? hint}
          </FormHelperText>
        )}
      </FormControl>
    </FieldContext.Provider>
  );
}
