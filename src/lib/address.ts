import { z } from 'zod';
import { ZIP_REGEX } from '@/src/lib/format';
import type { Address } from '@/src/lib/types';

/**
 * Schema dos 9 campos de `addresses`, espelhando `AddressValidation::rules()` no
 * backend. Compartilhado por empresa e lead para as duas telas não divergirem.
 */
export const addressSchema = z.object({
  street: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  number: z.string().trim().max(20, 'Máximo de 20 caracteres').optional(),
  complement: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  neighborhood: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  city: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  state: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val.length === 2, { message: 'UF deve ter 2 letras (ex.: SP)' }),
  country: z.string().trim().max(100, 'Máximo de 100 caracteres').optional(),
  zip_code: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || ZIP_REGEX.test(val), {
      message: 'CEP deve estar no formato 00000-000',
    }),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export const emptyAddressValues: AddressFormValues = {
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  country: '',
  zip_code: '',
};

export function addressToFormValues(address?: Address | null): AddressFormValues {
  return {
    street: address?.street ?? '',
    number: address?.number ?? '',
    complement: address?.complement ?? '',
    neighborhood: address?.neighborhood ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    country: address?.country ?? '',
    zip_code: address?.zip_code ?? '',
  };
}

/**
 * **Sempre monta o objeto completo.** O backend substitui o registro inteiro
 * (`AddressManager::upsert`), então mandar só os campos preenchidos apagaria as
 * demais colunas — é assim que um "salvar só o CEP" apagaria rua e número.
 *
 * Devolve `null` quando nada foi preenchido, para não criar endereço vazio.
 */
export function addressToPayload(values: AddressFormValues): Address | null {
  const trimmed = {
    street: values.street?.trim() || null,
    number: values.number?.trim() || null,
    complement: values.complement?.trim() || null,
    neighborhood: values.neighborhood?.trim() || null,
    city: values.city?.trim() || null,
    state: values.state?.trim().toUpperCase() || null,
    country: values.country?.trim() || null,
    zip_code: values.zip_code?.trim() || null,
  };

  return Object.values(trimmed).some((value) => value !== null) ? trimmed : null;
}
