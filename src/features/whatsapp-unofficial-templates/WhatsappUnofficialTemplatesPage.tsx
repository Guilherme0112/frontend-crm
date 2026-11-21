import Button from '@mui/material/Button';
import { TableActionButton } from '@/src/components/common/TableActionButton';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil, PlugZap, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { useToast } from '@/src/components/common/Toast';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { ModalActions } from '@/src/components/common/ModalActions';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import type { WhatsappUnofficialTemplate } from '@/src/lib/types';
import { useCreateWhatsappUnofficialTemplateMutation, useDeleteWhatsappUnofficialTemplateMutation, useUpdateWhatsappUnofficialTemplateMutation, useWhatsappUnofficialTemplatesQuery } from './hooks';

type FormValues = { name: string; body: string; is_active: boolean };
const empty: FormValues = { name: '', body: '', is_active: true };

function TemplateForm({ initial, onSubmit, onCancel, submitting }: { initial?: WhatsappUnofficialTemplate | null; onSubmit: (v: FormValues) => Promise<void>; onCancel: () => void; submitting: boolean }) {
  const [v, setV] = useState<FormValues>(initial ? { name: initial.name, body: initial.body, is_active: initial.is_active } : empty);
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSubmit(v); }}>
      <FormField label="Nome do template" htmlFor="wut-name" required floatingLabel={false} dense>
        <input id="wut-name" className={inputClassName()} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required placeholder="Ex.: Boas-vindas" />
      </FormField>
      <FormField label="Corpo da mensagem" htmlFor="wut-body" required floatingLabel={false} dense hint="Variáveis suportadas: {{name}}, {{email}}, {{phone}}.">
        <textarea id="wut-body" className={inputClassName() + ' min-h-[140px] resize-y'} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} required placeholder="Olá {{name}}, tudo bem?" />
      </FormField>
      <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
        Template ativo
      </label>
      <ModalActions onCancel={onCancel} submitLabel="Salvar template" isPending={submitting} />
    </form>
  );
}

export function WhatsappUnofficialTemplatesPage() {
  const { toast } = useToast();
  const q = useWhatsappUnofficialTemplatesQuery();
  const createM = useCreateWhatsappUnofficialTemplateMutation();
  const updateM = useUpdateWhatsappUnofficialTemplateMutation();
  const deleteM = useDeleteWhatsappUnofficialTemplateMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WhatsappUnofficialTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsappUnofficialTemplate | null>(null);
  const items = q.data ?? [];

  const handleCreate = async (v: FormValues) => { try { await createM.mutateAsync(v); toast.success('Template criado'); setCreateOpen(false); } catch (e) { toast.error('Erro ao criar', getApiErrorMessage(e)); } };
  const handleUpdate = async (v: FormValues) => { if (!editTarget) return; try { await updateM.mutateAsync({ id: editTarget.id, payload: v }); toast.success('Template atualizado'); setEditTarget(null); } catch (e) { toast.error('Erro ao atualizar', getApiErrorMessage(e)); } };
  const handleDelete = async () => { if (!deleteTarget) return; try { await deleteM.mutateAsync(deleteTarget.id); toast.success('Template excluído'); setDeleteTarget(null); } catch (e) { toast.error('Erro ao excluir', getApiErrorMessage(e)); } };

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/disparos" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"><ArrowLeft className="h-3.5 w-3.5" />Disparos</Link>
          <p className="eyebrow mt-2 text-zinc-400 dark:text-zinc-500">Operação</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Templates WhatsApp Não Oficial</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">Crie mensagens de texto simples para usar nos disparos pelas instâncias não oficiais.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outlined" color="inherit" component={Link} to="/whatsapp-unofficial-instances" startIcon={<PlugZap className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>Instâncias</Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)} startIcon={<Plus className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>Novo template</Button>
        </div>
      </header>

      {q.isPending ? <div className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-[#17171a]"><TableRowsSkeleton rows={4} cols={4} /></div>
      : q.isError ? <ErrorState title="Erro ao carregar templates" error={q.error} onRetry={() => void q.refetch()} />
      : items.length === 0 ? <EmptyState icon={<FileText className="h-5 w-5" />} title="Nenhum template cadastrado" description="Crie um template simples para disparos não oficiais." action={<Button variant="contained" onClick={() => setCreateOpen(true)} startIcon={<Plus className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>Criar template</Button>} />
      : (
        <section className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="overflow-x-auto">
            <table className="min-w-full min-w-[680px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/[0.03] dark:text-zinc-400">
                <tr><th className="px-5 py-3 font-semibold">Nome</th><th className="px-5 py-3 font-semibold">Mensagem</th><th className="px-5 py-3 font-semibold">Ativo</th><th className="px-5 py-3 font-semibold text-right">Ações</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-100">{item.name}</td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300"><p className="max-w-[420px] truncate" title={item.body}>{item.body}</p></td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${item.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20' : 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.1]'}`}>{item.is_active ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1.5"><TableActionButton title="Editar" aria-label={`Editar ${item.name}`} tone="neutral" onClick={() => setEditTarget(item)}><Pencil className="h-4 w-4" /></TableActionButton><TableActionButton title="Excluir" aria-label={`Excluir ${item.name}`} tone="error" onClick={() => setDeleteTarget(item)}><Trash2 className="h-4 w-4" /></TableActionButton></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo template não oficial" description="Crie uma mensagem simples para envio por WhatsApp não oficial." size="lg"><TemplateForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitting={createM.isPending} /></Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar template" description="Atualize o conteúdo do template." size="lg"><TemplateForm key={editTarget?.id ?? 'edit'} initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} submitting={updateM.isPending} /></Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} isPending={deleteM.isPending} title="Excluir template" description={`Excluir "${deleteTarget?.name ?? ''}"? Essa ação não pode ser desfeita.`} confirmLabel="Excluir" />
    </div>
  );
}
