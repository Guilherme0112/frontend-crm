import { useState, useRef, useEffect } from 'react';
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
  Monitor,
  Sun,
  UserCircle,
  Users,
  UsersRound,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { LogoMark } from '@/src/components/common/LogoMark';
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
      { to: '/crms', label: 'CRMs', icon: FolderKanban },
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

const BORDER = 'border-zinc-950/[0.07] dark:border-white/[0.07]';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Visão Geral';
  if (pathname === '/crms') return 'CRMs';
  if (pathname === '/crms/dashboard') return 'Dashboard de todos os CRMs';
  if (/^\/crms\/\d+\/board/.test(pathname)) return 'Quadro Kanban';
  if (/^\/groups\/\d+/.test(pathname)) return 'Grupo';
  if (/^\/crms\/\d+\/integration/.test(pathname)) return 'Integração pública';
  if (/^\/crms\/\d+\/audit/.test(pathname)) return 'Auditoria de mudanças';
  if (/^\/crms\/\d+\/dashboard/.test(pathname)) return 'Visão geral';
  if (/^\/leads\/\d+/.test(pathname)) return 'Detalhes do Lead';
  if (pathname === '/sending-templates') return 'Templates de Envio';
  if (pathname === '/groups') return 'Grupos';
  if (pathname === '/email-configs') return 'Configuração de email';
  if (pathname === '/billing') return 'Planos e Assinatura';
  if (pathname === '/invoices') return 'Faturas';
  if (pathname === '/company') return 'Empresa';
  if (pathname === '/team') return 'Equipe';
  if (pathname === '/profile') return 'Meu Perfil';
  return 'Vértice CRM';
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const { user, company, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const headerToggleBtn = document.getElementById('sidebar-toggle-btn');
        if (headerToggleBtn && headerToggleBtn.contains(event.target as Node)) {
          return;
        }
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCollapsed]);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-white dark:bg-[#141416]">
      {/* Brand */}
      <div
        className={cn(
          'flex h-16 items-center border-b',
          BORDER,
          collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4',
        )}
      >
        <Link
          to="/"
          onClick={() => {
            setMobileOpen(false);
            if (collapsed) setIsCollapsed(false);
          }}
          className="group flex min-w-0 items-center gap-2.5 rounded-lg"
          title="Vértice CRM"
          aria-label="Vértice CRM — ir para Visão Geral"
        >
          <LogoMark className={collapsed ? 'h-9 w-9' : 'h-8 w-8'} />
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Vértice
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                CRM Comercial
              </span>
            </span>
          )}
        </Link>

        {!collapsed && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-950/[0.05] hover:text-zinc-700 dark:hover:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-200"
              aria-label="Recolher menu"
              title="Recolher menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-950/[0.05] hover:text-zinc-700 lg:hidden dark:hover:bg-white/5 dark:hover:text-zinc-200"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {collapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="absolute right-0 top-20 hidden translate-x-1/2 rounded-full border border-zinc-950/[0.07] bg-white p-1 text-zinc-500 shadow-sm transition-colors hover:text-zinc-900 lg:flex dark:border-white/10 dark:bg-[#1c1c1f] dark:text-zinc-400 dark:hover:text-zinc-100"
            aria-label="Expandir menu"
            title="Expandir menu"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Workspace switcher (decorative affordance, navigates to company) */}
      {!collapsed && (
        <div className="px-3 py-3">
          <Link
            to="/company"
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-950/[0.07] bg-zinc-50 px-2.5 py-2 transition-colors hover:bg-zinc-950/[0.07] dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold text-zinc-700 ring-1 ring-inset ring-zinc-950/[0.08] dark:bg-white/[0.06] dark:text-zinc-200 dark:ring-white/10">
                {(company?.name || 'M').trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
                  {company?.name || 'Minha Empresa'}
                </span>
                <span className="block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                  Workspace ativo
                </span>
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav
        className={cn(
          'flex-1 space-y-6 overflow-y-auto py-4',
          collapsed ? 'px-2' : 'px-3',
        )}
        aria-label="Navegação principal"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className={collapsed ? 'flex flex-col items-center' : ''}>
            {!collapsed && (
              <p className="eyebrow px-3 text-zinc-400 dark:text-zinc-500">
                {group.title}
              </p>
            )}
            {collapsed && (
              <div aria-hidden="true" className="mx-auto mb-1.5 h-px w-6 bg-zinc-200 dark:bg-white/10" />
            )}
            <div className={cn('space-y-0.5', collapsed ? 'mt-1 flex w-full flex-col items-center' : 'mt-1.5')}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center transition-colors duration-150',
                        collapsed
                          ? 'h-10 w-10 justify-center rounded-xl'
                          : 'w-full gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium',
                        isActive
                          ? 'bg-zinc-900/[0.06] text-zinc-950 ring-1 ring-inset ring-zinc-950/[0.06] dark:bg-white/[0.07] dark:text-white dark:ring-white/[0.08]'
                          : 'text-zinc-500 hover:bg-zinc-950/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !collapsed && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-zinc-900 dark:bg-zinc-100"
                          />
                        )}
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.1 : 1.8} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Profile */}
      <div
        className={cn(
          'border-t',
          BORDER,
          collapsed ? 'flex flex-col items-center gap-1.5 p-2' : 'p-3',
        )}
      >
        {collapsed ? (
          <>
            <Link
              to="/profile"
              title={user?.name || 'Perfil'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/15 transition-transform hover:scale-[1.04] dark:from-zinc-200 dark:to-zinc-400 dark:text-zinc-900"
            >
              {getInitials(user?.name)}
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              title="Sair"
              aria-label="Sair da conta"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-950/[0.07] bg-zinc-50 p-1.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex min-w-0 items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-zinc-950/[0.04] dark:hover:bg-white/[0.05]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/15 dark:from-zinc-200 dark:to-zinc-400 dark:text-zinc-900">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
                  {user?.name || 'Usuário'}
                </p>
                <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                  {user?.email || ''}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              title="Sair"
              aria-label="Sair da conta"
              className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-canvas flex min-h-screen text-zinc-900 dark:text-zinc-100">
      {/* Desktop collapsible sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'relative hidden shrink-0 border-r transition-all duration-300 lg:block',
          BORDER,
          isCollapsed ? 'w-[4.25rem] cursor-pointer' : 'w-[17rem]',
        )}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (isCollapsed && !target.closest('a, button')) {
            setIsCollapsed(false);
          }
        }}
        title={isCollapsed ? 'Clique para expandir' : undefined}
      >
        <div className="sticky top-0 h-screen">{renderSidebarContent(isCollapsed)}</div>
      </aside>

      {/* Mobile drawer sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={cn('relative z-10 h-full w-72 max-w-[85vw] border-r', BORDER)}>
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-[#fafaf9]/80 px-4 backdrop-blur-md sm:px-6 dark:bg-[#101012]/80',
            BORDER,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              id="sidebar-toggle-btn"
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(true);
                } else {
                  setIsCollapsed((prev) => !prev);
                }
              }}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-950/[0.05] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100"
              aria-label="Alternar menu"
              title="Alternar menu"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
            <nav aria-label="Caminho" className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="hidden max-w-40 truncate font-medium text-zinc-400 sm:inline dark:text-zinc-500">
                {company?.name || 'Minha Empresa'}
              </span>
              <span aria-hidden="true" className="hidden text-zinc-300 sm:inline dark:text-zinc-700">
                /
              </span>
              <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                {pageTitle}
              </span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-950/[0.05] hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-zinc-100"
              aria-label={
                theme === 'light'
                  ? 'Ativar modo escuro'
                  : theme === 'dark'
                    ? 'Ativar modo sistema'
                    : 'Ativar modo claro'
              }
              title={
                theme === 'light'
                  ? 'Modo escuro'
                  : theme === 'dark'
                    ? 'Modo sistema'
                    : 'Modo claro'
              }
            >
              {theme === 'light' ? (
                <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              ) : theme === 'dark' ? (
                <Monitor className="h-[18px] w-[18px]" strokeWidth={1.8} />
              ) : (
                <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} />
              )}
            </button>

            <div aria-hidden="true" className="mx-0.5 h-5 w-px bg-zinc-950/10 dark:bg-white/10" />

            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.08] bg-white px-3 py-[7px] text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:hover:text-white whitespace-nowrap shrink-0"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
