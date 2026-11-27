import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { CircleCheck, Pencil, Plus, Trash2, UserCog, Users } from 'lucide-react';
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from './hooks';
import { useAuth } from '@/src/auth/AuthContext';
import { Modal } from '@/src/components/common/Modal';
import { TableActionsMenu } from '@/src/components/common/TableActionsMenu';
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
import { cn } from '@/src/lib/cn';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { PHONE_MAX_LENGTH, PHONE_REGEX, maskPhone } from '@/src/lib/format';
import type { User } from '@/src/lib/types';
import { PageHeader } from '@/src/components/layout/PageHeader';

const userFormSchema = z
  .object({
    isEdit: z.boolean(),
    name: z.string().trim().min(2, 'Informe o nome completo'),
    email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
    password: z.string(),
    password_confirmation: z.string(),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || PHONE_REGEX.test(val), {
        message: 'Use o formato +55 (00) 00000-0000',
      }),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const hasPassword = data.password.length > 0;
    const passwordRequired = !data.isEdit || hasPassword;

    if (passwordRequired && data.password.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: data.isEdit
          ? 'A nova senha deve ter no mínimo 8 caracteres'
          : 'A senha deve ter no mínimo 8 caracteres',
      });
    }

    if (!data.isEdit && !hasPassword) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Informe a senha' });
    }

    if (passwordRequired && !data.password_confirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['password_confirmation'],
        message: 'Confirme a senha',
      });
    }

    if (data.password_confirmation && data.password !== data.password_confirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['password_confirmation'],
        message: 'As senhas não conferem',
      });
    }
  });

type UserFormValues = z.infer<typeof userFormSchema>;

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
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      isEdit: false,
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (editingUser) {
      reset({
        isEdit: true,
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        password_confirmation: '',
        phone: editingUser.phone ?? '',
        is_active: editingUser.is_active,
      });
    } else {
      reset({
        isEdit: false,
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
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
    const hasPassword = values.password.length > 0;

    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          payload: {
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
            phone: values.phone?.trim() || null,
            ...(hasPassword
              ? {
                  password: values.password,
                  password_confirmation: values.password_confirmation,
                }
              : {}),
            is_active: values.is_active,
          },
        });
        toast.success('Membro atualizado');
      } else {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          password_confirmation: values.password_confirmation,
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

  const passwordValue = watch('password') ?? '';
  const confirmationValue = watch('password_confirmation') ?? '';
  const isActive = watch('is_active') ?? true;
  const showPasswordRules = !editingUser || passwordValue.length > 0;
  const passwordRules = [
    { label: 'Mínimo de 8 caracteres', done: passwordValue.length >= 8 },
    {
      label: 'Senha e confirmação iguais',
      done: passwordValue.length > 0 && passwordValue === confirmationValue,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configurações"
        title="Equipe"
        description="Gerencie os usuários vinculados à sua empresa."
        actions={
          <>
            <Button
              component={Link}
              to="/team/dashboard"
              variant="outlined"
              color="inherit"
              startIcon={<UserCog className="h-4 w-4" />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Dashboard
            </Button>
            <ActionButton type="button" onClick={openCreate} startIcon={<Plus className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Novo membro
            </ActionButton>
          </>
        }
      />

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
              <ActionButton type="button" onClick={openCreate} startIcon={<Plus className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                Novo membro
              </ActionButton>
            }
          />
        )}

        {users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
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
                    <td className="px-5 py-3 text-right">
                      <TableActionsMenu
                        label={`Ações de ${user.name}`}
                        actions={[
                          {
                            label: 'Editar',
                            icon: <Pencil className="h-4 w-4" />,
                            onClick: () => openEdit(user),
                          },
                          {
                            label: 'Excluir',
                            icon: <Trash2 className="h-4 w-4" />,
                            tone: 'danger',
                            disabled: currentUser?.id === user.id,
                            onClick: () => setDeletingUser(user),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
        <Pagination
          page={page}
          lastPage={meta?.last_page ?? 1}
          total={meta?.total ?? 0}
          from={meta?.from ?? null}
          to={meta?.to ?? null}
          onPageChange={setPage}
          ariaLabel="Paginação da equipe"
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Editar membro' : 'Novo membro da equipe'}
        size="lg"
        description={
          editingUser
            ? 'Deixe a senha em branco para manter a atual. Se preencher, confirme a nova senha.'
            : 'Cadastre um novo usuário vinculado à empresa. A confirmação de senha é obrigatória.'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <section aria-labelledby="team-section-identity">
            <div className="mb-4">
              <p id="team-section-identity" className="eyebrow text-zinc-500 dark:text-zinc-400">
                Dados do membro
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Nome, e-mail de acesso e telefone para contato.
              </p>
            </div>

            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <FormField label="Nome completo" htmlFor="team-name" required error={errors.name?.message} dense>
                <TextInput
                  id="team-name"
                  type="text"
                  limit={255}
                  placeholder="Carlos Mendes"
                  autoComplete="name"
                  hasError={Boolean(errors.name)}
                  {...register('name')}
                />
              </FormField>

              <FormField label="E-mail" htmlFor="team-email" required error={errors.email?.message} dense>
                <TextInput
                  id="team-email"
                  type="email"
                  limit={255}
                  placeholder="carlos@empresa.com.br"
                  autoComplete="email"
                  hasError={Boolean(errors.email)}
                  {...register('email')}
                />
              </FormField>

              <div className="sm:col-span-2 sm:max-w-xs">
                <FormField label="Telefone" htmlFor="team-phone" error={errors.phone?.message} dense>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <TextInput
                        id="team-phone"
                        type="tel"
                        limit={PHONE_MAX_LENGTH}
                        placeholder="+55 (11) 98765-4321"
                        autoComplete="tel"
                        hasError={Boolean(errors.phone)}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormField>
              </div>
            </div>
          </section>

          <div className="h-px bg-zinc-950/[0.06] dark:bg-white/[0.06]" />

          <section aria-labelledby="team-section-access">
            <div className="mb-4">
              <p id="team-section-access" className="eyebrow text-zinc-500 dark:text-zinc-400">
                Acesso e senha
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {editingUser
                  ? 'Em branco mantém a senha atual. Para trocar, preencha os dois campos.'
                  : 'Defina a senha de acesso e confirme antes de salvar.'}
              </p>
            </div>

            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <FormField
                label={editingUser ? 'Nova senha' : 'Senha'}
                htmlFor="team-pass"
                required={!editingUser}
                error={errors.password?.message}
                dense
              >
                <TextInput
                  id="team-pass"
                  passwordToggle
                  limit={255}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  hasError={Boolean(errors.password)}
                  {...register('password')}
                />
              </FormField>

              <FormField
                label={editingUser ? 'Confirmar nova senha' : 'Confirmar senha'}
                htmlFor="team-pass-confirmation"
                required={!editingUser}
                error={errors.password_confirmation?.message}
                dense
              >
                <TextInput
                  id="team-pass-confirmation"
                  passwordToggle
                  limit={255}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  hasError={Boolean(errors.password_confirmation)}
                  {...register('password_confirmation')}
                />
              </FormField>
            </div>

            {showPasswordRules && (
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                {passwordRules.map((rule) => (
                  <li key={rule.label} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <CircleCheck
                      className={`h-3.5 w-3.5 ${
                        rule.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-300 dark:text-zinc-600'
                      }`}
                    />
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}

            <div
              className={cn(
                'mt-4 flex items-center justify-between gap-4 rounded-xl border px-3.5 py-3 transition-colors',
                isActive
                  ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]'
                  : 'border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.02]',
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <CircleCheck
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500',
                  )}
                  strokeWidth={1.8}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Usuário ativo</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Inativos não conseguem entrar.</p>
                </div>
              </div>
              <FormControlLabel
                control={<Switch size="small" color="primary" {...register('is_active')} />}
                label={
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400',
                    )}
                  >
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                }
                labelPlacement="start"
                sx={{ m: 0, gap: 0.5 }}
              />
            </div>
          </section>

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
