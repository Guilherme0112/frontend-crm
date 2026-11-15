import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ErrorState } from '@/src/components/common/ErrorState';

export function ProtectedRoute() {
  const { isAuthenticated, isHydrating, hydrationError, retryHydration, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] dark:bg-[#101012]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-950/[0.12] border-t-blue-600 dark:border-white/[0.12] dark:border-t-blue-400" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Carregando sessão...
          </p>
        </div>
      </div>
    );
  }

  if (hydrationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] p-6 dark:bg-[#101012]">
        <div className="w-full max-w-md">
          <ErrorState
            title="Não foi possível validar sua sessão"
            error={hydrationError}
            onRetry={retryHydration}
            secondaryAction={{ label: 'Sair e ir para o login', onClick: () => void logout() }}
          />
        </div>
      </div>
    );
  }

  return <Outlet />;
}
