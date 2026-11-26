import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
import { TableActionsMenu } from '@/src/components/common/TableActionsMenu';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Link2, PlugZap, RefreshCw, Trash2, Unplug, Plus, Pencil, QrCode } from 'lucide-react';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { useToast } from '@/src/components/common/Toast';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { ModalActions } from '@/src/components/common/ModalActions';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import type { WhatsappUnofficialInstance } from '@/src/lib/types';
import {
  useConnectWhatsappUnofficialInstanceMutation,
  useCreateWhatsappUnofficialInstanceMutation,
  useDeleteWhatsappUnofficialInstanceMutation,
  useDisconnectWhatsappUnofficialInstanceMutation,
  useRefreshWhatsappUnofficialInstanceStatusMutation,
  useUpdateWhatsappUnofficialInstanceMutation,
  useWhatsappUnofficialInstancesQuery,
} from './hooks';

type FormValues = {
  name: string;
  provider: string;
  instance_key: string;
  phone_number: string;
  is_active: boolean;
};

const emptyForm: FormValues = { name: '', provider: 'custom', instance_key: '', phone_number: '', is_active: true };

function statusLabel(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    connected: { label: 'Conectado', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20' },
    connecting: { label: 'Conectando', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20' },
    disconnected: { label: 'Desconectado', cls: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.1]' },
    error: { label: 'Erro', cls: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20' },
  };
  return map[status] ?? { label: status, cls: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.1]' };
}

function InstanceForm({ initial, onSubmit, onCancel, submitting }: { initial?: WhatsappUnofficialInstance | null; onSubmit: (v: FormValues) => Promise<void>; onCancel: () => void; submitting: boolean }) {
  const [v, setV] = useState<FormValues>(initial ? { name: initial.name, provider: initial.provider, instance_key: initial.instance_key, phone_number: initial.phone_number ?? '', is_active: initial.is_active } : emptyForm);
  const set = (k: keyof FormValues, val: string | boolean) => setV((p) => ({ ...p, [k]: val }));

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void onSubmit(v); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome" htmlFor="wui-name" required floatingLabel={false} dense>
          <input id="wui-name" maxLength={255} className={inputClassName()} value={v.name} onChange={(e) => set('name', e.target.value)} required placeholder="Ex.: WhatsApp principal" />
        </FormField>
        <FormField label="Instance Key" htmlFor="wui-key" required floatingLabel={false} dense>
          <input id="wui-key" maxLength={255} className={inputClassName()} value={v.instance_key} onChange={(e) => set('instance_key', e.target.value)} required placeholder="Ex.: crm-principal" />
        </FormField>
      </div>

      <FormField label="Telefone (opcional)" htmlFor="wui-phone" floatingLabel={false} dense hint="Número conectado à instância, se aplicável.">
        <input id="wui-phone" maxLength={30} className={inputClassName()} value={v.phone_number} onChange={(e) => set('phone_number', e.target.value)} placeholder="Ex.: 5511999999999" />
      </FormField>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" checked={v.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
        Instância ativa
      </label>

      <ModalActions onCancel={onCancel} submitLabel="Salvar instância" isPending={submitting} />
    </form>
  );
}

export function WhatsappUnofficialInstancesPage() {
  const { toast } = useToast();
  const q = useWhatsappUnofficialInstancesQuery();
  const createM = useCreateWhatsappUnofficialInstanceMutation();
  const updateM = useUpdateWhatsappUnofficialInstanceMutation();
  const deleteM = useDeleteWhatsappUnofficialInstanceMutation();
  const connectM = useConnectWhatsappUnofficialInstanceMutation();
  const disconnectM = useDisconnectWhatsappUnofficialInstanceMutation();
  const statusM = useRefreshWhatsappUnofficialInstanceStatusMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WhatsappUnofficialInstance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsappUnofficialInstance | null>(null);
  const [qr, setQr] = useState<{ name: string; qr?: string | null; message?: string | null } | null>(null);

  const items = q.data ?? [];

  const handleCreate = async (v: FormValues) => {
    try { await createM.mutateAsync({ name: v.name, provider: v.provider, instance_key: v.instance_key, phone_number: v.phone_number || null, is_active: v.is_active }); toast.success('Instância criada'); setCreateOpen(false); }
    catch (e) { toast.error('Erro ao criar', getApiErrorMessage(e)); }
  };
  const handleUpdate = async (v: FormValues) => {
    if (!editTarget) return;
    try {
      await updateM.mutateAsync({ id: editTarget.id, payload: { name: v.name, provider: v.provider, instance_key: v.instance_key, phone_number: v.phone_number || null, is_active: v.is_active } });
      toast.success('Instância atualizada'); setEditTarget(null);
    } catch (e) { toast.error('Erro ao atualizar', getApiErrorMessage(e)); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteM.mutateAsync(deleteTarget.id); toast.success('Instância excluída'); setDeleteTarget(null); }
    catch (e) { toast.error('Erro ao excluir', getApiErrorMessage(e)); }
  };
  const handleConnect = async (item: WhatsappUnofficialInstance) => {
    try {
      const res = await connectM.mutateAsync(item.id);
      setQr({ name: item.name, qr: res.meta.qr_code, message: res.meta.message ?? `Status: ${res.data.status}` });
      toast.success('Conexão iniciada', res.meta.message ?? undefined);
    } catch (e) { toast.error('Erro ao conectar', getApiErrorMessage(e)); }
  };
  const handleDisconnect = async (item: WhatsappUnofficialInstance) => {
    try { await disconnectM.mutateAsync(item.id); toast.success('Instância desconectada'); }
    catch (e) { toast.error('Erro ao desconectar', getApiErrorMessage(e)); }
  };

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/disparos" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"><ArrowLeft className="h-3.5 w-3.5" />Disparos</Link>
          <p className="eyebrow mt-2 text-zinc-400 dark:text-zinc-500">Operação</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">WhatsApp Não Oficial</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">Gerencie as instâncias do seu microserviço WhatsApp, conecte por QR Code e use nos disparos.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outlined" color="inherit" component={Link} to="/whatsapp-unofficial-templates" startIcon={<FileText className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>Templates</Button>
          <ActionButton onClick={() => setCreateOpen(true)} startIcon={<Plus className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>Nova instância</ActionButton>
        </div>
      </header>

      {q.isPending ? <div className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-[#17171a]"><TableRowsSkeleton rows={4} cols={5} /></div>
      : q.isError ? <ErrorState title="Erro ao carregar instâncias" error={q.error} onRetry={() => void q.refetch()} />
      : items.length === 0 ? <EmptyState icon={<PlugZap className="h-5 w-5" />} title="Nenhuma instância cadastrada" description="Cadastre uma instância do seu microserviço para habilitar disparos não oficiais." action={<ActionButton onClick={() => setCreateOpen(true)} startIcon={<Plus className="h-4 w-4" />} sx={{ width: { xs: '100%', sm: 'auto' } }}>Criar instância</ActionButton>} />
      : (
        <section className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="overflow-x-auto">
            <table className="min-w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/[0.03] dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Instância</th>
                  <th className="px-5 py-3 font-semibold">Chave / URL</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Ativa</th>
                  <th className="px-5 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                {items.map((item) => {
                  const st = statusLabel(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</div>
                        {item.phone_number ? <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{item.phone_number}</div> : null}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{item.instance_key}</div>
                        <div className="mt-0.5 max-w-[260px] truncate text-xs text-zinc-500 dark:text-zinc-400" title={item.base_url}>{item.base_url}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">{item.is_active ? 'Sim' : 'Não'}</td>
                      <td className="px-5 py-4 text-right">
                        <TableActionsMenu
                          label={`Ações de ${item.name}`}
                          actions={[
                            {
                              label: 'Atualizar status',
                              icon: <RefreshCw className="h-4 w-4" />,
                              onClick: () => { void statusM.mutateAsync(item.id).then(() => toast.success('Status atualizado')).catch((e) => toast.error('Erro ao atualizar status', getApiErrorMessage(e))); },
                            },
                            {
                              label: 'Conectar / QR Code',
                              icon: <QrCode className="h-4 w-4" />,
                              onClick: () => void handleConnect(item),
                            },
                            {
                              label: 'Desconectar',
                              icon: <Unplug className="h-4 w-4" />,
                              onClick: () => void handleDisconnect(item),
                            },
                            {
                              label: 'Editar',
                              icon: <Pencil className="h-4 w-4" />,
                              onClick: () => setEditTarget(item),
                            },
                            {
                              label: 'Excluir',
                              icon: <Trash2 className="h-4 w-4" />,
                              tone: 'danger',
                              onClick: () => setDeleteTarget(item),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova instância WhatsApp não oficial" description="Cadastre os dados de conexão do seu microserviço." size="lg">
        <InstanceForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitting={createM.isPending} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar instância" description="Atualize os dados da instância." size="lg">
        <InstanceForm key={editTarget?.id ?? 'edit'} initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} submitting={updateM.isPending} />
      </Modal>
      <Modal open={!!qr} onClose={() => setQr(null)} title={`Conexão: ${qr?.name ?? ''}`} description="Escaneie o QR Code no WhatsApp para conectar a instância." size="md">
        <div className="space-y-4">
          {qr?.message ? <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300">{qr.message}</div> : null}
          {qr?.qr ? (
            qr.qr.startsWith('data:image')
              ? <div className="flex justify-center rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/[0.08] dark:bg-zinc-950"><img src={qr.qr} alt="QR Code WhatsApp" className="max-h-80 w-auto rounded-lg" /></div>
              : <div className="break-all rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300">{qr.qr}</div>
          ) : <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum QR Code retornado. Verifique o status da instância ou tente atualizar.</p>}
          <div className="flex justify-end">
            <Button variant="outlined" color="inherit" onClick={() => setQr(null)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Fechar</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} isPending={deleteM.isPending} title="Excluir instância" description={`Excluir "${deleteTarget?.name ?? ''}"? Essa ação não pode ser desfeita.`} confirmLabel="Excluir" />
    </div>
  );
}
