import ActionButton from '@/src/components/common/Button';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plug, TriangleAlert } from 'lucide-react';
import { useCrmQuery, useStepsQuery, useUpdateCrmMutation } from '@/src/features/crm/hooks';
import { TokenSection } from './token/TokenSection';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { SnippetsCard } from './snippets/SnippetsCard';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage } from '@/src/lib/formErrors';

export function IntegrationPage() {
  const { id } = useParams();
  const crmId = Number(id);
  const isValidCrmId = Number.isInteger(crmId) && crmId > 0;
  const { toast } = useToast();

  const crmQuery = useCrmQuery(crmId);
  // Use a mesma query de etapas do resto do app: a lista é simples (sem
  // paginação) e compartilhar a chave com uma query infinita corrompia o
  // formato do cache ao navegar do Kanban para cá.
  const stepsQuery = useStepsQuery(crmId);
  const updateCrmMutation = useUpdateCrmMutation();

  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [stepSearch, setStepSearch] = useState('');
  const crm = crmQuery.data;

  const steps = useMemo(
    () => [...(stepsQuery.items ?? [])].sort((a, b) => a.position - b.position || a.id - b.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stepsQuery.items],
  );

  const filteredSteps = useMemo(() => {
    const term = stepSearch.trim().toLowerCase();
    if (!term) return steps;
    return steps.filter((step) => `${step.position}. ${step.name}`.toLowerCase().includes(term));
  }, [steps, stepSearch]);

  const stepOptions = useMemo(
    () => [
      { value: '', label: 'Nenhuma (desativar integração)' },
      ...filteredSteps.map((step) => ({
        value: String(step.id),
        label: `${step.position}. ${step.name}`,
      })),
    ],
    [filteredSteps],
  );

  const savedStepId = crm?.public_step_id ?? null;
  const isDirty = selectedStepId !== savedStepId;
  const integrationEnabled = savedStepId !== null;

  useEffect(() => {
    if (crm) {
      setSelectedStepId(crm.public_step_id ?? null);
    }
  }, [crm?.id, crm?.public_step_id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isValidCrmId) {
    return (
      <div className="w-full space-y-4">
        <Link
          to="/crms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Todos os CRMs</span>
        </Link>
        <ErrorState title="CRM inválido" />
      </div>
    );
  }

  if (crmQuery.isPending || stepsQuery.isPending) {
    return (
      <div className="w-full space-y-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (crmQuery.isError || !crm) {
    return (
      <div className="w-full space-y-4">
        <Link
          to="/crms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Todos os CRMs</span>
        </Link>
        <ErrorState
          title="CRM não encontrado"
          error={crmQuery.error}
          onRetry={() => void crmQuery.refetch()}
        />
      </div>
    );
  }

  if (stepsQuery.isError) {
    return (
      <div className="w-full space-y-4">
        <Link
          to={`/crms/${crm.id}/board`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao quadro Kanban</span>
        </Link>
        <ErrorState
          title="Erro ao carregar etapas"
          error={stepsQuery.error}
          onRetry={() => void stepsQuery.refetch()}
        />
      </div>
    );
  }

  const handleSaveStep = async () => {
    try {
      await updateCrmMutation.mutateAsync({
        id: crm.id,
        payload: { public_step_id: selectedStepId },
      });
      toast.success('Etapa atualizada');
    } catch (error) {
      toast.error('Não foi possível salvar a etapa', getApiErrorMessage(error));
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Caminho" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
        <Link to="/crms" className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
          Todos os CRMs
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/crms/${crm.id}/board`}
          className="max-w-40 truncate transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          {crm.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-600 dark:text-zinc-300">Integração pública</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${crm.color || '#2563eb'}1f`, color: crm.color || '#2563eb' }}
          aria-hidden="true"
        >
          <Plug className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Captação de leads</p>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Integração pública
          </h1>
          <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Leads capturados via API pública entram neste CRM pela etapa configurada abaixo.
          </p>
        </div>
      </div>

      {/* Card 1 — Token */}
      <TokenSection crm={crm} />

      {/* Card 2 — Etapa de destino */}
      <section
        aria-labelledby="step-section-title"
        className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <h2
          id="step-section-title"
          className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Configuração da etapa de destino
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Leads recebidos pela integração pública serão colocados nesta etapa.
        </p>

        <div className="mt-4">
          <Autocomplete
            value={selectedStepId === null ? '' : String(selectedStepId)}
            onChange={(value) => setSelectedStepId(value === '' ? null : Number(value))}
            options={stepOptions}
            ariaLabel="Etapa de destino"
            placeholder="Selecione uma etapa"
            emptyMessage="Nenhuma etapa encontrada"
            onSearch={setStepSearch}
            debounceMs={300}
            loading={stepsQuery.isFetching}
            className="w-full max-w-md"
          />
        </div>

        {savedStepId === null && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Nenhuma etapa selecionada. Leads recebidos pela integração vão retornar erro 422 —
              configure uma etapa para ativar a integração.
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            O backend rejeita etapas de outro CRM automaticamente.
          </p>
          <ActionButton
            onClick={() => void handleSaveStep()}
            disabled={!isDirty || updateCrmMutation.isPending}
            className="shrink-0"
          >
            {updateCrmMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Salvar etapa
          </ActionButton>
        </div>
      </section>

      {/* Card 3 — Snippets */}
      <SnippetsCard crm={crm} enabled={integrationEnabled} />
    </div>
  );
}
