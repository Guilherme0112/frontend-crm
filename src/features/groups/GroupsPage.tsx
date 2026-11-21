import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
import { TableActionButton } from '@/src/components/common/TableActionButton';
import { ModalActions } from '@/src/components/common/ModalActions';
import { SearchField } from '@/src/components/common/SearchField';
import { TextInput } from '@/src/components/common/TextInput';
import { TextArea } from '@/src/components/common/TextArea';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, History, Mail, Pencil, Plus, Settings, Trash2, Users, UsersRound } from 'lucide-react';
import {
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGroupsQuery,
  useUpdateGroupMutation,
} from './hooks';
import { useSendingTemplatesQuery } from '@/src/features/templates/hooks';
import { Modal } from '@/src/components/common/Modal';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField } from '@/src/components/common/FormField';
import { Pagination } from '@/src/components/common/Pagination';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { formatDate } from '@/src/lib/format';
import type { Group } from '@/src/lib/types';

const groupSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do grupo'),
  description: z.string().optional(),
  template_id: z
    .number({ message: 'Selecione um template de envio' })
    .int()
    .min(1, 'Selecione um template de envio'),
});

type GroupFormValues = z.infer<typeof groupSchema>;

export function GroupsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const groupsQuery = useGroupsQuery(page);
  const createMutation = useCreateGroupMutation();
  const updateMutation = useUpdateGroupMutation();
  const deleteMutation = useDeleteGroupMutation();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const templatesQuery = useSendingTemplatesQuery(1, 100, '', modalOpen);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configView, setConfigView] = useState<'channels' | 'whatsapp'>('channels');

  const templates = templatesQuery.data?.data ?? [];
  const templateById = useMemo(() => {
    const map = new Map<number, string>();
    for (const tpl of templates) map.set(tpl.id, tpl.name);
    return map;
  }, [templates]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', description: '', template_id: 0 },
  });

  const openCreateModal = () => {
    setEditingGroup(null);
    reset({
      name: '',
      description: '',
      template_id: templates[0]?.id ?? 0,
    });
    setModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    reset({
      name: group.name,
      description: group.description ?? '',
      template_id: group.template_id,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: GroupFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      template_id: values.template_id,
    };
    try {
      if (editingGroup) {
        await updateMutation.mutateAsync({ id: editingGroup.id, payload });
        toast.success('Grupo atualizado');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Grupo criado');
      }
      setModalOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar grupo', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    try {
      await deleteMutation.mutateAsync(deletingGroup.id);
      toast.success('Grupo excluído');
      setDeletingGroup(null);
    } catch (error) {
      toast.error('Erro ao excluir grupo', getApiErrorMessage(error));
    }
  };

  const groups = groupsQuery.data?.data ?? [];
  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(term) ||
        (group.description ?? '').toLowerCase().includes(term),
    );
  }, [groups, search]);
  const meta = groupsQuery.data?.meta ?? null;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;

  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page));
    }
  }, [meta, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Comunicação</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Disparos
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Gerencie grupos de leads para envio em massa e dispare campanhas por e-mail ou WhatsApp.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="outlined" color="inherit" onClick={() => { setConfigView('channels'); setConfigModalOpen(true); }} startIcon={<Settings className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Configurar
          </Button>
          <ActionButton
            type="button"
            onClick={openCreateModal}
            className="whitespace-nowrap"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            startIcon={<Plus className="h-4 w-4" />}
          >
            Novo grupo
          </ActionButton>
        </div>
      </div>

      {!groupsQuery.isPending && !groupsQuery.isError && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-950/[0.06] pb-3 dark:border-white/[0.06]">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar grupo por nome ou descrição..."
            ariaLabel="Buscar grupo"
            className="max-w-sm flex-1"
          />
        </div>
      )}

      {groupsQuery.isPending ? (
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <TableRowsSkeleton rows={4} cols={5} />
        </div>
      ) : groupsQuery.isError ? (
        <ErrorState
          title="Erro ao carregar grupos"
          error={groupsQuery.error}
          onRetry={() => void groupsQuery.refetch()}
        />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="h-5 w-5" />}
          title={search ? 'Nenhum grupo encontrado' : 'Nenhum grupo cadastrado'}
          description={
            search
              ? 'Tente outro termo de busca.'
              : 'Crie grupos para segmentar seus contatos e vincular templates de envio.'
          }
          action={
            <ActionButton
              type="button"
              onClick={openCreateModal}
              startIcon={<Plus className="h-4 w-4" />}
            >
              Criar primeiro grupo
            </ActionButton>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-950/[0.07] text-xs font-medium text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Template vinculado</th>
                <th className="px-5 py-3">Criado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {filteredGroups.map((group) => (
                <tr
                  key={group.id}
                  onClick={(event) => {
                    if ((event.target as Element).closest('button, a')) return;
                    navigate(`/disparos/${group.id}`);
                  }}
                  className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                >
                  <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <Link
                      to={`/disparos/${group.id}`}
                      className="rounded transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                      title="Abrir grupo"
                    >
                      {group.name}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {group.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                    {templateById.get(group.template_id) ?? `Template #${group.template_id}`}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {formatDate(group.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        to={`/disparos/${group.id}`}
                        aria-label={`Gerenciar leads de ${group.name}`}
                        title="Gerenciar leads do grupo"
                        className="inline-flex items-center justify-center rounded-lg bg-zinc-950/[0.05] p-1.5 text-zinc-500 transition-colors hover:bg-zinc-950/[0.1] hover:text-zinc-900 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.1] dark:hover:text-zinc-100"
                      >
                        <Users className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                      <Link
                        to={`/disparos/${group.id}/historico`}
                        aria-label={`Histórico de ${group.name}`}
                        title="Ver histórico"
                        className="inline-flex items-center justify-center rounded-lg bg-zinc-950/[0.05] p-1.5 text-zinc-500 transition-colors hover:bg-zinc-950/[0.1] hover:text-zinc-900 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.1] dark:hover:text-zinc-100"
                      >
                        <History className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                      <TableActionButton
                        tone="primary"
                        onClick={() => openEditModal(group)}
                        aria-label={`Editar ${group.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </TableActionButton>
                      <TableActionButton
                        tone="error"
                        onClick={() => setDeletingGroup(group)}
                        aria-label={`Excluir ${group.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </TableActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
          <Pagination
            page={meta?.current_page ?? page}
            lastPage={lastPage}
            total={total}
            from={meta?.from ?? null}
            to={meta?.to ?? null}
            onPageChange={setPage}
            ariaLabel="Paginação de grupos"
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGroup ? 'Editar grupo' : 'Novo grupo'}
        description="Associe um template de envio ativo a este grupo."
      >
        {templates.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Você ainda não possui templates de envio cadastrados. Crie um template primeiro para poder vinculá-lo a um grupo.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-zinc-950/[0.12] px-4 py-2 text-sm font-medium text-zinc-700 dark:border-white/[0.12] dark:text-zinc-200"
              >
                Fechar
              </Button>
              <Link
                to="/sending-templates"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ir para Templates
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="Nome" htmlFor="group-name" required error={errors.name?.message}>
              <TextInput
                id="group-name"
                limit={255}
                type="text"
                placeholder="Ex.: Clientes Enterprise"
                {...register('name')}
              />
            </FormField>

            <FormField
              label="Template de envio"
              htmlFor="group-template"
              required
              error={errors.template_id?.message}
            >
              <Controller
                name="template_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    id="group-template"
                    value={field.value > 0 ? String(field.value) : ''}
                    onChange={(v) => field.onChange(v === '' ? 0 : Number(v))}
                    placeholder="Selecione um template de envio..."
                    emptyMessage="Nenhum template encontrado"
                    hasError={Boolean(errors.template_id)}
                    options={templates.map((tpl) => ({ value: String(tpl.id), label: tpl.name }))}
                  />
                )}
              />
            </FormField>

            <FormField label="Descrição" htmlFor="group-desc" error={errors.description?.message}>
              <TextArea
                id="group-desc"
                limit={5000}
                rows={3}
                placeholder="Opcional"
                {...register('description')}
              />
            </FormField>

            <ModalActions
              onCancel={() => setModalOpen(false)}
              isPending={createMutation.isPending || updateMutation.isPending}
              submitLabel={editingGroup ? 'Salvar alterações' : 'Criar grupo'}
            />
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingGroup)}
        onClose={() => setDeletingGroup(null)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir grupo"
        description={`Tem certeza que deseja excluir o grupo "${deletingGroup?.name ?? ''}"?`}
        confirmLabel="Excluir grupo"
      />

      <Modal
        open={configModalOpen}
        onClose={() => { setConfigModalOpen(false); setConfigView('channels'); }}
        title={configView === 'channels' ? 'Configurar disparos' : 'Configurar WhatsApp'}
        description={configView === 'channels' ? 'Escolha o canal que deseja configurar.' : 'Selecione o tipo de WhatsApp que deseja configurar.'}
      >
        {configView === 'channels' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setConfigModalOpen(false);
                setConfigView('channels');
                navigate('/email-configs');
              }}
              className="flex flex-col items-start gap-3 rounded-xl border border-zinc-950/[0.08] bg-white p-4 text-left transition-colors hover:border-blue-500 hover:bg-blue-50/50 dark:border-white/[0.08] dark:bg-[#17171a] dark:hover:border-blue-400 dark:hover:bg-blue-950/20"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">E-mail</span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  Configurar remetentes/SMTP e acessar templates de e-mail.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setConfigView('whatsapp')}
              className="flex flex-col items-start gap-3 rounded-xl border border-zinc-950/[0.08] bg-white p-4 text-left transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-white/[0.08] dark:bg-[#17171a] dark:hover:border-emerald-400 dark:hover:bg-emerald-950/20"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M20.52 3.48A11.8 11.8 0 0 0 12.06 0C5.53 0 .21 5.32.21 11.85c0 2.09.55 4.13 1.59 5.93L.12 24l6.38-1.67a11.8 11.8 0 0 0 5.56 1.42h.01c6.53 0 11.85-5.32 11.85-11.85 0-3.17-1.23-6.14-3.4-8.42ZM12.07 21.75h-.01a9.82 9.82 0 0 1-5-1.37l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.82 9.82 0 0 1-1.51-5.24c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.96 2.89a9.77 9.77 0 0 1 2.88 6.95c0 5.42-4.41 9.83-9.79 9.83Zm5.39-7.36c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">WhatsApp</span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  Escolher entre WhatsApp oficial ou não oficial.
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button type="button" onClick={() => setConfigView('channels')} className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled
                className="flex cursor-not-allowed flex-col items-start gap-3 rounded-xl border border-zinc-950/[0.08] bg-zinc-50 p-4 text-left opacity-60 dark:border-white/[0.08] dark:bg-white/[0.02]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M20.52 3.48A11.8 11.8 0 0 0 12.06 0C5.53 0 .21 5.32.21 11.85c0 2.09.55 4.13 1.59 5.93L.12 24l6.38-1.67a11.8 11.8 0 0 0 5.56 1.42h.01c6.53 0 11.85-5.32 11.85-11.85 0-3.17-1.23-6.14-3.4-8.42ZM12.07 21.75h-.01a9.82 9.82 0 0 1-5-1.37l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.82 9.82 0 0 1-1.51-5.24c0-5.42 4.41-9.83 9.84-9.83 2.63 0 5.1 1.03 6.96 2.89a9.77 9.77 0 0 1 2.88 6.95c0 5.42-4.41 9.83-9.79 9.83Zm5.39-7.36c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.86.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" /></svg>
                </span>
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Oficial (Meta) <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-white/[0.08] dark:text-zinc-400">Bloqueado</span></span>
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">Remetentes e templates da API oficial do WhatsApp.</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setConfigModalOpen(false); setConfigView('channels'); navigate('/whatsapp-unofficial-instances'); }}
                className="flex flex-col items-start gap-3 rounded-xl border border-zinc-950/[0.08] bg-white p-4 text-left transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/[0.08] dark:bg-[#17171a] dark:hover:border-zinc-500 dark:hover:bg-white/[0.04]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-200">
                  <Settings className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Não oficial</span>
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">Instâncias e templates do seu microserviço WhatsApp.</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
