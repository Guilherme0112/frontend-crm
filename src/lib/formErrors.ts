import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiErrorPayload } from './types';

export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data;
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Não foi possível conectar ao servidor da API. Verifique se o backend está em execução e o CORS configurado.';
    }
    if (error.response?.status === 404) {
      return 'Registro não encontrado.';
    }
    if (error.response?.status === 409) {
      return 'Conflito ao processar a solicitação.';
    }
    if (error.response?.status >= 500) {
      return 'Erro interno no servidor da API.';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function getApiStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * Maps Laravel FormRequest 422 `{ errors: { field: [msg] } }` onto react-hook-form fields.
 * Supports dot-notation nested fields (e.g. `address.zip_code`).
 * Returns true if at least one field error was mapped.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap?: Record<string, Path<T>>,
): boolean {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return false;
  const errors = error.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return false;

  let mapped = false;
  for (const [rawKey, messages] of Object.entries(errors)) {
    if (!Array.isArray(messages) || messages.length === 0) continue;
    const targetField = (fieldMap?.[rawKey] ?? rawKey) as Path<T>;
    setError(targetField, {
      type: 'server',
      message: messages[0],
    });
    mapped = true;
  }
  return mapped;
}
