import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, MailCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateSendingTemplateMutation,
  useDeleteSendingTemplateMutation,
  useSendingTemplatesQuery,
  useUpdateSendingTemplateMutation,
} from './hooks';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { CardsGridSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import type { SendingTemplate } from '@/src/lib/types';

const templateSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do template'),
  description: z.string().optional(),
  body: z.string().trim().min(1, 'Informe o conteúdo da mensagem'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const DEFAULT_SAMPLE_VARS: Record<string, string> = {
  name: 'Mariana Costa',
  nome: 'Mariana Costa',
  email: 'mariana@empresa.com.br',
  company: 'Acme Brasil',
  empresa: 'Acme Brasil',
  phone: '(11) 98765-4321',
  telefone: '(11) 98765-4321',
};

function extractPlaceholders(body: string): string[] {
  const matches = body.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g);
  const seen = new Set<string>();
  for (const m of matches) {
    seen.add(m[1]);
  }
  return Array.from(seen);
}

function renderTemplatePreview(body: string, sampleMap: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const val = sampleMap[key] ?? DEFAULT_SAMPLE_VARS[key.toLowerCase()];
    return val || `[${key}]`;
  });
}

export function SendingTemplatesPage() {
  const { toast } = useToast();
  const templatesQuery = useSendingTemplatesQuery();
  const createMutation = useCreateSendingTemplateMutation();
  const updateMutation = useUpdateSendingTemplateMutation();
  const deleteMutation = useDeleteSendingTemplateMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SendingTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<SendingTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<SendingTemplate | null>(null);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>(DEFAULT_SAMPLE_VARS);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', description: '', body: '' },
  });

  const watchedBody = watch('body') || '';
  const detectedPlaceholders = useMemo(
    () => extractPlaceholders(watchedBody),
    [watchedBody],
  );
  const livePreviewText = useMemo(
    () => renderTemplatePreview(watchedBody, sampleValues),
    [watchedBody, sampleValues],
  );

  const openCreateModal = () => {
    setEditingTemplate(null);
    reset({
      name: '',
      description: '',
      body: 'Olá {{name}}, tudo bem? Recebemos seu contato da empresa {{company}}.',
    });
    setModalOpen(true);
  };

  const openEditModal = (tpl: SendingTemplate) => {
    setEditingTemplate(tpl);
    reset({
      name: tpl.name,
      description: tpl.description ?? '',
      body: tpl.body,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: TemplateFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      body: values.body,
    };
    try {
      if (editingTemplate) {
        await updateMutation.mutateAsync({ id: editingTemplate.id, payload });
        toast.success('Template atualizado');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Template criado');
      }
      setModalOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar template', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.id);
      toast.success('Template excluído');
      setDeletingTemplate(null);
    } catch (error) {
      toast.error('Erro ao excluir template', getApiErrorMessage(error));
    }
  };

  const templates = templatesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Templates de Envio
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Crie modelos de mensagens com variáveis dinâmicas como {'{{name}}'} e visualize o resultado em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Novo template</span>
        </button>
      </div>

      {templatesQuery.isPending ? (
        <CardsGridSkeleton count={3} />
      ) : templatesQuery.isError ? (
        <ErrorState
          title="Erro ao carregar templates"
          error={templatesQuery.error}
          onRetry={() => void templatesQuery.refetch()}
        />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<MailCheck className="h-5 w-5" />}
          title="Nenhum template cadastrado"
          description="Crie templates reutilizáveis com placeholders {{variavel}} para associar aos seus grupos de envio."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Criar primeiro template</span>
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((tpl) => {
            const vars = extractPlaceholders(tpl.body);
            return (
              <article
                key={tpl.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                        {tpl.name}
                      </h2>
                      {tpl.description && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {tpl.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(tpl)}
                        title="Pré-visualizar"
                        aria-label={`Pré-visualizar ${tpl.name}`}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(tpl)}
                        title="Editar"
                        aria-label={`Editar ${tpl.name}`}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTemplate(tpl)}
                        title="Excluir"
                        aria-label={`Excluir ${tpl.name}`}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <pre className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {tpl.body}
                  </pre>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>
                    {vars.length > 0
                      ? `Variáveis: ${vars.map((v) => `{{${v}}}`).join(' · ')}`
                      : 'Sem variáveis dinâmicas'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(tpl)}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Simular envio
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal with Live Preview */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTemplate ? 'Editar template' : 'Novo template de envio'}
        description="Use chaves duplas {{variavel}} para inserir dados dinâmicos."
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <FormField label="Nome" htmlFor="tpl-name" required error={errors.name?.message}>
                <input
                  id="tpl-name"
                  type="text"
                  placeholder="Ex.: Boas-vindas Comercial"
                  className={inputClassName(Boolean(errors.name))}
                  {...register('name')}
                />
              </FormField>

              <FormField label="Descrição" htmlFor="tpl-desc" error={errors.description?.message}>
                <input
                  id="tpl-desc"
                  type="text"
                  placeholder="Opcional"
                  className={inputClassName(Boolean(errors.description))}
                  {...register('description')}
                />
              </FormField>

              <FormField
                label="Conteúdo da mensagem"
                htmlFor="tpl-body"
                required
                hint="Ex.: Olá {{name}}, recebemos seu contato para {{company}}."
                error={errors.body?.message}
              >
                <textarea
                  id="tpl-body"
                  rows={6}
                  className={`${inputClassName(Boolean(errors.body))} font-mono text-xs leading-relaxed`}
                  {...register('body')}
                />
              </FormField>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Pré-visualização ao vivo
                </p>
                <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  {livePreviewText || 'Digite o corpo da mensagem para visualizar...'}
                </div>

                {detectedPlaceholders.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Valores de exemplo para teste:
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {detectedPlaceholders.map((key) => (
                        <div key={key}>
                          <label className="block font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {`{{${key}}}`}
                          </label>
                          <input
                            type="text"
                            value={sampleValues[key] ?? DEFAULT_SAMPLE_VARS[key.toLowerCase()] ?? ''}
                            onChange={(e) =>
                              setSampleValues((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={`Valor para ${key}`}
                            className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : editingTemplate
                  ? 'Salvar alterações'
                  : 'Criar template'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Standalone Preview Modal */}
      <Modal
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate ? `Pré-visualização · ${previewTemplate.name}` : 'Pré-visualização'}
        description="Simulação com substituição automática das variáveis."
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
              {renderTemplatePreview(previewTemplate.body, sampleValues)}
            </div>

            {extractPlaceholders(previewTemplate.body).length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {extractPlaceholders(previewTemplate.body).map((key) => (
                  <div key={key}>
                    <label className="block font-mono text-xs text-slate-500 dark:text-slate-400">
                      {`{{${key}}}`}
                    </label>
                    <input
                      type="text"
                      value={sampleValues[key] ?? DEFAULT_SAMPLE_VARS[key.toLowerCase()] ?? ''}
                      onChange={(e) =>
                        setSampleValues((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className={inputClassName(false)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingTemplate)}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir template"
        description={`Tem certeza que deseja excluir o template "${deletingTemplate?.name ?? ''}"?`}
        confirmLabel="Excluir template"
      />
    </div>
  );
}
