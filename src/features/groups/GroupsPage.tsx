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
import { Mail, Pencil, Plus, Trash2, Users, UsersRound } from 'lucide-react';
import {
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGroupsQuery,
  useUpdateGroupMutation,
} from './hooks';
import { useSendingTemplatesQuery } from '@/src/features/templates/hooks';
import { useEmailConfigsInfiniteQuery } from '@/src/features/email-configs/hooks';
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
  email_config_id: z.number().int().min(0).optional(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

export function GroupsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const groupsQuery = useGroupsQuery(page);
  const templatesQuery = useSendingTemplatesQuery(1, 100);
  const emailConfigsQuery = useEmailConfigsInfiniteQuery();
  const createMutation = useCreateGroupMutation();
  const updateMutation = useUpdateGroupMutation();
  const deleteMutation = useDeleteGroupMutation();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const templates = templatesQuery.data?.data ?? [];
  const emailConfigs = emailConfigsQuery.items ?? [];
  const templateById = useMemo(() => {
    const map = new Map<number, string>();
    for (const tpl of templates) map.set(tpl.id, tpl.name);
    return map;
  }, [templates]);
  const emailConfigById = useMemo(() => {
    const map = new Map<number, string>();
    for (const cfg of emailConfigs) map.set(cfg.id, cfg.name);
    return map;
  }, [emailConfigs]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', description: '', template_id: 0, email_config_id: 0 },
  });

  const openCreateModal = () => {
    setEditingGroup(null);
    reset({
      name: '',
      description: '',
      template_id: templates[0]?.id ?? 0,
      email_config_id: 0,
    });
    setModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    reset({
      name: group.name,
      description: group.description ?? '',
      template_id: group.template_id,
      email_config_id: group.email_config_id ?? 0,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: GroupFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      template_id: values.template_id,
      email_config_id: values.email_config_id && values.email_config_id > 0 ? values.email_config_id : null,
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Grupos
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Organize listas de envio e vincule cada grupo a um template de mensagem.
          </p>
        </div>

        <ActionButton
          type="button"
          onClick={openCreateModal}
          className="whitespace-nowrap shrink-0"
          startIcon={<Plus className="h-4 w-4" />}
        >
          Novo grupo
        </ActionButton>
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
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-950/[0.07] text-xs font-medium text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Template vinculado</th>
                <th className="px-5 py-3">SMTP</th>
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
                    navigate(`/groups/${group.id}`);
                  }}
                  className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                >
                  <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <Link
                      to={`/groups/${group.id}`}
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
                  <td className="px-5 py-3.5">
                    {group.email_config_id ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                        <Mail className="h-3 w-3 shrink-0 text-zinc-400" strokeWidth={1.8} />
                        SMTP: {emailConfigById.get(group.email_config_id) ?? `Config #${group.email_config_id}`}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {formatDate(group.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        to={`/groups/${group.id}`}
                        aria-label={`Gerenciar leads de ${group.name}`}
                        title="Gerenciar leads do grupo"
                        className="inline-flex items-center justify-center rounded-lg bg-zinc-950/[0.05] p-1.5 text-zinc-500 transition-colors hover:bg-zinc-950/[0.1] hover:text-zinc-900 dark:bg-white/[0.05] dark:text-zinc-400 dark:hover:bg-white/[0.1] dark:hover:text-zinc-100"
                      >
                        <Users className="h-4 w-4" strokeWidth={1.8} />
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
        <Pagination
          page={meta?.current_page ?? page}
          lastPage={lastPage}
          total={total}
          from={meta?.from ?? null}
          to={meta?.to ?? null}
          onPageChange={setPage}
          ariaLabel="Paginação de grupos"
        />
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

            <FormField
              label="Configuração de email (SMTP)"
              htmlFor="group-email-config"
              hint="Opcional · usada para enviar os templates deste grupo"
              error={errors.email_config_id?.message}
            >
              <Controller
                name="email_config_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    id="group-email-config"
                    value={field.value && field.value > 0 ? String(field.value) : ''}
                    onChange={(v) => field.onChange(v === '' ? 0 : Number(v))}
                    placeholder="Sem configuração (opcional)"
                    emptyLabel="Nenhuma configuração"
                    emptyMessage="Nenhuma configuração encontrada"
                    hasError={Boolean(errors.email_config_id)}
                    options={emailConfigs.map((cfg) => ({
                      value: String(cfg.id),
                      label: cfg.name,
                      description: cfg.host,
                    }))}
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
    </div>
  );
}
