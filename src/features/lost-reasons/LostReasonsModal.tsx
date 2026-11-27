import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Plus, Trash2 } from 'lucide-react';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { FormField } from '@/src/components/common/FormField';
import { Modal } from '@/src/components/common/Modal';
import { ModalActions } from '@/src/components/common/ModalActions';
import { TableActionsMenu } from '@/src/components/common/TableActionsMenu';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { TextInput } from '@/src/components/common/TextInput';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import type { LostReason } from '@/src/lib/types';
import {
  useCreateLostReasonMutation,
  useDeleteLostReasonMutation,
  useLostReasonsQuery,
  useUpdateLostReasonMutation,
} from './hooks';

const schema = z.object({
  name: z.string().trim().min(2, 'Informe o motivo'),
});

type FormValues = z.infer<typeof schema>;

/**
 * Cadastro dos motivos de perda da empresa.
 *
 * Eles são por **empresa**, não por pipeline: o mesmo "Preço" vale para todos
 * os funis, e duplicá-los por CRM tornaria a análise de causa incomparável.
 *
 * **Modal e não página.** É cadastro que se mexe uma vez e se esquece — uma
 * rota própria e um lugar no menu lateral custariam atenção permanente por
 * algo que se usa duas vezes por ano. Mora na tela de CRMs, que é de onde se
 * configura o funil.
 */
export function LostReasonsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const reasonsQuery = useLostReasonsQuery();
  const createMutation = useCreateLostReasonMutation();
  const updateMutation = useUpdateLostReasonMutation();
  const deleteMutation = useDeleteLostReasonMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LostReason | null>(null);
  const [deleting, setDeleting] = useState<LostReason | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '' });
    setFormOpen(true);
  };

  const openEdit = (reason: LostReason) => {
    setEditing(reason);
    reset({ name: reason.name });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: { name: values.name.trim() } });
        toast.success('Motivo atualizado');
      } else {
        await createMutation.mutateAsync({ name: values.name.trim() });
        toast.success('Motivo criado');
      }
      setFormOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar motivo', getApiErrorMessage(error));
    }
  };

  const toggleActive = async (reason: LostReason) => {
    try {
      await updateMutation.mutateAsync({ id: reason.id, payload: { is_active: !reason.is_active } });
    } catch (error) {
      toast.error('Erro ao alterar o motivo', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleting) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success('Motivo excluído');
      setDeleting(null);
    } catch (error) {
      toast.error('Erro ao excluir motivo', getApiErrorMessage(error));
    }
  };

  const reasons = reasonsQuery.data ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Motivos de perda"
      description="O que você escolhe ao mover um lead para uma etapa de perda. Sem motivos próprios tudo cai em Outro, e a análise de causa do funil não ensina nada."
      size="lg"
    >
      <div className="space-y-4">
        {/*
          Formulário embutido em vez de uma segunda modal por cima desta:
          empilhar diálogos para digitar uma palavra enterra o contexto que
          o usuário veio consultar.
        */}
        {formOpen ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 rounded-xl border border-zinc-950/[0.07] bg-zinc-50 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]"
          >
            <FormField
              label={editing ? `Renomear "${editing.name}"` : 'Novo motivo'}
              htmlFor="reason-name"
              required
              error={errors.name?.message}
            >
              <TextInput
                id="reason-name"
                type="text"
                limit={255}
                placeholder="Ex.: Preço, Sem resposta, Comprou do concorrente"
                {...register('name')}
              />
            </FormField>

            <ModalActions
              onCancel={() => setFormOpen(false)}
              isPending={createMutation.isPending || updateMutation.isPending}
              submitLabel={editing ? 'Salvar' : 'Criar motivo'}
            />
          </form>
        ) : (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={openCreate}
              startIcon={<Plus className="h-4 w-4" />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Novo motivo
            </Button>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          {reasonsQuery.isPending ? (
            <div className="p-6">
              <TableRowsSkeleton rows={4} cols={3} />
            </div>
          ) : reasonsQuery.isError ? (
            <div className="p-6">
              <ErrorState
                title="Erro ao carregar os motivos"
                error={reasonsQuery.error}
                onRetry={() => void reasonsQuery.refetch()}
              />
            </div>
          ) : reasons.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Nenhum motivo cadastrado"
                description="Cadastre os motivos que a sua equipe usa de verdade: Preço, Sem resposta, Comprou do concorrente."
              />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
              {reasons.map((reason) => (
                <li key={reason.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {reason.name}
                      {reason.is_default && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                          <Lock className="h-3 w-3" />
                          padrão
                        </span>
                      )}
                    </p>
                    {reason.is_default && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Recebe as perdas sem motivo escolhido. Não pode ser excluído nem desativado.
                      </p>
                    )}
                  </div>

                  {/*
                    Desativar some com o motivo do seletor mas preserva o que já
                    foi registrado com ele. Excluir é que levaria o histórico
                    junto, e por isso só faz sentido para motivo sem uso.
                  */}
                  <Switch
                    size="small"
                    checked={reason.is_active}
                    disabled={reason.is_default || updateMutation.isPending}
                    onChange={() => void toggleActive(reason)}
                    slotProps={{ input: { 'aria-label': `Motivo ${reason.name} ativo` } }}
                  />

                  <TableActionsMenu
                    label={`Ações do motivo ${reason.name}`}
                    actions={[
                      {
                        label: 'Renomear',
                        disabled: reason.is_default,
                        onClick: () => openEdit(reason),
                      },
                      {
                        label: 'Excluir',
                        icon: <Trash2 className="h-4 w-4" />,
                        disabled: reason.is_default,
                        tone: 'danger',
                        onClick: () => setDeleting(reason),
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>


        <ConfirmDialog
          open={Boolean(deleting)}
          onClose={() => setDeleting(null)}
          onConfirm={() => void handleDelete()}
          isPending={deleteMutation.isPending}
          title="Excluir motivo"
          description={`Tem certeza que deseja excluir "${deleting?.name ?? ''}"? Se ele já foi usado em alguma perda, prefira desativar: excluir apagaria essa informação do histórico.`}
          confirmLabel="Excluir motivo"
        />
      </div>
    </Modal>
  );
}
