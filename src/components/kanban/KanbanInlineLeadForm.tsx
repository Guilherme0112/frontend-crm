import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { PHONE_MAX_LENGTH, PHONE_REGEX, maskCurrency, maskPhone } from '@/src/lib/format';
import { TextInput } from '@/src/components/common/TextInput';

const inlineLeadSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome'),
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Formato +55 (00) 00000-0000',
    }),
  value: z.string().optional(),
});

export type InlineLeadValues = z.infer<typeof inlineLeadSchema>;

interface KanbanInlineLeadFormProps {
  isPending?: boolean;
  onSubmit: (values: InlineLeadValues) => void;
  onCancel: () => void;
}

/**
 * Composer inline de lead, usado tanto no rodapé da coluna quanto
 * nos gaps entre os cards (padrão Trello).
 */
export function KanbanInlineLeadForm({ isPending, onSubmit, onCancel }: KanbanInlineLeadFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InlineLeadValues>({
    resolver: zodResolver(inlineLeadSchema),
    defaultValues: { name: '', email: '', phone: '', value: '' },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-2.5 rounded-lg border border-blue-500/40 bg-white p-3 shadow-sm ring-2 ring-blue-500/20 dark:border-blue-500/40 dark:bg-white/[0.03]"
      noValidate
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          Novo lead
        </span>
        <IconButton size="small" onClick={onCancel} aria-label="Cancelar">
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <div>
        <TextInput
          type="text"
          placeholder="Nome do lead *"
          limit={255}
          autoFocus
          size="small"
          hasError={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <TextInput
          type="email"
          placeholder="E-mail *"
          limit={255}
          size="small"
          hasError={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <TextInput
              type="tel"
              placeholder="Telefone (opcional)"
              limit={PHONE_MAX_LENGTH}
              size="small"
              hasError={Boolean(errors.phone)}
              value={field.value || ''}
              onChange={(e) => field.onChange(maskPhone(e.target.value))}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.phone && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Controller
          control={control}
          name="value"
          render={({ field }) => (
            <TextInput
              type="text"
              inputMode="numeric"
              placeholder="Valor (opcional)"
              limit={20}
              size="small"
              hasError={Boolean(errors.value)}
              value={field.value || ''}
              onChange={(e) => field.onChange(maskCurrency(e.target.value))}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.value && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.value.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" size="small" color="inherit" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="small" variant="contained" disabled={isPending} type="submit">
          {isPending ? 'Salvando...' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
