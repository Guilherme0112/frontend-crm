import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { CardPaymentForm } from './CardPaymentForm';
import {
  useBillingConfigQuery,
  useCancelSubscriptionMutation,
  useChangePlanMutation,
  useDiscardPendingCheckoutMutation,
  usePendingCheckoutQuery,
  useCreateCheckoutMutation,
  usePlansFullQuery,
  useSubscriptionsFullQuery,
  useSyncSubscriptionMutation,
} from './hooks';
import { Pagination } from '@/src/components/common/Pagination';
import { useClientPagination } from '@/src/lib/useClientPagination';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { CardsGridSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import {
  StatusIndicator,
  getSubscriptionStatusMeta,
} from '@/src/components/common/StatusBadge';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage, getApiStatus } from '@/src/lib/formErrors';
import { formatCurrency, formatDate } from '@/src/lib/format';
import type {
  Plan,
  Subscription,
} from '@/src/lib/types';




/** Plano de cortesia: ativa direto, sem gateway e sem cobrança. */
function isFreePlan(plan: Plan): boolean {
  return plan.price <= 0;
}

/** O Trial é concedido no cadastro; contratá-lo de novo renovaria o teste. */
function isTrialPlan(plan: Plan): boolean {
  return plan.slug === 'trial';
}

export function BillingPage() {
  const { toast } = useToast();
  const plansQuery = usePlansFullQuery();
  const subscriptionsQuery = useSubscriptionsFullQuery();

  const createCheckoutMutation = useCreateCheckoutMutation();
  const changePlanMutation = useChangePlanMutation();
  const billingConfigQuery = useBillingConfigQuery();

  // SDK indisponível (bloqueador, rede, chave ausente): o pagamento continua
  // possível pelo Checkout Pro. Nunca deixar o cliente sem caminho para pagar.
  const [cardFormUnavailable, setCardFormUnavailable] = useState(false);
  const publicKey = billingConfigQuery.data?.mercadopago_public_key ?? null;
  const canUseCardForm = Boolean(publicKey) && !cardFormUnavailable;
  const isSubscribePending = createCheckoutMutation.isPending || changePlanMutation.isPending;
  const cancelSubMutation = useCancelSubscriptionMutation();

  // Callback estável: uma função inline faria o CardPaymentForm desmontar o
  // Brick (e perder os dados digitados) a cada mudança de estado do modal.
  const handleCardFormUnavailable = useCallback(() => setCardFormUnavailable(true), []);

  const [selectedPlanToSubscribe, setSelectedPlanToSubscribe] = useState<Plan | null>(null);
  const [subscribeConflictMsg, setSubscribeConflictMsg] = useState<string | null>(null);
  const [cancelingSub, setCancelingSub] = useState<Subscription | null>(null);
  const syncSubMutation = useSyncSubscriptionMutation();
  const [searchParams, setSearchParams] = useSearchParams();



  // Listas completas: alimentam a lógica da tela (assinatura ativa, nome do
  // plano no histórico, seletor de método no modal).
  const plans = plansQuery.items ?? [];
  const subscriptions = subscriptionsQuery.items ?? [];

  // Retorno do Checkout Pro: o Mercado Pago redireciona para a back_url com
  // ?preapproval_id=...&status=... — ao voltar, reconcilia a assinatura
  // automaticamente (equivale ao botão "Sincronizar") e limpa a URL.
  const preapprovalId = searchParams.get('preapproval_id');
  const reconciledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!preapprovalId || reconciledRef.current === preapprovalId) {
      return;
    }

    // O retorno do Checkout Pro é um reload completo: a lista de assinaturas
    // ainda não chegou no primeiro render. Esperar evita limpar a URL e perder
    // a reconciliação exatamente no caminho do redirect.
    if (subscriptionsQuery.isPending) {
      return;
    }

    const pending = subscriptions.find(
      (s) => s.external_id === preapprovalId && s.status === 'pending',
    );

    const finish = () => {
      const params = new URLSearchParams(searchParams);
      params.delete('preapproval_id');
      params.delete('status');
      setSearchParams(params, { replace: true });
    };

    if (!pending) {
      reconciledRef.current = preapprovalId;
      finish();

      return;
    }

    reconciledRef.current = preapprovalId;
    const wasSwap = Boolean(pending.replaces_subscription_id);

    syncSubMutation
      .mutateAsync(pending.id)
      .then((updated) => {
        if (updated.status === 'active') {
          if (wasSwap) {
            toast.success('Plano alterado', 'O plano anterior foi encerrado automaticamente.');
          } else {
            toast.success('Assinatura ativada', 'Seu plano está ativo. Bem-vindo!');
          }
        } else {
          toast.info(
            'Pagamento em processamento',
            wasSwap
              ? 'Seu plano atual continua valendo até o Mercado Pago confirmar.'
              : 'Assim que o Mercado Pago confirmar, a assinatura será ativada.',
          );
        }
      })
      .catch(() => {
        toast.error('Erro ao confirmar pagamento', 'Atualize a página ou clique em Sincronizar.');
      })
      .finally(finish);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preapprovalId, subscriptionsQuery.isPending, subscriptions]);

  // Recortes exibidos, paginados no cliente.
  // A grade mostra só o que dá para contratar. Os inativos continuam vindo da
  // API porque o histórico de assinaturas precisa deles para resolver o nome
  // do plano — apenas não cabem na vitrine.
  const catalog = useMemo(
    () => plans.filter((p) => p.is_active && !p.is_internal),
    [plans],
  );
  const plansPage = useClientPagination(catalog, 6);
  const subscriptionsPage = useClientPagination(subscriptions, 10);

  const planById = useMemo(() => {
    const map = new Map<number, Plan>();
    for (const p of plans) map.set(p.id, p);
    return map;
  }, [plans]);

  const activeSubscription = useMemo(
    () =>
      subscriptions.find(
        (s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due',
      ) ?? null,
    [subscriptions],
  );

  // Cobrança recusada: o Mercado Pago ainda está retentando. O acesso continua
  // até o fim da carência, e o cliente precisa saber disso antes de perdê-lo.
  const pastDueSubscription =
    activeSubscription?.status === 'past_due' ? activeSubscription : null;

  // Troca contratada e ainda não paga. Enquanto ela existe, o plano atual segue
  // valendo — nada aqui é cancelado até o Mercado Pago confirmar.
  const pendingSwap = useMemo(
    () => subscriptions.find((s) => s.status === 'pending') ?? null,
    [subscriptions],
  );

  // O link de pagamento pertence ao gateway, não ao nosso banco: só é buscado
  // quando existe mesmo uma pendência a resolver.
  const pendingCheckoutQuery = usePendingCheckoutQuery(pendingSwap !== null);
  const discardPendingMutation = useDiscardPendingCheckoutMutation();

  // Um plano pago de pé é o que transforma "Assinar" em "Trocar".
  const currentPlan = activeSubscription ? planById.get(activeSubscription.plan_id) ?? null : null;
  const isOnPaidPlan =
    activeSubscription?.status === 'active' && currentPlan !== null && !isTrialPlan(currentPlan);

  const openSubscribeModal = (plan: Plan) => {
    if (!plan.slug || plan.is_internal) return;
    setSubscribeConflictMsg(null);
    setSelectedPlanToSubscribe(plan);
  };

  const closeSubscribeModal = () => {
    setSelectedPlanToSubscribe(null);
    setSubscribeConflictMsg(null);
  };

  /**
   * Conclui a contratação ou a troca.
   *
   * Com `cardTokenId`, o cartão já foi tokenizado no navegador e a assinatura
   * nasce ativa — sem sair do app. Sem token, cai no Checkout Pro por redirect
   * (SDK fora do ar, ou plano de cortesia que não tem o que cobrar).
   */
  const handleConfirmSubscribe = async (cardTokenId?: string): Promise<boolean> => {
    if (!selectedPlanToSubscribe?.slug) return false;
    setSubscribeConflictMsg(null);

    try {
      const payload = {
        plan_slug: selectedPlanToSubscribe.slug,
        billing_method: 'card' as const,
        ...(cardTokenId ? { card_token_id: cardTokenId } : {}),
      };

      // Já tem plano pago de pé: troca o valor da assinatura existente em vez
      // de abrir outra. O backend cai sozinho no checkout se o MP recusar.
      const session = isOnPaidPlan
        ? await changePlanMutation.mutateAsync(payload)
        : await createCheckoutMutation.mutateAsync(payload);

      if (session.status === 'active') {
        toast.success(
          isOnPaidPlan ? 'Plano alterado' : 'Plano ativado',
          isOnPaidPlan
            ? 'A cobrança mensal já passa a usar o novo valor.'
            : 'Sua assinatura está ativa. Bem-vindo!',
        );
        closeSubscribeModal();

        return true;
      }

      // Pendente: o pagamento precisa ser concluído no Mercado Pago.
      if (session.init_point) {
        toast.info('Redirecionando para o Mercado Pago...');
        window.location.href = session.init_point;

        return true;
      }

      toast.info(
        'Pagamento em processamento',
        'Assim que o Mercado Pago confirmar, a assinatura será ativada.',
      );
      closeSubscribeModal();

      return true;
    } catch (error) {
      const status = getApiStatus(error);
      const apiMsg = getApiErrorMessage(error);

      if (status === 409) {
        // Trocar de plano não exige mais cancelar nada: o 409 agora só aparece
        // quando o plano escolhido é o que já está contratado.
        setSubscribeConflictMsg(apiMsg);
        toast.error('Você já está neste plano', apiMsg);
      } else if (status === 422) {
        // Recusa do gateway: a mensagem já vem explicando o que fazer (cartão,
        // conta do pagador). Fica no modal, onde o cliente pode agir.
        setSubscribeConflictMsg(apiMsg);
        toast.error('Pagamento não autorizado', apiMsg);
      } else if (status === 503) {
        setSubscribeConflictMsg(apiMsg);
        toast.error('Mercado Pago indisponível', apiMsg);
      } else {
        toast.error('Erro ao contratar plano', apiMsg);
      }

      // Resolve com false em vez de rejeitar: o Brick usa esta promise para
      // encerrar o loading, e o erro já está visível no modal.
      return false;
    }
  };

  const handleDiscardPending = async () => {
    try {
      await discardPendingMutation.mutateAsync();
      toast.success('Contratação descartada', 'Agora você pode escolher outro plano.');
    } catch (error) {
      toast.error('Erro ao descartar a contratação', getApiErrorMessage(error));
    }
  };

  /** Reconciliação manual, para quando o webhook do Mercado Pago não chegou. */
  const handleSyncPendingSwap = async () => {
    if (!pendingSwap) return;

    try {
      const updated = await syncSubMutation.mutateAsync(pendingSwap.id);

      if (updated.status === 'active') {
        toast.success(
          pendingSwap.replaces_subscription_id ? 'Plano alterado' : 'Assinatura ativada',
          pendingSwap.replaces_subscription_id
            ? 'O plano anterior foi encerrado automaticamente.'
            : 'Seu plano está ativo.',
        );
      } else {
        toast.info(
          'Pagamento ainda não confirmado',
          'O Mercado Pago ainda não liberou a cobrança. Seu plano atual continua valendo.',
        );
      }
    } catch (error) {
      toast.error('Erro ao verificar o pagamento', getApiErrorMessage(error));
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


  const isLoading =
    plansQuery.isPending || subscriptionsQuery.isPending;
  const firstError =
    plansQuery.error || subscriptionsQuery.error;

  if (firstError && !isLoading) {
    return (
      <ErrorState
        title="Erro ao carregar dados de faturamento"
        error={firstError}
        onRetry={() => {
          void plansQuery.refetch();
          void subscriptionsQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Planos e Assinatura
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Gerencie seu plano contratado, o histórico de assinaturas e suas faturas.
          </p>
        </div>

        <Link
          to="/invoices"
          className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-950/[0.12] bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:w-auto dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
        >
          Ver faturas
        </Link>
      </div>

      {/* Active Subscription */}
      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Assinatura atual
            </h2>
            {isLoading ? (
              <p className="mt-2 text-sm text-zinc-500">Carregando assinatura...</p>
            ) : activeSubscription ? (
              <div className="mt-2 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {planById.get(activeSubscription.plan_id)?.name ??
                      `Plano #${activeSubscription.plan_id}`}
                  </span>
                  <StatusIndicator {...getSubscriptionStatusMeta(activeSubscription.status)} />
                </div>
                <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  Iniciada em {formatDate(activeSubscription.starts_at)}
                  {activeSubscription.ends_at && ` · Válida até ${formatDate(activeSubscription.ends_at)}`}
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                Nenhuma assinatura ativa no momento. Escolha um plano abaixo para iniciar.
              </p>
            )}
          </div>

          {activeSubscription && (
            <Button variant="outlined" color="error" onClick={() => setCancelingSub(activeSubscription)} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Cancelar assinatura
            </Button>
          )}
        </div>

        {pastDueSubscription && (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/40">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm text-red-900 dark:text-red-200">
              <p className="font-semibold">Não conseguimos cobrar a última mensalidade</p>
              <p className="mt-0.5 text-xs leading-relaxed">
                O Mercado Pago vai tentar novamente nos próximos dias. Atualize o cartão para não
                perder o acesso
                {pastDueSubscription.grace_until
                  ? ` — seu acesso continua até ${formatDate(pastDueSubscription.grace_until)}.`
                  : '.'}
              </p>
            </div>
          </div>
        )}

        {pendingSwap && (
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold">
                  {pendingSwap.replaces_subscription_id
                    ? 'Troca de plano aguardando pagamento'
                    : 'Assinatura aguardando pagamento'}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed">
                  {planById.get(pendingSwap.plan_id)?.name ?? `Plano #${pendingSwap.plan_id}`}
                  {pendingSwap.replaces_subscription_id
                    ? ' entra no lugar do plano atual assim que o Mercado Pago confirmar. Até lá, nada muda e você não precisa cancelar nada.'
                    : ' será ativado assim que o Mercado Pago confirmar o pagamento.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sem este link o cliente fica preso: não consegue voltar para a
                  cobrança aberta nem iniciar outra. */}
              {pendingCheckoutQuery.data?.init_point && (
                <a
                  href={pendingCheckoutQuery.data.init_point}
                  className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                >
                  Continuar pagamento
                </a>
              )}

              <button
                type="button"
                onClick={() => void handleSyncPendingSwap()}
                disabled={syncSubMutation.isPending}
                className="rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/60 dark:bg-[#17171a] dark:text-amber-300 dark:hover:bg-amber-950/60"
              >
                {syncSubMutation.isPending ? 'Verificando...' : 'Já paguei, verificar'}
              </button>

              <button
                type="button"
                onClick={() => void handleDiscardPending()}
                disabled={discardPendingMutation.isPending}
                className="rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/60 dark:bg-[#17171a] dark:text-amber-300 dark:hover:bg-amber-950/60"
              >
                {discardPendingMutation.isPending ? 'Descartando...' : 'Desistir e escolher outro plano'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Plans Grid */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Planos disponíveis
        </h2>

        {isLoading ? (
          <CardsGridSkeleton count={3} />
        ) : catalog.length === 0 ? (
          <EmptyState
            title="Nenhum plano disponível"
            description="Não há planos cadastrados no servidor no momento."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plansPage.items.map((plan) => {
              const isCurrent = activeSubscription?.plan_id === plan.id;
              return (
                <article
                  key={plan.id}
                  className="flex flex-col justify-between rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {plan.name}
                      </h3>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {plan.interval === 'yearly' ? 'Anual' : 'Mensal'}
                      </span>
                    </div>

                    <p className="mt-4 font-mono text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(plan.price, plan.currency)}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        /{plan.interval === 'yearly' ? 'ano' : 'mês'}
                      </span>
                    </p>

                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {plan.description || 'Plano completo para operação comercial multi-tenant.'}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-zinc-950/[0.05] pt-4 dark:border-white/[0.07]">
                    {/* O Trial não é contratável: vem com o cadastro e tem prazo. */}
                    {isTrialPlan(plan) ? (
                      <p className="text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Concedido automaticamente no cadastro, por 7 dias.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSubscribeModal(plan)}
                        disabled={!plan.is_active || isCurrent}
                        className={
                          isCurrent
                            ? 'w-full cursor-default rounded-lg border border-zinc-950/[0.12] bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-500 dark:border-white/[0.12] dark:bg-white/[0.05] dark:text-zinc-400'
                            : 'w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50'
                        }
                      >
                        {isCurrent
                          ? 'Plano atual'
                          : isFreePlan(plan)
                            ? 'Ativar plano'
                            : isOnPaidPlan
                              ? 'Trocar para este plano'
                              : 'Assinar plano'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {plansPage.total > 0 && (
          <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
  <Pagination
              page={plansPage.page}
              lastPage={plansPage.lastPage}
              total={plansPage.total}
              from={plansPage.from}
              to={plansPage.to}
              onPageChange={plansPage.setPage}
              ariaLabel="Paginação de planos"
            />
          </div>
        )}
      </section>

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Histórico de assinaturas
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-950/[0.07] text-xs font-medium text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Início</th>
                  <th className="px-5 py-3">Cancelamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
                {subscriptionsPage.items.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums text-zinc-500">
                      #{sub.id}
                    </td>
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {planById.get(sub.plan_id)?.name ?? `Plano #${sub.plan_id}`}
                    </td>
                    <td className="px-5 py-3">
                      <StatusIndicator {...getSubscriptionStatusMeta(sub.status)} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      {formatDate(sub.starts_at)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      {formatDate(sub.canceled_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subscriptionsPage.total > 0 && (
            <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
  <Pagination
                page={subscriptionsPage.page}
                lastPage={subscriptionsPage.lastPage}
                total={subscriptionsPage.total}
                from={subscriptionsPage.from}
                to={subscriptionsPage.to}
                onPageChange={subscriptionsPage.setPage}
                ariaLabel="Paginação do histórico de assinaturas"
              />
            </div>
          )}
        </section>
      )}

      {/* Subscribe Confirm Modal */}
      <Modal
        open={Boolean(selectedPlanToSubscribe)}
        onClose={() => {
          setSelectedPlanToSubscribe(null);
          setSubscribeConflictMsg(null);
        }}
        title={
          isOnPaidPlan
            ? `Trocar para o plano ${selectedPlanToSubscribe?.name ?? ''}`
            : `Assinar plano ${selectedPlanToSubscribe?.name ?? ''}`
        }
        description={
          isOnPaidPlan
            ? `Você está no plano ${currentPlan?.name ?? 'atual'}. Ele continua valendo até o pagamento do novo ser confirmado.`
            : 'Ao confirmar, uma nova assinatura será criada junto com a primeira fatura em aberto.'
        }
      >
        {selectedPlanToSubscribe && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-zinc-950/[0.07] bg-zinc-50 p-4 dark:border-white/[0.07] dark:bg-[#101012]">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedPlanToSubscribe.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cobrança {selectedPlanToSubscribe.interval === 'yearly' ? 'anual' : 'mensal'}
                </p>
              </div>
              <p className="font-mono text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCurrency(selectedPlanToSubscribe.price, selectedPlanToSubscribe.currency)}
              </p>
            </div>

            {isFreePlan(selectedPlanToSubscribe) ? (
              <>
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Este plano é gratuito: não há forma de pagamento a escolher nem cobrança a
                    gerar. A ativação é imediata.
                  </span>
                </div>

                {subscribeConflictMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{subscribeConflictMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
                  <Button variant="outlined" color="inherit" onClick={closeSubscribeModal}>
                    Cancelar
                  </Button>
                  <ActionButton onClick={() => void handleConfirmSubscribe()} disabled={createCheckoutMutation.isPending}>
                    {createCheckoutMutation.isPending ? 'Ativando...' : 'Ativar plano'}
                  </ActionButton>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5 rounded-lg border border-zinc-950/[0.07] bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-zinc-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {isOnPaidPlan
                      ? 'A troca é imediata e usa o cartão já cadastrado — a próxima cobrança mensal já sai pelo novo valor.'
                      : 'A cobrança é debitada automaticamente todo mês. Os dados do cartão vão direto para o Mercado Pago e não passam pelos nossos servidores.'}
                  </span>
                </div>

                {/* Troca de plano reusa o cartão que já está no gateway: não há
                    o que digitar. */}
                {!isOnPaidPlan && canUseCardForm && (
                  <CardPaymentForm
                    publicKey={publicKey}
                    amount={selectedPlanToSubscribe.price}
                    onToken={handleConfirmSubscribe}
                    onUnavailable={handleCardFormUnavailable}
                    disabled={isSubscribePending}
                  />
                )}

                {subscribeConflictMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{subscribeConflictMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
                  <Button variant="outlined" color="inherit" onClick={closeSubscribeModal}>
                    Cancelar
                  </Button>

                  {/* O Brick tem o próprio botão de envio. Este só aparece quando
                      não há cartão a digitar: troca de plano, ou redirect. */}
                  {(isOnPaidPlan || !canUseCardForm) && (
                    <ActionButton onClick={() => void handleConfirmSubscribe()} disabled={isSubscribePending}>
                      {isSubscribePending
                        ? 'Processando...'
                        : isOnPaidPlan
                          ? 'Confirmar troca de plano'
                          : 'Ir para o pagamento'}
                    </ActionButton>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelingSub)}
        onClose={() => setCancelingSub(null)}
        onConfirm={() => void handleCancelSubscription()}
        isPending={cancelSubMutation.isPending}
        title="Cancelar assinatura"
        description="Tem certeza que deseja cancelar a assinatura ativa? Para apenas mudar de plano não é preciso cancelar: escolha o novo plano e a troca acontece sozinha depois do pagamento."
        confirmLabel="Confirmar cancelamento"
      />

    </div>
  );
}
