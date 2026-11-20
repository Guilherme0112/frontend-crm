import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useFieldMeta } from './FormField';

export type TextInputProps = Omit<TextFieldProps, 'error' | 'variant'> & {
  hasError?: boolean;
  /** Limite de caracteres. Padrão: 100. */
  limit?: number;
};

export const TextInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextInputProps>(
  function TextInput({ hasError, label, helperText, required, onChange, slotProps, limit = 100, ...props }, ref) {
    const field = useFieldMeta();
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const [filled, setFilled] = useState(false);

    // O react-hook-form preenche inputs não controlados pelo DOM, no reset(), depois da
    // montagem. O MUI só inspeciona o DOM na montagem, então o label continuaria grande,
    // em cima do valor carregado. Reler a cada render cobre o reset; o onChange cobre a
    // digitação, que não gera render em input não controlado.
    useLayoutEffect(() => {
      setFilled(Boolean(inputRef.current?.value));
    });

    const mergeRefs = useCallback(
      (node: HTMLInputElement | HTMLTextAreaElement | null) => {
        inputRef.current = node;

        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFilled(event.target.value !== '');
      onChange?.(event);
    };

    const resolvedError = hasError ?? Boolean(field.error);
    const resolvedHelper = helperText ?? field.error ?? field.hint;

    return (
      <TextField
        variant="standard"
        fullWidth
        {...props}
        label={label ?? field.label}
        required={required ?? field.required}
        helperText={resolvedHelper}
        onChange={handleChange}
        inputRef={mergeRefs}
        error={Boolean(resolvedError)}
        slotProps={{
          ...slotProps,
          htmlInput: {
            ...(slotProps?.htmlInput as object | undefined),
            maxLength: limit,
          },
          // Só força o encolhimento: vazio, o MUI decide e a animação continua.
          inputLabel: {
            ...(slotProps?.inputLabel as object | undefined),
            ...(filled ? { shrink: true } : {}),
          },
        }}
      />
    );
  },
);
