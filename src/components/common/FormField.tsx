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

/** Compatibilidade com formulários legados que ainda usam inputs nativos. */
export function inputClassName(hasError = false): string {
  return [
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 dark:bg-[#101012] dark:text-zinc-100',
    hasError
      ? 'border-red-500 focus:border-red-600'
      : 'border-zinc-950/[0.12] focus:border-blue-600 dark:border-white/[0.12] dark:focus:border-blue-400',
  ].join(' ');
}

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
  /** Remove o espaçamento vertical padrão quando o container já define o gap. */
  dense?: boolean;
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
  dense = false,
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
        sx={{ mb: dense ? 0 : 2, ...(floatingLabel ? null : { gap: 1 }) }}
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
