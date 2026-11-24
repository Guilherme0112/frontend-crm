import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { Eye, EyeOff } from 'lucide-react';
import { useFieldMeta } from './FormField';

export type TextInputProps = Omit<TextFieldProps, 'error' | 'variant'> & {
  hasError?: boolean;
  /** Limite de caracteres. Padrão: 255 (mesmo limite usado pelo backend nos campos de texto). */
  limit?: number;
  /** Adiciona o botão de mostrar/ocultar o valor (campos de senha e tokens). */
  passwordToggle?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextInputProps>(
  function TextInput({ hasError, label, helperText, required, onChange, slotProps, limit = 255, passwordToggle = false, ...props }, ref) {
    const field = useFieldMeta();
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const [filled, setFilled] = useState(false);
    const [visible, setVisible] = useState(false);

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
        type={passwordToggle ? (visible ? 'text' : 'password') : props.type}
        label={label ?? field.label}
        required={required ?? field.required}
        helperText={resolvedHelper}
        onChange={handleChange}
        inputRef={mergeRefs}
        error={Boolean(resolvedError)}
        slotProps={{
          ...slotProps,
          input: {
            ...(slotProps?.input as object | undefined),
            ...(passwordToggle
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        size="small"
                        edge="end"
                        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={visible}
                        onClick={() => setVisible((current) => !current)}
                        sx={{ mr: -1 }}
                      >
                        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              : {}),
          },
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
