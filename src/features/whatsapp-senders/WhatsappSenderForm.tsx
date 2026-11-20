import { useState, type FormEvent } from 'react';
import { FormField } from '@/src/components/common/FormField';
import { ModalActions } from '@/src/components/common/ModalActions';
import { TextInput } from '@/src/components/common/TextInput';
import type { WhatsappSender } from '@/src/lib/types';

export interface WhatsappSenderFormValues {
  name: string;
  phone_number: string;
  phone_number_id: string;
  access_token: string;
  is_active: boolean;
}

interface Props {
  initial?: WhatsappSender | null;
  onSubmit: (values: WhatsappSenderFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

export function WhatsappSenderForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const isEdit = Boolean(initial);
  const [values, setValues] = useState<WhatsappSenderFormValues>({
    name: initial?.name ?? '',
    phone_number: initial?.phone_number ?? '',
    phone_number_id: initial?.phone_number_id ?? '',
    access_token: '',
    is_active: initial?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next.name = 'Informe um nome com pelo menos 2 caracteres.';
    if (values.phone_number_id.trim().length < 3) next.phone_number_id = 'Informe o Phone Number ID da Meta.';
    if (!isEdit && values.access_token.trim().length < 10) {
      next.access_token = 'Informe o access token (mínimo 10 caracteres).';
    }
    if (isEdit && values.access_token.trim() !== '' && values.access_token.trim().length < 10) {
      next.access_token = 'Se informado, o access token deve ter pelo menos 10 caracteres.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...values,
      name: values.name.trim(),
      phone_number: values.phone_number.trim(),
      phone_number_id: values.phone_number_id.trim(),
      access_token: values.access_token.trim(),
    });
  };

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
      <FormField label="Nome do remetente" htmlFor="wa-sender-name" required error={errors.name}>
        <TextInput
          id="wa-sender-name"
          limit={255}
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="Ex.: WhatsApp Comercial"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Número exibido"
          htmlFor="wa-sender-phone"
          hint="Opcional. Apenas identificação interna/exibição."
        >
          <TextInput
            id="wa-sender-phone"
            limit={30}
            value={values.phone_number}
            onChange={(e) => setValues((v) => ({ ...v, phone_number: e.target.value }))}
            placeholder="+55 11 99999-9999"
          />
        </FormField>

        <FormField
          label="Phone Number ID (Meta)"
          htmlFor="wa-sender-pnid"
          required
          error={errors.phone_number_id}
        >
          <TextInput
            id="wa-sender-pnid"
            limit={100}
            value={values.phone_number_id}
            onChange={(e) => setValues((v) => ({ ...v, phone_number_id: e.target.value }))}
            placeholder="Ex.: 123456789012345"
          />
        </FormField>
      </div>

      <FormField
        label={isEdit ? 'Access Token (deixe em branco para manter)' : 'Access Token'}
        htmlFor="wa-sender-token"
        required={!isEdit}
        error={errors.access_token}
        hint="Armazenado de forma segura no backend e nunca retornado pela API."
      >
        <TextInput
          id="wa-sender-token"
          type="password"
          limit={500}
          value={values.access_token}
          onChange={(e) => setValues((v) => ({ ...v, access_token: e.target.value }))}
          placeholder={isEdit ? '•••••••• (inalterado)' : 'Token da Meta Cloud API'}
          autoComplete="new-password"
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={values.is_active}
          onChange={(e) => setValues((v) => ({ ...v, is_active: e.target.checked }))}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
        />
        Remetente ativo
      </label>

      <ModalActions
        onCancel={onCancel}
        isPending={submitting}
        submitLabel={isEdit ? 'Salvar alterações' : 'Criar remetente'}
        pendingLabel="Salvando..."
      />
    </form>
  );
}
