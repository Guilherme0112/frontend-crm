import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from './hooks';
import { useAuth } from '@/src/auth/AuthContext';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Pagination } from '@/src/components/common/Pagination';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { StatusIndicator } from '@/src/components/common/StatusBadge';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { PHONE_REGEX, maskPhone } from '@/src/lib/format';
import type { User } from '@/src/lib/types';

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo'),
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Use o formato (00) 00000-0000',
    }),
  is_active: z.boolean(),
});

const editUserSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo'),
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: 'A nova senha deve ter no mínimo 8 caracteres',
    }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Use o formato (00) 00000-0000',
    }),
  is_active: z.boolean(),
});

type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  is_active: boolean;
};

export function TeamPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const usersQuery = useUsersQuery(page);
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(editingUser ? editUserSchema : createUserSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', is_active: true },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    reset({ name: '', email: '', password: '', phone: '', is_active: true });
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    reset({
      name: u.name,
      email: u.email,
      password: '',
      phone: u.phone ?? '',
      is_active: u.is_active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          payload: {
            name: values.name.trim(),
            email: values.email.trim(),
            ...(values.password ? { password: values.password } : {}),
            phone: values.phone?.trim() || null,
            is_active: values.is_active,
          },
        });
        toast.success('Membro atualizado');
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password || '',
          phone: values.phone?.trim() || null,
          is_active: values.is_active,
        });
        toast.success('Membro adicionado à equipe');
      }
      setModalOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar usuário', getApiErrorMessage(error));
    }
  };

  const handleToggleActive = async (u: User) => {
    setTogglingId(u.id);
    try {
      await updateMutation.mutateAsync({
        id: u.id,
        payload: { is_active: !u.is_active },
      });
      toast.success(u.is_active ? 'Usuário desativado' : 'Usuário ativado');
    } catch (error) {
      toast.error('Erro ao alterar status', getApiErrorMessage(error));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deletingUser.id);
      toast.success('Usuário removido da equipe');
      setDeletingUser(null);
    } catch (error) {
      const msg = getApiErrorMessage(error);
      setDeleteError(msg);
      toast.error('Não foi possível remover', msg);
    }
  };

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta ?? null;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;

  // Remover o último membro de uma página deixa a página sem conteúdo.
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
            Equipe
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Gerencie os usuários da sua empresa, status de acesso e permissões.
          </p>
        </div>

        <Button variant="contained" startIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal} className="whitespace-nowrap shrink-0">
          Novo membro
        </Button>
      </div>

      {usersQuery.isPending ? (
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <TableRowsSkeleton rows={4} cols={5} />
        </div>
      ) : usersQuery.isError ? (
        <ErrorState
          title="Erro ao carregar equipe"
          error={usersQuery.error}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Nenhum usuário cadastrado"
          description="Adicione membros para colaborar na gestão dos leads e CRMs."
          action={
            <Button variant="contained" startIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
              Adicionar membro
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-950/[0.07] text-xs font-medium text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      <span>{u.name}</span>
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          (Você)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      {u.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <IconButton size="small" onClick={() => void handleToggleActive(u)} disabled={togglingId === u.id} title="Clique para alternar ativo/inativo">
                        <StatusIndicator
                          tone={u.is_active ? 'success' : 'neutral'}
                          label={u.is_active ? 'Ativo' : 'Inativo'}
                        />
                      </IconButton>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <IconButton size="small" onClick={() => openEditModal(u)} aria-label={`Editar ${u.name}`}>
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton size="small" onClick={() => { setDeleteError(null); setDeletingUser(u); }} aria-label={`Excluir ${u.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          ariaLabel="Paginação de usuários"
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Editar membro' : 'Novo membro da equipe'}
        description={
          editingUser
            ? 'Deixe a senha em branco para manter a atual.'
            : 'Cadastre um novo usuário vinculado à empresa.'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <FormField label="Nome completo" htmlFor="team-name" required error={errors.name?.message}>
            <TextInput
              id="team-name"
              type="text"
              placeholder="Carlos Mendes"
              hasError={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField label="E-mail" htmlFor="team-email" required error={errors.email?.message}>
            <TextInput
              id="team-email"
              type="email"
              placeholder="carlos@empresa.com.br"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label={editingUser ? 'Nova senha (opcional)' : 'Senha'}
              htmlFor="team-pass"
              required={!editingUser}
              hint="Mínimo de 8 caracteres"
              error={errors.password?.message}
            >
              <TextInput
                id="team-pass"
                type="password"
                placeholder="••••••••"
                hasError={Boolean(errors.password)}
                {...register('password')}
              />
            </FormField>

            <FormField label="Telefone" htmlFor="team-phone" error={errors.phone?.message}>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <TextInput
                    id="team-phone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    hasError={Boolean(errors.phone)}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>
          </div>

          <FormControlLabel
            control={<Checkbox size="small" {...register('is_active')} />}
            label="Usuário ativo"
            slotProps={{ typography: { sx: { fontSize: 14 } } }}
          />

          <div className="flex justify-end gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
            <Button variant="outlined" color="inherit" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="contained" disabled={createMutation.isPending || updateMutation.isPending} type="submit">
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : editingUser
                  ? 'Salvar alterações'
                  : 'Cadastrar membro'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingUser)}
        onClose={() => {
          setDeletingUser(null);
          setDeleteError(null);
        }}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        errorMessage={deleteError}
        title="Excluir usuário"
        description={`Tem certeza que deseja excluir o usuário "${deletingUser?.name ?? ''}"?`}
        confirmLabel="Excluir usuário"
      />
    </div>
  );
}
