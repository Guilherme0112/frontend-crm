import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
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
import { TableActionButton } from '@/src/components/common/TableActionButton';
import ActionButton from '@/src/components/common/Button';
import { ModalActions } from '@/src/components/common/ModalActions';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
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
      message: 'A senha deve ter no mínimo 8 caracteres',
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

type UserFormValues = z.infer<typeof createUserSchema>;

export function TeamPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const usersQuery = useUsersQuery(page);
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (editingUser) {
      reset({
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        phone: editingUser.phone ?? '',
        is_active: editingUser.is_active,
      });
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        phone: '',
        is_active: true,
      });
    }
  }, [editingUser, reset]);

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          payload: {
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
            phone: values.phone?.trim() || null,
            password: values.password || undefined,
            is_active: values.is_active,
          },
        });
        toast.success('Membro atualizado');
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          phone: values.phone?.trim() || null,
          is_active: values.is_active,
        });
        toast.success('Membro criado');
      }
      setModalOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar membro', getApiErrorMessage(error));
    }
  };

  const onDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteMutation.mutateAsync(deletingUser.id);
      toast.success('Membro excluído');
      setDeletingUser(null);
    } catch (error) {
      toast.error('Erro ao excluir membro', getApiErrorMessage(error));
    }
  };

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Equipe
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Gerencie os usuários vinculados à sua empresa.
          </p>
        </div>
        <ActionButton type="button" onClick={openCreate} startIcon={<Plus className="h-4 w-4" />}>
          Novo membro
        </ActionButton>
      </div>

      <section className="overflow-hidden rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
        {usersQuery.isLoading && (
          <div className="p-6">
            <TableRowsSkeleton rows={5} />
          </div>
        )}

        {usersQuery.isError && (
          <div className="p-6">
            <ErrorState
              title="Não foi possível carregar a equipe"
              error={usersQuery.error}
              onRetry={() => void usersQuery.refetch()}
            />
          </div>
        )}

        {usersQuery.isSuccess && users.length === 0 && (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Nenhum membro encontrado"
            description="Adicione membros para compartilhar o acesso ao CRM."
            action={
              <ActionButton type="button" onClick={openCreate} startIcon={<Plus className="h-4 w-4" />}>
                Novo membro
              </ActionButton>
            }
          />
        )}

        {users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-950/[0.07] bg-[#fafaf9] text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[0.07] dark:bg-[#101012] dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">E-mail</th>
                  <th className="px-5 py-3 font-medium">Telefone</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#fafaf9] dark:hover:bg-[#101012]">
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {user.name}
                      {currentUser?.id === user.id && (
                        <span className="ml-2 text-xs text-zinc-400">(você)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                      {user.phone ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusIndicator
                        tone={user.is_active ? 'success' : 'neutral'}
                        label={user.is_active ? 'Ativo' : 'Inativo'}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <TableActionButton tone="primary" aria-label="Editar" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </TableActionButton>
                        <TableActionButton
                          tone="error"
                          aria-label="Excluir"
                          disabled={currentUser?.id === user.id}
                          onClick={() => setDeletingUser(user)}
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
      </section>

      <Pagination
        page={page}
        lastPage={meta?.last_page ?? 1}
        total={meta?.total ?? 0}
        from={meta?.from ?? null}
        to={meta?.to ?? null}
        onPageChange={setPage}
        ariaLabel="Paginação da equipe"
      />

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
              limit={255}
              placeholder="Carlos Mendes"
              hasError={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField label="E-mail" htmlFor="team-email" required error={errors.email?.message}>
            <TextInput
              id="team-email"
              type="email"
              limit={255}
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
                limit={255}
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
                    limit={15}
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

          <ModalActions
            onCancel={() => setModalOpen(false)}
            isPending={createMutation.isPending || updateMutation.isPending}
            pendingLabel="Salvando..."
            submitLabel="Salvar"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingUser)}
        title="Excluir membro"
        description={`Deseja excluir ${deletingUser?.name ?? 'este membro'}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isPending={deleteMutation.isPending}
        onConfirm={() => void onDelete()}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
