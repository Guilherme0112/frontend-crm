import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Plus,
  QrCode,
  Star,
  Trash2,
} from 'lucide-react';
import {
  useCancelSubscriptionMutation,
  useCreatePaymentMethodMutation,
  useCreateSubscriptionMutation,
  useDeletePaymentMethodMutation,
  usePaymentMethodsQuery,
  usePlansQuery,
  useSetDefaultPaymentMethodMutation,
  useSubscriptionsQuery,
} from './hooks';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { CardsGridSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import {
  StatusIndicator,
  getSubscriptionStatusMeta,
} from '@/src/components/common/StatusBadge';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage, getApiStatus } from '@/src/lib/formErrors';
import { formatCurrency, formatDate } from '@/src/lib/format';
import type { PaymentMethod, PaymentMethodType, Plan, Subscription } from '@/src/lib/types';

const paymentMethodSchema = z
  .object({
    type: z.enum(['card', 'pix', 'boleto']),
    brand: z.string().trim().optional(),
    last4: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^\d{4}$/.test(val), {
        message: 'Informe exatamente 4 dígitos',
      }),
    holder_name: z.string().trim().optional(),
    is_default: z.boolean(),
  })
  .refine((val) => val.type !== 'card' || Boolean(val.last4 && val.last4.length === 4), {
    path: ['last4'],
    message: 'Informe os 4 últimos dígitos do cartão',
  });

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>;

function getPaymentMethodLabel(type: PaymentMethodType): string {
  switch (type) {
    case 'card':
      return 'Cartão';
    case 'pix':
      return 'Pix';
    case 'boleto':
      return 'Boleto';
  }
}

export function BillingPage() {
  const { toast } = useToast();
  const plansQuery = usePlansQuery();
  const subscriptionsQuery = useSubscriptionsQuery();
  const paymentMethodsQuery = usePaymentMethodsQuery();

  const createSubMutation = useCreateSubscriptionMutation();
  const cancelSubMutation = useCancelSubscriptionMutation();
  const createPmMutation = useCreatePaymentMethodMutation();
  const deletePmMutation = useDeletePaymentMethodMutation();
  const setDefaultPmMutation = useSetDefaultPaymentMethodMutation();

  const [selectedPlanToSubscribe, setSelectedPlanToSubscribe] = useState<Plan | null>(null);
  const [chosenPaymentMethodId, setChosenPaymentMethodId] = useState<string>('');
  const [subscribeConflictMsg, setSubscribeConflictMsg] = useState<string | null>(null);
  const [cancelingSub, setCancelingSub] = useState<Subscription | null>(null);
  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [deletingPm, setDeletingPm] = useState<PaymentMethod | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'card',
      brand: '',
      last4: '',
      holder_name: '',
      is_default: true,
    },
  });

  const watchedPmType = watch('type');

  const plans = plansQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];
  const paymentMethods = paymentMethodsQuery.data ?? [];

  const planById = useMemo(() => {
    const map = new Map<number, Plan>();
    for (const p of plans) map.set(p.id, p);
    return map;
  }, [plans]);

  const activeSubscription = useMemo(
    () =>
      subscriptions.find((s) => s.status === 'active' || s.status === 'trialing') ?? null,
    [subscriptions],
  );

  const openSubscribeModal = (plan: Plan) => {
    setSubscribeConflictMsg(null);
    const defaultPm = paymentMethods.find((pm) => pm.is_default) ?? paymentMethods[0];
    setChosenPaymentMethodId(defaultPm ? String(defaultPm.id) : '');
    setSelectedPlanToSubscribe(plan);
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPlanToSubscribe) return;
    setSubscribeConflictMsg(null);
    try {
      await createSubMutation.mutateAsync({
        plan_id: selectedPlanToSubscribe.id,
        payment_method_id: chosenPaymentMethodId ? Number(chosenPaymentMethodId) : null,
      });
      toast.success(
        'Assinatura ativada',
        'A primeira fatura foi gerada e já está disponível em Faturas.',
      );
      setSelectedPlanToSubscribe(null);
    } catch (error) {
      const status = getApiStatus(error);
      const apiMsg = getApiErrorMessage(error);
      if (status === 409) {
        const friendly = `Cancele seu plano atual antes de assinar outro. (${apiMsg})`;
        setSubscribeConflictMsg(friendly);
        toast.error('Assinatura ativa existente', apiMsg);
      } else {
        toast.error('Erro ao contratar plano', apiMsg);
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelingSub) return;
    try {
      await cancelSubMutation.mutateAsync(cancelingSub.id);
      toast.success('Assinatura cancelada');
      setCancelingSub(null);
    } catch (error) {
      toast.error('Erro ao cancelar assinatura', getApiErrorMessage(error));
    }
  };

  const onCreatePaymentMethod = async (values: PaymentMethodFormValues) => {
    try {
      await createPmMutation.mutateAsync({
        type: values.type,
        brand: values.brand?.trim() || null,
        last4: values.last4?.trim() || null,
        holder_name: values.holder_name?.trim() || null,
        is_default: values.is_default,
      });
      toast.success('Método de pagamento adicionado');
      setPmModalOpen(false);
      reset({ type: 'card', brand: '', last4: '', holder_name: '', is_default: false });
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao cadastrar método de pagamento', getApiErrorMessage(error));
    }
  };

  const handleSetDefaultPm = async (id: number) => {
    try {
      await setDefaultPmMutation.mutateAsync(id);
      toast.success('Método padrão atualizado');
    } catch (error) {
      toast.error('Erro ao definir método padrão', getApiErrorMessage(error));
    }
  };

  const handleDeletePm = async () => {
    if (!deletingPm) return;
    try {
      await deletePmMutation.mutateAsync(deletingPm.id);
      toast.success('Método de pagamento removido');
      setDeletingPm(null);
    } catch (error) {
      toast.error('Erro ao remover método de pagamento', getApiErrorMessage(error));
    }
  };

  const isLoading =
    plansQuery.isPending || subscriptionsQuery.isPending || paymentMethodsQuery.isPending;
  const firstError =
    plansQuery.error || subscriptionsQuery.error || paymentMethodsQuery.error;

  if (firstError && !isLoading) {
    return (
      <ErrorState
        title="Erro ao carregar dados de faturamento"
        error={firstError}
        onRetry={() => {
          void plansQuery.refetch();
          void subscriptionsQuery.refetch();
          void paymentMethodsQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Planos e Assinatura
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gerencie seu plano contratado, métodos de pagamento e histórico de assinaturas.
          </p>
        </div>

        <Link
          to="/invoices"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Ver faturas
        </Link>
      </div>

      {/* Active Subscription */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Assinatura atual
            </h2>
            {isLoading ? (
              <p className="mt-2 text-sm text-slate-500">Carregando assinatura...</p>
            ) : activeSubscription ? (
              <div className="mt-2 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {planById.get(activeSubscription.plan_id)?.name ??
                      `Plano #${activeSubscription.plan_id}`}
                  </span>
                  <StatusIndicator {...getSubscriptionStatusMeta(activeSubscription.status)} />
                </div>
                <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  Iniciada em {formatDate(activeSubscription.starts_at)}
                  {activeSubscription.ends_at && ` · Válida até ${formatDate(activeSubscription.ends_at)}`}
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Nenhuma assinatura ativa no momento. Escolha um plano abaixo para iniciar.
              </p>
            )}
          </div>

          {activeSubscription && (
            <button
              type="button"
              onClick={() => setCancelingSub(activeSubscription)}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      </section>

      {/* Plans Grid */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Planos disponíveis
        </h2>

        {isLoading ? (
          <CardsGridSkeleton count={3} />
        ) : plans.length === 0 ? (
          <EmptyState
            title="Nenhum plano disponível"
            description="Não há planos cadastrados no servidor no momento."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = activeSubscription?.plan_id === plan.id;
              return (
                <article
                  key={plan.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {plan.name}
                      </h3>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {plan.interval === 'yearly' ? 'Anual' : 'Mensal'}
                      </span>
                    </div>

                    <p className="mt-4 font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrency(plan.price, plan.currency)}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        /{plan.interval === 'yearly' ? 'ano' : 'mês'}
                      </span>
                    </p>

                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                      {plan.description || 'Plano completo para operação comercial multi-tenant.'}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => openSubscribeModal(plan)}
                      disabled={!plan.is_active}
                      className={
                        isCurrent
                          ? 'w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          : 'w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50'
                      }
                    >
                      {isCurrent ? 'Plano atual' : 'Assinar plano'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Payment Methods */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Métodos de pagamento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cartões, chaves Pix ou boletos cadastrados para sua empresa.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPmModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar método</span>
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-5 w-5" />}
            title="Nenhum método de pagamento cadastrado"
            description="Adicione um cartão, Pix ou boleto para usar como forma de pagamento padrão."
            action={
              <button
                type="button"
                onClick={() => setPmModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Cadastrar método</span>
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    {pm.type === 'card' && <CreditCard className="h-5 w-5" />}
                    {pm.type === 'pix' && <QrCode className="h-5 w-5" />}
                    {pm.type === 'boleto' && <Banknote className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {getPaymentMethodLabel(pm.type)}
                        {pm.brand ? ` · ${pm.brand}` : ''}
                      </span>
                      {pm.last4 && (
                        <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          •••• {pm.last4}
                        </span>
                      )}
                      {pm.is_default && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>Padrão</span>
                        </span>
                      )}
                    </div>
                    {pm.holder_name && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Titular: {pm.holder_name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!pm.is_default && (
                    <button
                      type="button"
                      onClick={() => void handleSetDefaultPm(pm.id)}
                      disabled={setDefaultPmMutation.isPending}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Definir como padrão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeletingPm(pm)}
                    aria-label="Excluir método de pagamento"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Histórico de assinaturas
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Início</th>
                  <th className="px-5 py-3">Cancelamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums text-slate-500">
                      #{sub.id}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {planById.get(sub.plan_id)?.name ?? `Plano #${sub.plan_id}`}
                    </td>
                    <td className="px-5 py-3">
                      <StatusIndicator {...getSubscriptionStatusMeta(sub.status)} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {formatDate(sub.starts_at)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {formatDate(sub.canceled_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Subscribe Confirm Modal */}
      <Modal
        open={Boolean(selectedPlanToSubscribe)}
        onClose={() => {
          setSelectedPlanToSubscribe(null);
          setSubscribeConflictMsg(null);
        }}
        title={`Assinar plano ${selectedPlanToSubscribe?.name ?? ''}`}
        description="Ao confirmar, uma nova assinatura será criada junto com a primeira fatura em aberto."
      >
        {selectedPlanToSubscribe && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {selectedPlanToSubscribe.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cobrança {selectedPlanToSubscribe.interval === 'yearly' ? 'anual' : 'mensal'}
                </p>
              </div>
              <p className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(selectedPlanToSubscribe.price, selectedPlanToSubscribe.currency)}
              </p>
            </div>

            <FormField label="Método de pagamento (opcional)" htmlFor="sub-pm">
              <select
                id="sub-pm"
                value={chosenPaymentMethodId}
                onChange={(e) => setChosenPaymentMethodId(e.target.value)}
                className={inputClassName(false)}
              >
                <option value="">Sem método vinculado</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {getPaymentMethodLabel(pm.type)}
                    {pm.brand ? ` (${pm.brand})` : ''}
                    {pm.last4 ? ` •••• ${pm.last4}` : ''}
                    {pm.is_default ? ' — Padrão' : ''}
                  </option>
                ))}
              </select>
            </FormField>

            {subscribeConflictMsg && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{subscribeConflictMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPlanToSubscribe(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmSubscribe()}
                disabled={createSubMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createSubMutation.isPending ? 'Contratando...' : 'Confirmar assinatura'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Payment Method Modal */}
      <Modal
        open={pmModalOpen}
        onClose={() => setPmModalOpen(false)}
        title="Novo método de pagamento"
        description="Cadastre um cartão, Pix ou boleto para futuras cobranças."
      >
        <form onSubmit={handleSubmit(onCreatePaymentMethod)} className="space-y-4" noValidate>
          <FormField label="Tipo" htmlFor="pm-type" required error={errors.type?.message}>
            <select
              id="pm-type"
              className={inputClassName(Boolean(errors.type))}
              {...register('type')}
            >
              <option value="card">Cartão de crédito</option>
              <option value="pix">Pix</option>
              <option value="boleto">Boleto</option>
            </select>
          </FormField>

          {watchedPmType === 'card' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Bandeira" htmlFor="pm-brand" error={errors.brand?.message}>
                <input
                  id="pm-brand"
                  type="text"
                  placeholder="Visa, Mastercard..."
                  className={inputClassName(Boolean(errors.brand))}
                  {...register('brand')}
                />
              </FormField>

              <FormField
                label="Últimos 4 dígitos"
                htmlFor="pm-last4"
                required
                error={errors.last4?.message}
              >
                <input
                  id="pm-last4"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="4242"
                  className={`${inputClassName(Boolean(errors.last4))} font-mono tabular-nums`}
                  {...register('last4')}
                />
              </FormField>
            </div>
          )}

          <FormField label="Nome do titular" htmlFor="pm-holder" error={errors.holder_name?.message}>
            <input
              id="pm-holder"
              type="text"
              placeholder="Nome impresso ou razão social"
              className={inputClassName(Boolean(errors.holder_name))}
              {...register('holder_name')}
            />
          </FormField>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-950"
              {...register('is_default')}
            />
            <span>Definir como método padrão</span>
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPmModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createPmMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createPmMutation.isPending ? 'Salvando...' : 'Salvar método'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelingSub)}
        onClose={() => setCancelingSub(null)}
        onConfirm={() => void handleCancelSubscription()}
        isPending={cancelSubMutation.isPending}
        title="Cancelar assinatura"
        description="Tem certeza que deseja cancelar a assinatura ativa? Você poderá contratar um novo plano em seguida."
        confirmLabel="Confirmar cancelamento"
      />

      <ConfirmDialog
        open={Boolean(deletingPm)}
        onClose={() => setDeletingPm(null)}
        onConfirm={() => void handleDeletePm()}
        isPending={deletePmMutation.isPending}
        title="Remover método de pagamento"
        description="Tem certeza que deseja remover este método de pagamento?"
        confirmLabel="Remover"
      />
    </div>
  );
}
