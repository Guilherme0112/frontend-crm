import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  Mail,
  MailCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
  Variable,
  X,
} from 'lucide-react';
import {
  useCreateSendingTemplateMutation,
  useDeleteSendingTemplateMutation,
  useSendingTemplatesQuery,
  useUpdateSendingTemplateMutation,
} from './hooks';
import { EmailPreview } from './EmailPreview';
import { TemplateToolbar } from './TemplateToolbar';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { TextArea } from '@/src/components/common/TextArea';
import { Pagination } from '@/src/components/common/Pagination';
import { CardsGridSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { formatDate } from '@/src/lib/format';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
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
  for (const m of matches) seen.add(m[1]);
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const templatesQuery = useSendingTemplatesQuery(page, 10, debouncedSearch);
  const createMutation = useCreateSendingTemplateMutation();
  const updateMutation = useUpdateSendingTemplateMutation();
  const deleteMutation = useDeleteSendingTemplateMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SendingTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<SendingTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<SendingTemplate | null>(null);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>(DEFAULT_SAMPLE_VARS);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
      body: 'Olá {{name}}, tudo bem? Recebemos seu contato da {{company}}.',
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

  const templates = templatesQuery.data?.data ?? [];
  const meta = templatesQuery.data?.meta ?? null;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;

  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page));
    }
  }, [meta, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Disparos</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Templates de envio
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Componha mensagens reutilizáveis com variáveis dinâmicas. Pré-visualize, teste e reutilize em todos os grupos de envio.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/email-configs"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <Mail className="h-4 w-4" strokeWidth={1.8} />
            <span>Configuração de email</span>
          </Link>
          <Button variant="contained" color="inherit" startIcon={<Plus className="h-4 w-4" strokeWidth={2.2} />} onClick={openCreateModal} className="whitespace-nowrap">
            Novo template
          </Button>
        </div>
      </div>

      {/* Lista */}
      {templatesQuery.isPending ? (
        <CardsGridSkeleton count={4} />
      ) : templatesQuery.isError ? (
        <ErrorState
          title="Erro ao carregar templates"
          error={templatesQuery.error}
          onRetry={() => void templatesQuery.refetch()}
        />
      ) : templates.length === 0 && !debouncedSearch ? (
        <EmptyState
          icon={<MailCheck className="h-5 w-5" />}
          title="Nenhum template cadastrado"
          description="Crie templates reutilizáveis com placeholders {{variavel}} para associar aos seus grupos de envio."
          action={
            <Button variant="contained" color="inherit" startIcon={<Plus className="h-4 w-4" strokeWidth={2.2} />} onClick={openCreateModal}>
              Criar primeiro template
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-950/[0.06] px-5 py-3 dark:border-white/[0.06]">
            <div className="min-w-0 flex-1">
              <TextInput
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, descrição ou conteúdo..."
                aria-label="Buscar template"
                className="max-w-sm"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="h-4 w-4" aria-hidden="true" />
                      </InputAdornment>
                    ),
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearch('')} aria-label="Limpar busca">
                          <X className="h-4 w-4" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
            </div>
            <p className="font-mono text-[11px] tabular-nums uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {total} {total === 1 ? 'template' : 'templates'}
            </p>
          </div>

          {/* Rows */}
          {templates.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Nenhum template para &quot;{search}&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
              {templates.map((tpl) => {
                const vars = extractPlaceholders(tpl.body);
                return (
                  <li key={tpl.id} className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-400/10"
                      aria-hidden="true"
                    >
                      <MailCheck className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <h2 className="font-display text-[13px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                          {tpl.name}
                        </h2>
                        {tpl.created_at && (
                          <span className="font-mono text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                            {formatDate(tpl.created_at)}
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {tpl.description}
                        </p>
                      )}
                      <p className="mt-1.5 line-clamp-2 font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {tpl.body}
                      </p>
                      {vars.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {vars.map((v) => (
                            <span
                              key={v}
                              className="inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                            >
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <IconButton size="small" onClick={() => setPreviewTemplate(tpl)} title="Pré-visualizar" aria-label={`Pré-visualizar ${tpl.name}`}>
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openEditModal(tpl)} title="Editar" aria-label={`Editar ${tpl.name}`}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeletingTemplate(tpl)} title="Excluir" aria-label={`Excluir ${tpl.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {total > 0 && (
        <Pagination
          page={meta?.current_page ?? page}
          lastPage={lastPage}
          total={total}
          from={meta?.from ?? null}
          to={meta?.to ?? null}
          onPageChange={setPage}
          ariaLabel="Paginação de templates"
        />
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
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <FormField label="Nome" htmlFor="tpl-name" required error={errors.name?.message}>
                <TextInput
                  id="tpl-name"
                  type="text"
                  placeholder="Ex.: Boas-vindas Comercial"
                  hasError={Boolean(errors.name)}
                  {...register('name')}
                />
              </FormField>

              <FormField label="Descrição" htmlFor="tpl-desc" error={errors.description?.message}>
                <TextArea
                  id="tpl-desc"
                  placeholder="Opcional"
                  hasError={Boolean(errors.description)}
                  {...register('description')}
                />
              </FormField>

              <FormField
                label=""
                htmlFor="tpl-body"
                required
                hint="HTML suportado (ex.: <strong>, <ul>, <a href>, tabelas) — também aceita um documento HTML completo. Use {{name}}, {{company}}, etc."
                error={errors.body?.message}
              >
                <TemplateToolbar
                  textareaId="tpl-body"
                  value={watchedBody}
                  onChange={(next, caret) => {
                    setValue('body', next, { shouldDirty: true });
                    window.requestAnimationFrame(() => {
                      const el = document.getElementById('tpl-body') as HTMLTextAreaElement | null;
                      if (el) {
                        el.focus();
                        el.setSelectionRange(caret, caret);
                      }
                    });
                  }}
                />
                <TextArea
                  id="tpl-body"
                  rows={12}
                  hasError={Boolean(errors.body)}
                  slotProps={{
                    htmlInput: {
                      'aria-label': 'Conteúdo do email',
                      style: {
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 13,
                        lineHeight: 1.625,
                      },
                    },
                  }}
                  {...register('body')}
                />
              </FormField>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-2">
              <div className="rounded-2xl border border-zinc-950/[0.08] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1b1b1f]">
                <div className="flex items-center gap-2 border-b border-zinc-950/[0.07] px-4 py-2.5 dark:border-white/[0.07]">
                  <div className="flex gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="mx-auto text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                    Pré-visualização
                  </p>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="inline-block h-5 w-5 rounded-full bg-blue-600" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-700 dark:text-zinc-200">Vértice CRM</p>
                      <p className="truncate">para: mariana@empresa.com.br</p>
                    </div>
                  </div>
                  <div className="mt-3">
                  {watchedBody.trim() ? (
                    <EmailPreview html={livePreviewText} height={320} />
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-zinc-950/[0.12] px-6 text-center text-[13px] text-zinc-400 dark:border-white/[0.12] dark:text-zinc-500">
                      Digite o corpo da mensagem para visualizar...
                    </div>
                  )}
                </div>
                </div>
              </div>

              {detectedPlaceholders.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                    <Variable className="h-3 w-3" />
                    Valores de exemplo
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {detectedPlaceholders.map((key) => (
                      <div key={key}>
                        <label className="block font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                          {`{{${key}}}`}
                        </label>
                        <TextInput
                          type="text"
                          value={sampleValues[key] ?? DEFAULT_SAMPLE_VARS[key.toLowerCase()] ?? ''}
                          onChange={(e) =>
                            setSampleValues((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={`Valor para ${key}`}
                          className="mt-1 w-full rounded-md border border-zinc-950/[0.12] bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-zinc-300 focus:outline-none dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
            <Button variant="outlined" color="inherit" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="contained" color="inherit" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : editingTemplate
                  ? 'Salvar alterações'
                  : 'Criar template'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate ? `Pré-visualização · ${previewTemplate.name}` : 'Pré-visualização'}
        description="Simulação com substituição automática das variáveis."
        size="2xl"
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-950/[0.08] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1b1b1f]">
              <div className="flex items-center gap-2 border-b border-zinc-950/[0.07] px-4 py-2.5 dark:border-white/[0.07]">
                <div className="flex gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <p className="mx-auto text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                  Visualização
                </p>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="inline-block h-5 w-5 rounded-full bg-blue-600" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-700 dark:text-zinc-200">Vértice CRM</p>
                    <p className="truncate">para: mariana@empresa.com.br</p>
                  </div>
                </div>
                <div className="mt-3">
                  <EmailPreview
                    html={renderTemplatePreview(previewTemplate.body, sampleValues)}
                    height={560}
                    title={`Pré-visualização de ${previewTemplate.name}`}
                  />
                </div>
              </div>
            </div>

            {extractPlaceholders(previewTemplate.body).length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {extractPlaceholders(previewTemplate.body).map((key) => (
                  <div key={key}>
                    <label className="block font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {`{{${key}}}`}
                    </label>
                    <TextInput
                      type="text"
                      value={sampleValues[key] ?? DEFAULT_SAMPLE_VARS[key.toLowerCase()] ?? ''}
                      onChange={(e) =>
                        setSampleValues((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      hasError={false}
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
