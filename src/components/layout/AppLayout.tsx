import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Menu,
  Moon,
  Sun,
  UserCircle,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { useTheme } from '@/src/theme/ThemeContext';
import { getInitials } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operação',
    items: [
      { to: '/', label: 'Visão Geral', icon: LayoutDashboard, end: true },
      { to: '/crms', label: 'Pipelines (CRMs)', icon: FolderKanban },
      { to: '/sending-templates', label: 'Templates de Envio', icon: MailCheck },
      { to: '/groups', label: 'Grupos', icon: UsersRound },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { to: '/billing', label: 'Planos e Assinatura', icon: CreditCard },
      { to: '/invoices', label: 'Faturas', icon: FileText },
    ],
  },
  {
    title: 'Organização',
    items: [
      { to: '/company', label: 'Empresa', icon: Building2 },
      { to: '/team', label: 'Equipe', icon: Users },
      { to: '/profile', label: 'Meu Perfil', icon: UserCircle },
    ],
  },
];

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Visão Geral';
  if (pathname === '/crms') return 'Pipelines (CRMs)';
  if (/^\/crms\/\d+\/board/.test(pathname)) return 'Quadro Kanban';
  if (/^\/leads\/\d+/.test(pathname)) return 'Detalhes do Lead';
  if (pathname === '/sending-templates') return 'Templates de Envio';
  if (pathname === '/groups') return 'Grupos';
  if (pathname === '/billing') return 'Planos e Assinatura';
  if (pathname === '/invoices') return 'Faturas';
  if (pathname === '/company') return 'Empresa';
  if (pathname === '/team') return 'Equipe';
  if (pathname === '/profile') return 'Meu Perfil';
  return 'Vértice CRM';
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, company, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-slate-100"
        >
          Vértice CRM
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-xs font-medium text-slate-400 dark:text-slate-500">
              {group.title}
            </p>
            <div className="mt-1.5 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex min-w-0 items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.name || 'Usuário'}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email || ''}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            title="Sair"
            aria-label="Sair da conta"
            className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile drawer sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-slate-200 dark:border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="truncate font-medium text-slate-500 dark:text-slate-400">
                {company?.name || 'Minha Empresa'}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                /
              </span>
              <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
