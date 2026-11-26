import IconButton from '@mui/material/IconButton';
import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  Users,
  UsersRound,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronDown,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { LogoMark } from '@/src/components/common/LogoMark';
import { getInitials } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';
import { useTheme } from '@/src/theme/ThemeContext';

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
      { to: '/agenda', label: 'Agenda', icon: CalendarDays },
      { to: '/disparos', label: 'Disparos', icon: UsersRound },
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
    ],
  },
];

const BORDER = 'border-zinc-950/[0.07] dark:border-white/[0.07]';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const;

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Visão Geral';
  if (pathname === '/crms') return 'CRMs';
  if (pathname === '/crms/dashboard') return 'Dashboard de todos os CRMs';
  if (/^\/crms\/\d+\/board/.test(pathname)) return 'Quadro Kanban';
  if (/^\/groups\/\d+/.test(pathname) || /^\/disparos\/\d+/.test(pathname)) return 'Grupo';
  if (/^\/crms\/\d+\/integration/.test(pathname)) return 'Integração pública';
  if (/^\/crms\/\d+\/audit/.test(pathname)) return 'Auditoria de mudanças';
  if (/^\/crms\/\d+\/dashboard/.test(pathname)) return 'Visão geral';
  if (/^\/leads\/\d+/.test(pathname)) return 'Detalhes do Lead';
  if (pathname === '/agenda') return 'Agenda';
  if (pathname === '/sending-templates') return 'Templates de E-mail';
  if (pathname === '/groups' || pathname === '/disparos') return 'Disparos';
  if (pathname === '/email-configs') return 'Configuração de e-mail';
  if (pathname === '/whatsapp-senders') return 'Configurar WhatsApp';
  if (pathname === '/whatsapp-templates') return 'Templates WhatsApp';
  if (pathname === '/billing') return 'Planos e Assinatura';
  if (pathname === '/invoices') return 'Faturas';
  if (pathname === '/company') return 'Empresa';
  if (pathname === '/team') return 'Equipe';
  if (pathname === '/profile') return 'Meu Perfil';
  return 'SaldUp CRM';
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

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
          className="group flex min-w-0 items-center rounded-lg"
          title="SaldUp CRM"
          aria-label="SaldUp CRM — ir para Visão Geral"
        >
          <LogoMark className={collapsed ? 'h-9' : 'h-8'} />
        </Link>

        {!collapsed && (
          <div className="flex shrink-0 items-center gap-1">
            <IconButton size="small" onClick={() => setIsCollapsed(true)} aria-label="Recolher menu" title="Recolher menu" sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <IconButton size="small" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" sx={{ display: { xs: 'inline-flex', lg: 'none' } }}>
              <X className="h-5 w-5" />
            </IconButton>
          </div>
        )}

        {collapsed && (
          <IconButton size="small" onClick={() => setIsCollapsed(false)} aria-label="Expandir menu" title="Expandir menu">
            <ChevronRight className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>

      {/* Workspace switcher (mobile only — no desktop, /company já está no nav) */}
      {!collapsed && (
        <div className="px-3 py-3 lg:hidden">
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
            <IconButton size="small" id="sidebar-toggle-btn" sx={{ display: { xs: 'inline-flex', lg: 'none' } }} onClick={() => setMobileOpen(true)} aria-label="Abrir menu" title="Abrir menu">
              <Menu className="h-[18px] w-[18px]" />
            </IconButton>
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
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.08] bg-white py-1 pl-1 pr-2 text-[13px] font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Abrir menu do perfil"
                title={user?.name || 'Perfil'}
              >
                <span className="saldup-gradient-bg flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold ring-1 ring-inset ring-white/20">
                  {getInitials(user?.name)}
                </span>
                <span className="hidden max-w-28 truncate sm:inline">{user?.name || 'Perfil'}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-zinc-400 transition-transform',
                    profileOpen && 'rotate-180',
                  )}
                />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  aria-label="Opções do perfil"
                  className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-zinc-950/[0.08] bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.28)] dark:border-white/10 dark:bg-[#17171a]"
                >
                  <span aria-hidden="true" className="saldup-gradient-bg absolute inset-x-3 top-0 h-0.5 rounded-full" />
                  <div className="flex items-center gap-2.5 border-b border-zinc-950/[0.06] px-2 py-2.5 dark:border-white/[0.06]">
                    <span className="saldup-gradient-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ring-1 ring-inset ring-white/20">
                      {getInitials(user?.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {user?.name || 'Usuário'}
                      </span>
                      <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {user?.email || ''}
                      </span>
                    </span>
                  </div>
                  <div className="border-b border-zinc-950/[0.06] px-2 pb-2.5 pt-2 dark:border-white/[0.06]">
                       <div className="mb-1.5 flex items-center justify-between px-1">
                         <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                           Aparência
                         </span>
                         <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                           {THEME_OPTIONS.find((option) => option.value === theme)?.label}
                         </span>
                       </div>
                       <div
                         role="group"
                         aria-label="Tema do aplicativo"
                         className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-white/[0.05]"
                       >
                         {THEME_OPTIONS.map((option) => {
                           const Icon = option.icon;
                           const selected = theme === option.value;

                           return (
                             <button
                               key={option.value}
                               type="button"
                               role="menuitemradio"
                               aria-checked={selected}
                               onClick={() => setTheme(option.value)}
                               className={cn(
                                 'flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors',
                                 selected
                                   ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white'
                                   : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
                               )}
                             >
                               <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                               {option.label}
                             </button>
                           );
                         })}
                       </div>
                     </div>
                     <div className="py-1">
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-blue-50 hover:text-blue-800 dark:text-zinc-200 dark:hover:bg-blue-500/10 dark:hover:text-white"
                    >
                      <User className="h-4 w-4" strokeWidth={1.8} />
                      Meu perfil
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.8} />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
