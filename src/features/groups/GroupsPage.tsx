import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import {
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGroupsQuery,
  useUpdateGroupMutation,
} from './hooks';
import { useSendingTemplatesQuery } from '@/src/features/templates/hooks';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField, inputClassName } from '@/src/components/common/FormField';
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
  const groupsQuery = useGroupsQuery();
  const templatesQuery = useSendingTemplatesQuery();
  const createMutation = useCreateGroupMutation();
  const updateMutation = useUpdateGroupMutation();
  const deleteMutation = useDeleteGroupMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const templates = templatesQuery.data ?? [];
  const templateById = useMemo(() => {
    const map = new Map<number, string>();
    for (const tpl of templates) map.set(tpl.id, tpl.name);
    return map;
  }, [templates]);

  const {
    register,
    handleSubmit,
    reset,
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

  const groups = groupsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Grupos
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Organize listas de envio e vincule cada grupo a um template de mensagem.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Novo grupo</span>
        </button>
      </div>

      {groupsQuery.isPending ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <TableRowsSkeleton rows={4} cols={4} />
        </div>
      ) : groupsQuery.isError ? (
        <ErrorState
          title="Erro ao carregar grupos"
          error={groupsQuery.error}
          onRetry={() => void groupsQuery.refetch()}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="h-5 w-5" />}
          title="Nenhum grupo cadastrado"
          description="Crie grupos para segmentar seus contatos e vincular templates de envio."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Criar primeiro grupo</span>
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Template vinculado</th>
                <th className="px-5 py-3">Criado em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                    {group.name}
                  </td>
                  <td className="max-w-xs truncate px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    {group.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                    {templateById.get(group.template_id) ?? `Template #${group.template_id}`}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {formatDate(group.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(group)}
                        aria-label={`Editar ${group.name}`}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingGroup(group)}
                        aria-label={`Excluir ${group.name}`}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Você ainda não possui templates de envio cadastrados. Crie um template primeiro para poder vinculá-lo a um grupo.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Fechar
              </button>
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
              <input
                id="group-name"
                type="text"
                placeholder="Ex.: Clientes Enterprise"
                className={inputClassName(Boolean(errors.name))}
                {...register('name')}
              />
            </FormField>

            <FormField
              label="Template de envio"
              htmlFor="group-template"
              required
              error={errors.template_id?.message}
            >
              <select
                id="group-template"
                className={inputClassName(Boolean(errors.template_id))}
                {...register('template_id', { valueAsNumber: true })}
              >
                <option value={0}>Selecione um template...</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Descrição" htmlFor="group-desc" error={errors.description?.message}>
              <textarea
                id="group-desc"
                rows={3}
                placeholder="Opcional"
                className={inputClassName(Boolean(errors.description))}
                {...register('description')}
              />
            </FormField>

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
                  : editingGroup
                    ? 'Salvar alterações'
                    : 'Criar grupo'}
              </button>
            </div>
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
