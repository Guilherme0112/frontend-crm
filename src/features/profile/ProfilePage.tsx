import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { useToast } from '@/src/components/common/Toast';
import { formatDateTime, getInitials } from '@/src/lib/format';
import { StatusIndicator } from '@/src/components/common/StatusBadge';
import { getApiErrorMessage } from '@/src/lib/formErrors';

export function ProfilePage() {
  const { user, company, refreshSession } = useAuth();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
      toast.success('Dados da sessão atualizados');
    } catch (error) {
      toast.error('Falha ao atualizar', getApiErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Meu Perfil
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Dados do usuário autenticado e da empresa vinculada à sessão.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar sessão</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-base font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
                {user?.name || '—'}
              </h2>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {user?.email || '—'}
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Status da conta</dt>
              <dd>
                <StatusIndicator
                  tone={user?.is_active ? 'success' : 'neutral'}
                  label={user?.is_active ? 'Ativo' : 'Inativo'}
                />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Telefone</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {user?.phone || 'Não informado'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">ID do usuário</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                #{user?.id ?? '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Cadastro em</dt>
              <dd className="tabular-nums text-slate-900 dark:text-slate-100">
                {formatDateTime(user?.created_at)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Link
              to="/team"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Gerenciar usuários da equipe
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {company?.name || 'Empresa'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Organização ativa neste workspace
            </p>
          </div>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Documento (CPF/CNPJ)</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {company?.document_number || 'Não informado'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Site</dt>
              <dd className="truncate text-slate-900 dark:text-slate-100">
                {company?.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {company.website}
                  </a>
                ) : (
                  'Não informado'
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Cidade / UF</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {company?.address?.city
                  ? `${company.address.city}${company.address.state ? ` / ${company.address.state}` : ''}`
                  : 'Não informado'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">ID da empresa</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                #{company?.id ?? '—'}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Link
              to="/company"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Editar dados da empresa
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
