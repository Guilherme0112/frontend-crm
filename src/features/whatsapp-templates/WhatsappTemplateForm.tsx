import Button from '@mui/material/Button';
import { useState, type FormEvent } from 'react';
import { FormField } from '@/src/components/common/FormField';
import { ModalActions } from '@/src/components/common/ModalActions';
import { TextInput } from '@/src/components/common/TextInput';
import type { WhatsappTemplate } from '@/src/lib/types';
import { X } from 'lucide-react';

export interface WhatsappTemplateFormValues {
  name: string;
  language: string;
  category: string;
  is_active: boolean;
  body_fields: string[];
}

interface Props {
  initial?: WhatsappTemplate | null;
  onSubmit: (values: WhatsappTemplateFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const LEAD_FIELD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'name', label: 'Nome do lead' },
  { value: 'email', label: 'E-mail do lead' },
  { value: 'phone', label: 'Telefone do lead' },
];

function extractBodyFields(mapping: Record<string, unknown> | null | undefined): string[] {
  if (!mapping) return [];
  const body = (mapping as any).body ?? (mapping as any).body_params;
  if (Array.isArray(body)) {
    return body
      .map((f) => {
        if (typeof f === 'string') return f;
        if (f && typeof f === 'object') return (f as any).lead_field ?? (f as any).field ?? (f as any).key ?? '';
        return '';
      })
      .filter((v): v is string => typeof v === 'string' && v !== '');
  }
  return [];
}

export function WhatsappTemplateForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const isEdit = Boolean(initial);
  const [values, setValues] = useState<WhatsappTemplateFormValues>({
    name: initial?.name ?? '',
    language: initial?.language ?? 'pt_BR',
    category: initial?.category ?? '',
    is_active: initial?.is_active ?? true,
    body_fields: extractBodyFields(initial?.variable_mapping ?? null),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addBodyField = (field: string) => {
    setValues((v) => ({ ...v, body_fields: [...v.body_fields, field] }));
  };

  const removeBodyField = (index: number) => {
    setValues((v) => ({ ...v, body_fields: v.body_fields.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next.name = 'Informe o nome exato do template aprovado na Meta.';
    if (values.language.trim().length < 2) next.language = 'Informe o idioma do template (ex.: pt_BR).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...values,
      name: values.name.trim(),
      language: values.language.trim(),
      category: values.category.trim(),
    });
  };

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <FormField
        label="Nome do template (Meta)"
        htmlFor="wa-tpl-name"
        required
        error={errors.name}
        hint="Use o nome exato do template aprovado na Meta."
      >
        <TextInput
          id="wa-tpl-name"
          limit={255}
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="Ex.: welcome_message"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Idioma" htmlFor="wa-tpl-lang" required error={errors.language}>
          <TextInput
            id="wa-tpl-lang"
            limit={20}
            value={values.language}
            onChange={(e) => setValues((v) => ({ ...v, language: e.target.value }))}
            placeholder="pt_BR"
          />
        </FormField>
        <FormField label="Categoria" htmlFor="wa-tpl-cat">
          <TextInput
            id="wa-tpl-cat"
            limit={50}
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
            placeholder="MARKETING / UTILITY / AUTHENTICATION"
          />
        </FormField>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Variáveis do corpo (body)
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mapeie, em ordem, os parâmetros do corpo do template para campos do lead.
        </p>
        <div className="flex flex-wrap gap-2">
          {LEAD_FIELD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => addBodyField(opt.value)}
            >
              + {opt.label}
            </Button>
          ))}
        </div>
        {values.body_fields.length > 0 ? (
          <ol className="mt-2 space-y-2">
            {values.body_fields.map((field, index) => {
              const label = LEAD_FIELD_OPTIONS.find((o) => o.value === field)?.label ?? field;
              return (
                <li
                  key={`${field}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/40"
                >
                  <span className="text-zinc-700 dark:text-zinc-200">
                    <span className="mr-2 font-mono text-xs text-zinc-500">{`{{${index + 1}}}`}</span>
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBodyField(index)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                    aria-label="Remover variável"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Nenhuma variável mapeada (template sem parâmetros no corpo).</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={values.is_active}
          onChange={(e) => setValues((v) => ({ ...v, is_active: e.target.checked }))}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
        />
        Template ativo
      </label>

      <ModalActions
        onCancel={onCancel}
        isPending={submitting}
        submitLabel={isEdit ? 'Salvar alterações' : 'Criar template'}
        pendingLabel="Salvando..."
      />
    </form>
  );
}
