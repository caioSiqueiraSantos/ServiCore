import React, { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  CheckSquare,
  Calendar,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  Database,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Logo } from '@/components/brand/Logo'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthContext'
import type { SystemStatusDto } from '@/types'

const navigationItems = [
  {
    category: 'Operacional',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Clientes', path: '/clientes', icon: Users },
      { name: 'Contratos', path: '/contratos', icon: FileText },
      { name: 'Serviços', path: '/servicos', icon: Briefcase },
      { name: 'Tarefas', path: '/tarefas', icon: CheckSquare },
      { name: 'Agenda', path: '/agenda', icon: Calendar },
    ],
  },
  {
    category: 'Financeiro',
    items: [
      { name: 'Financeiro', path: '/financeiro', icon: Wallet },
      { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    ],
  },
  {
    category: 'Sistema',
    items: [
      { name: 'Configurações', path: '/configuracoes', icon: Settings },
    ],
  },
]

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const { user, activeWorkspace, availableWorkspaces, logout, switchWorkspace } = useAuth()

  // Consulta status real da API e do SQLite para feedback imediato na UI
  const { data: systemInfo, isError, isLoading } = useQuery<SystemStatusDto>({
    queryKey: ['system-info'],
    queryFn: () => api.get<SystemStatusDto>('/health/system'),
    refetchInterval: 30000,
    retry: 1,
  })

  // Obtém o nome da página atual para exibição no cabeçalho
  const currentNav = navigationItems
    .flatMap((cat) => cat.items)
    .find((item) =>
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.path)
    )

  const pageTitle = currentNav?.name || 'Visão Geral'

  // Iniciais do usuário para o avatar
  const getInitials = (name?: string) => {
    if (!name) return 'SC'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#090A0F] text-[#F4F4F5]">
      {/* Overlay para Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Lateral */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-[#0E1017] border-r border-[#1E2332] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#1E2332]">
          <Logo size="sm" showBadge={false} subtitle="ERP Operacional" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded text-[#94A3B8] hover:text-[#F4F4F5] hover:bg-[#131620]"
            aria-label="Fechar menu lateral"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Selector (Contexto) */}
        <div className="px-3 py-2.5 border-b border-[#1E2332] relative">
          <div
            onClick={() => availableWorkspaces.length > 1 && setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className={cn(
              'p-2 rounded-lg bg-[#131620] border border-[#1E2332] flex items-center justify-between transition-colors',
              availableWorkspaces.length > 1
                ? 'cursor-pointer hover:border-[#2C3347]'
                : 'cursor-default'
            )}
          >
            <div className="overflow-hidden pr-2">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                Workspace Ativo
              </p>
              <p className="text-xs font-medium text-[#F4F4F5] truncate">
                {activeWorkspace?.name || 'Consultoria & Projetos'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] py-0.5 px-1.5 rounded bg-[#191D2B] text-[#94A3B8] border border-[#23293D] font-mono shrink-0">
                {activeWorkspace?.type === 'Enterprise' ? 'PJ' : 'PF'}
              </span>
              {availableWorkspaces.length > 1 && (
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              )}
            </div>
          </div>

          {/* Menu Dropdown de Workspaces (se houver mais de um) */}
          {workspaceMenuOpen && availableWorkspaces.length > 1 && (
            <div className="absolute left-3 right-3 top-14 mt-1 bg-[#131620] border border-[#1E2332] rounded-lg shadow-2xl p-1.5 z-50 space-y-1">
              <p className="text-[10px] uppercase font-semibold text-[#64748B] px-2 py-1">
                Trocar de Workspace
              </p>
              {availableWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id)
                    setWorkspaceMenuOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors',
                    ws.id === activeWorkspace?.id
                      ? 'bg-[#1D68F2]/15 text-[#38BDF8] font-medium'
                      : 'text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#181C28]'
                  )}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[9px] font-mono opacity-70">{ws.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {navigationItems.map((group) => (
            <div key={group.category} className="space-y-0.5">
              <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-wider text-[#64748B] uppercase">
                {group.category}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 group',
                        isActive
                          ? 'bg-[#161A26] text-[#F4F4F5] font-semibold border-l-2 border-[#1D68F2]'
                          : 'text-[#94A3B8] hover:text-[#F4F4F5] hover:bg-[#131620]'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors shrink-0',
                          isActive ? 'text-[#38BDF8]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Status Técnico da Conexão SQLite / API */}
        <div className="p-2.5 border-t border-[#1E2332] bg-[#0A0C12]">
          <div
            className="flex items-center justify-between px-2 py-1 text-xs text-[#94A3B8] rounded hover:bg-[#131620] transition-colors"
            title="Conexão do banco de dados local da aplicação"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[11px] font-medium text-[#94A3B8]">
                {systemInfo?.databaseProvider || 'SQLite Local'}
              </span>
            </div>
            {isLoading ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Conectando..." />
            ) : isError ? (
              <span className="w-2 h-2 rounded-full bg-red-400" title="Offline" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-mono">OK</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Superior Utilitário */}
        <header className="h-14 bg-[#0E1017]/90 backdrop-blur-md border-b border-[#1E2332] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-[#94A3B8] hover:text-[#F4F4F5] hover:bg-[#131620] transition-colors"
              aria-label="Abrir menu lateral"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#F4F4F5] tracking-tight">{pageTitle}</h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Campo de busca rápido com atalho */}
            <div className="hidden md:flex items-center relative w-60">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar clientes, faturas..."
                className="w-full bg-[#131620] border border-[#1E2332] rounded-md pl-8 pr-10 py-1 text-xs text-[#F4F4F5] placeholder-[#64748B] focus:outline-none focus:border-[#2C3347] transition-colors"
              />
              <kbd className="absolute right-2 text-[10px] text-[#64748B] bg-[#1A1E2C] border border-[#23293D] px-1 rounded pointer-events-none">
                ⌘K
              </kbd>
            </div>

            {/* Status do SQLite Discreto no Header */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#131620] border border-[#1E2332] text-[11px] text-[#94A3B8]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SQLite Conectado</span>
            </div>

            {/* Notificações & Perfil Autenticado */}
            <div className="flex items-center gap-2 border-l border-[#1E2332] pl-3 relative">
              <button
                className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F4F4F5] hover:bg-[#131620] relative transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-4 h-4" />
                <span className="w-1.5 h-1.5 bg-[#38BDF8] rounded-full absolute top-1.5 right-1.5" />
              </button>

              {/* Botão de Perfil do Usuário com Iniciais Reais */}
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-md hover:bg-[#131620] transition-colors cursor-pointer"
                title={user?.fullName || 'Perfil do Usuário'}
              >
                <div className="w-7 h-7 rounded-md bg-[#161A26] border border-[#282F44] flex items-center justify-center text-xs font-semibold text-[#38BDF8] hover:border-[#38BDF8]/40 transition-colors">
                  {getInitials(user?.fullName)}
                </div>
                <div className="hidden md:flex flex-col text-left leading-none">
                  <span className="text-xs font-medium text-[#F4F4F5] max-w-[120px] truncate">
                    {user?.fullName || 'Caio Consultor'}
                  </span>
                  <span className="text-[10px] text-[#64748B] max-w-[120px] truncate">
                    {user?.email || 'demo@servicore.com.br'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#64748B] hidden md:block" />
              </button>

              {/* Dropdown Menu do Usuário */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-10 mt-2 w-56 bg-[#11131C] border border-[#1E2332] rounded-lg shadow-2xl p-1.5 z-50 text-xs animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-[#1E2332]/60">
                    <p className="font-semibold text-[#F4F4F5] truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="sky" className="text-[9px] py-0 px-1">
                        {activeWorkspace?.role === 'Owner' ? 'Proprietário' : activeWorkspace?.role}
                      </Badge>
                      <span className="text-[10px] text-[#8E9CAE] truncate">{activeWorkspace?.name}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false)
                        navigate('/configuracoes')
                      }}
                      className="w-full text-left px-3 py-1.5 rounded hover:bg-[#161A26] text-[#8E9CAE] hover:text-[#F4F4F5] flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Configurações do Workspace</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#1E2332]/60">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-1.5 rounded hover:bg-[#EF4444]/10 text-[#F87171] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area com padding otimizado para área nobre */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
