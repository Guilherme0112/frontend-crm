import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { PHONE_REGEX, maskPhone } from '@/src/lib/format';

const inlineLeadSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome'),
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Formato (00) 00000-0000',
    }),
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
    defaultValues: { name: '', email: '', phone: '' },
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
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Cancelar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Nome do lead *"
          autoFocus
          className="w-full rounded-md border border-zinc-950/[0.12] bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none dark:border-white/[0.12] dark:bg-[#101012] dark:text-zinc-100"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <input
          type="email"
          placeholder="E-mail *"
          className="w-full rounded-md border border-zinc-950/[0.12] bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none dark:border-white/[0.12] dark:bg-[#101012] dark:text-zinc-100"
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
            <input
              type="tel"
              placeholder="Telefone (opcional)"
              className="w-full rounded-md border border-zinc-950/[0.12] bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-blue-600 focus:outline-none dark:border-white/[0.12] dark:bg-[#101012] dark:text-zinc-100"
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

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}
