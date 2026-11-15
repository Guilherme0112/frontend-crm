import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  Company,
  LoginPayload,
  MeData,
  RegisterPayload,
  User,
} from '@/src/lib/types';
import { useToast } from '@/src/components/common/Toast';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  hydrationError: unknown;
  retryHydration: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => api.getStoredToken());
  const [session, setSession] = useState<MeData | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: api.me,
    enabled: Boolean(token),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setSession(meQuery.data);
    }
  }, [meQuery.data]);

  const clearSessionState = useCallback(() => {
    api.clearStoredToken();
    setToken(null);
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    api.registerUnauthorizedHandler(() => {
      clearSessionState();
      toast.error('Sessão expirada', 'Faça login novamente para continuar.');
      navigate('/login', { replace: true });
    });
  }, [clearSessionState, navigate, toast]);

  const handleLogin = useCallback(
    async (payload: LoginPayload) => {
      const data = await api.login(payload);
      api.setStoredToken(data.token);
      setToken(data.token);
      const nextSession: MeData = { user: data.user, company: data.company };
      setSession(nextSession);
      queryClient.setQueryData(queryKeys.auth.me, nextSession);
    },
    [queryClient],
  );

  const handleRegister = useCallback(
    async (payload: RegisterPayload) => {
      const data = await api.register(payload);
      api.setStoredToken(data.token);
      setToken(data.token);
      const nextSession: MeData = { user: data.user, company: data.company };
      setSession(nextSession);
      queryClient.setQueryData(queryKeys.auth.me, nextSession);
    },
    [queryClient],
  );

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Clear local session even if backend token already expired
    } finally {
      clearSessionState();
      toast.info('Sessão encerrada');
      navigate('/login', { replace: true });
    }
  }, [clearSessionState, navigate, toast]);

  const refreshSession = useCallback(async () => {
    const fresh = await queryClient.fetchQuery({
      queryKey: queryKeys.auth.me,
      queryFn: api.me,
      staleTime: 0,
    });
    setSession(fresh);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: session?.user ?? meQuery.data?.user ?? null,
      company: session?.company ?? meQuery.data?.company ?? null,
      isAuthenticated: Boolean(token),
      isHydrating: Boolean(token) && meQuery.isPending && !session,
      hydrationError: meQuery.isError ? meQuery.error : null,
      retryHydration: () => {
        void meQuery.refetch();
      },
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      refreshSession,
    }),
    [
      token,
      session,
      meQuery,
      handleLogin,
      handleRegister,
      handleLogout,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
