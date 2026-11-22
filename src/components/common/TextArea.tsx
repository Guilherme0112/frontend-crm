import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from './TextInput';

export type TextAreaProps = Omit<TextInputProps, 'multiline' | 'type'> & {
  resizable?: boolean;
};

export const TextArea = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ rows = 1, resizable = true, sx, limit = 5000, ...props }, ref) {
    return (
      <TextInput
        multiline
        rows={rows}
        limit={limit}
        {...props}
        ref={ref}
        sx={[
          {
            '& .MuiInputBase-inputMultiline': {
              resize: resizable ? 'vertical' : 'none',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  },
);
