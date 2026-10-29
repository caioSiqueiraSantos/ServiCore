import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Wallet,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Search,
  Eye,
  Edit2,
  Trash2,
  DollarSign,
  PieChart,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'
import type {
  Receivable,
  Expense,
  CashFlowSummary,
  ReceivableStatus,
  ExpenseStatus,
  ExpenseCategory,
} from '@/types'
import { ReceivableModal } from './ReceivableModal'
import { ExpenseModal } from './ExpenseModal'
import { PaymentModal } from './PaymentModal'
import { ReceivableDetailsDrawer } from './ReceivableDetailsDrawer'
import { PaymentSimulatorCard } from './PaymentSimulatorCard'

type ActiveTab = 'cashflow' | 'receivables' | 'expenses' | 'simulator'

export const FinancePage: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ActiveTab>('cashflow')

  // Modais e Gavetas
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false)
  const [receivableToEdit, setReceivableToEdit] = useState<Receivable | null>(null)

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [receivableForPayment, setReceivableForPayment] = useState<Receivable | null>(null)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)

  const [preselectedForSimulator, setPreselectedForSimulator] = useState<Receivable | null>(null)

  // Filtros de Contas a Receber
  const [receivableSearch, setReceivableSearch] = useState('')
  const [receivableStatusFilter, setReceivableStatusFilter] = useState<ReceivableStatus | ''>('')

  // Filtros de Despesas
  const [expenseSearch, setExpenseSearch] = useState('')
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<ExpenseCategory | ''>('')
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<ExpenseStatus | ''>('')

  // 1. Consulta do Resumo do Fluxo de Caixa
  const {
    data: cashFlow,
    isLoading: isLoadingCashFlow,
    isError: isErrorCashFlow,
    refetch: refetchCashFlow,
  } = useQuery<CashFlowSummary>({
    queryKey: ['cash-flow'],
    queryFn: () => api.get<CashFlowSummary>('/finance/cash-flow'),
  })

  // 2. Consulta de Contas a Receber
  const {
    data: receivables = [],
    isLoading: isLoadingReceivables,
    isError: isErrorReceivables,
    refetch: refetchReceivables,
  } = useQuery<Receivable[]>({
    queryKey: ['receivables', receivableStatusFilter, receivableSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      if (receivableStatusFilter) params.append('status', receivableStatusFilter)
      if (receivableSearch.trim()) params.append('search', receivableSearch.trim())
      return api.get<Receivable[]>(`/finance/receivables?${params.toString()}`)
    },
  })

  // 3. Consulta de Despesas
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    isError: isErrorExpenses,
    refetch: refetchExpenses,
  } = useQuery<Expense[]>({
    queryKey: ['expenses', expenseCategoryFilter, expenseStatusFilter, expenseSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      if (expenseCategoryFilter) params.append('category', expenseCategoryFilter)
      if (expenseStatusFilter) params.append('status', expenseStatusFilter)
      if (expenseSearch.trim()) params.append('search', expenseSearch.trim())
      return api.get<Expense[]>(`/finance/expenses?${params.toString()}`)
    },
  })

  // Mutação para liquidar despesa diretamente
  const payExpenseMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<Expense>(`/finance/expenses/${id}/pay`, {
        method: 'Pix',
        notes: 'Liquidado via painel de despesas',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
    },
  })

  // Mutação para excluir despesa
  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
    },
  })

  const isLoading = isLoadingCashFlow || isLoadingReceivables || isLoadingExpenses

  if (isLoading) {
    return <LoadingState message="Consolidando dados financeiros e fluxo de caixa..." />
  }

  if (isErrorCashFlow || isErrorReceivables || isErrorExpenses) {
    return (
      <ErrorState
        title="Erro ao carregar o módulo financeiro"
        message="Não foi possível sincronizar suas contas com o servidor."
        onRetry={() => {
          refetchCashFlow()
          refetchReceivables()
          refetchExpenses()
        }}
      />
    )
  }

  const overdueReceivablesCount = receivables.filter(
    (r) => r.status === 'Overdue' || (r.status === 'Pending' && new Date(r.dueDate) < new Date())
  ).length

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#F1F5F9]">Gestão Financeira & Fluxo de Caixa</h2>
            <Badge variant="positive">Etapa 4 Ativa</Badge>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Controle contas a receber com baixas parciais, despesas operacionais e simulador de pagamentos idempotente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setExpenseToEdit(null)
              setIsExpenseModalOpen(true)
            }}
            leftIcon={<ArrowDownRight className="w-4 h-4 text-[#F43F5E]" />}
          >
            Nova Despesa
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setReceivableToEdit(null)
              setIsReceivableModalOpen(true)
            }}
            leftIcon={<PlusCircle className="w-4 h-4 text-[#38BDF8]" />}
          >
            Nova Conta a Receber
          </Button>
        </div>
      </div>

      {/* Cards de Métricas e KPIs Financeiros */}
      {cashFlow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Saldo Líquido Realizado"
            value={formatCurrency(cashFlow.realizedNetBalanceCents)}
            subtitle="Recebido líquido vs Despesas pagas"
            variant={cashFlow.realizedNetBalanceCents >= 0 ? 'positive' : 'critical'}
            badgeText={cashFlow.realizedNetBalanceCents >= 0 ? '+ Positivo' : '- Negativo'}
            icon={
              cashFlow.realizedNetBalanceCents >= 0 ? (
                <TrendingUp className="w-5 h-5 text-[#34D399]" />
              ) : (
                <TrendingDown className="w-5 h-5 text-[#F43F5E]" />
              )
            }
          />

          <StatCard
            title="Total a Receber"
            value={formatCurrency(
              cashFlow.totalReceivablesPendingCents + cashFlow.totalReceivablesOverdueCents
            )}
            subtitle={
              overdueReceivablesCount > 0
                ? `${overdueReceivablesCount} fatura(s) vencida(s)`
                : 'Todas faturas no prazo'
            }
            variant={overdueReceivablesCount > 0 ? 'critical' : 'sky'}
            badgeText={
              overdueReceivablesCount > 0
                ? `Atraso: ${formatCurrency(cashFlow.totalReceivablesOverdueCents)}`
                : 'Em dia'
            }
            icon={<ArrowUpRight className="w-5 h-5 text-[#38BDF8]" />}
          />

          <StatCard
            title="Despesas Operacionais"
            value={formatCurrency(cashFlow.totalExpensesPaidCents)}
            subtitle={`A pagar: ${formatCurrency(cashFlow.totalExpensesPendingCents)}`}
            variant="warning"
            badgeText="Saídas liquidadas"
            icon={<ArrowDownRight className="w-5 h-5 text-[#F43F5E]" />}
          />

          <StatCard
            title="Saldo Projetado Futuro"
            value={formatCurrency(cashFlow.projectedNetBalanceCents)}
            subtitle="Previsão considerando vencimentos futuros"
            variant={cashFlow.projectedNetBalanceCents >= 0 ? 'positive' : 'warning'}
            badgeText="Projeção líquida"
            icon={<Wallet className="w-5 h-5 text-[#A78BFA]" />}
          />
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-[#273340] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'cashflow'
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
              : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#18212B]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Fluxo de Caixa Consolidado
        </button>

        <button
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'receivables'
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
              : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#18212B]'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-[#38BDF8]" />
          Contas a Receber ({receivables.length})
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'expenses'
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
              : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#18212B]'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-[#F43F5E]" />
          Contas a Pagar / Despesas ({expenses.length})
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'simulator'
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
              : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#18212B]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#34D399]" />
          Simulador Idempotente
        </button>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: FLUXO DE CAIXA CONSOLIDADO (GRÁFICOS E ATIVIDADE RECENTE) */}
      {/* ============================================================== */}
      {activeTab === 'cashflow' && cashFlow && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gráfico Visual de Linha / Barras do Fluxo Diário */}
            <div className="lg:col-span-8 bg-[#111820] border border-[#273340] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F1F5F9]">
                    Movimentações Diárias no Período
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Comparativo cronológico de entradas (recebimentos) vs saídas (despesas pagas)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#34D399]" />
                    <span className="text-[#94A3B8]">Entradas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#F43F5E]" />
                    <span className="text-[#94A3B8]">Saídas</span>
                  </div>
                </div>
              </div>

              {cashFlow.dailyFlow.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  Sem movimentações no período selecionado.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-20 gap-1.5 items-end h-44 p-3 bg-[#0B0F14] rounded-lg border border-[#273340] overflow-x-auto">
                    {cashFlow.dailyFlow.slice(-20).map((df) => {
                      const maxVal = Math.max(
                        ...cashFlow.dailyFlow.map((x) => Math.max(x.inflowCents, x.outflowCents)),
                        10000
                      )
                      const inflowPct = Math.min(100, Math.round((df.inflowCents / maxVal) * 100))
                      const outflowPct = Math.min(100, Math.round((df.outflowCents / maxVal) * 100))

                      return (
                        <div
                          key={df.date}
                          className="flex flex-col items-center gap-1 min-w-[28px] h-full justify-end group relative"
                        >
                          <div className="w-full flex items-end justify-center gap-0.5 h-32">
                            {/* Barra Entrada */}
                            <div
                              style={{ height: `${Math.max(4, inflowPct)}%` }}
                              className={`w-2 rounded-t transition-all ${
                                df.inflowCents > 0
                                  ? 'bg-[#34D399] group-hover:bg-[#4ade80]'
                                  : 'bg-[#18212B]'
                              }`}
                            />
                            {/* Barra Saída */}
                            <div
                              style={{ height: `${Math.max(4, outflowPct)}%` }}
                              className={`w-2 rounded-t transition-all ${
                                df.outflowCents > 0
                                  ? 'bg-[#F43F5E] group-hover:bg-[#fb7185]'
                                  : 'bg-[#18212B]'
                              }`}
                            />
                          </div>

                          <span className="text-[10px] text-[#64748B] font-mono">
                            {df.date.split('-')[2]}
                          </span>

                          {/* Tooltip com valores */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 bg-[#18212B] border border-[#273340] rounded shadow-xl text-[10px] z-30 whitespace-nowrap pointer-events-none">
                            <span className="font-bold text-[#F1F5F9]">{df.date}</span>
                            <span className="text-[#34D399]">
                              Entradas: {formatCurrency(df.inflowCents)}
                            </span>
                            <span className="text-[#F43F5E]">
                              Saídas: {formatCurrency(df.outflowCents)}
                            </span>
                            <span className="text-[#38BDF8] pt-1 border-t border-[#273340]">
                              Saldo: {formatCurrency(df.netCents)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Distribuição de Despesas por Categoria */}
            <div className="lg:col-span-4 bg-[#111820] border border-[#273340] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F1F5F9]">Distribuição por Categorias</h3>
                <PieChart className="w-4 h-4 text-[#38BDF8]" />
              </div>

              {cashFlow.categoryDistribution.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  Sem dados de categorias registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {cashFlow.categoryDistribution.map((cat) => (
                    <div key={cat.categoryName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#CBD5E1] truncate">{cat.categoryName}</span>
                        <span className="font-semibold text-[#F1F5F9]">
                          {formatCurrency(cat.amountCents)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#0B0F14] overflow-hidden">
                        <div
                          className="h-full bg-[#38BDF8] rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Atividades Recentes (Extrato Consolidado) */}
          <div className="bg-[#111820] border border-[#273340] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9]">Extrato de Lançamentos Recentes</h3>
                <p className="text-xs text-[#94A3B8]">
                  Últimos recebimentos confirmados e saídas operacionais liquidadas
                </p>
              </div>
            </div>

            {cashFlow.recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#94A3B8]">
                Nenhuma movimentação financeira liquidada recentemente.
              </div>
            ) : (
              <div className="divide-y divide-[#273340]">
                {cashFlow.recentActivities.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          act.type === 'Inflow'
                            ? 'bg-[#34D399]/10 text-[#34D399]'
                            : 'bg-[#F43F5E]/10 text-[#F43F5E]'
                        }`}
                      >
                        {act.type === 'Inflow' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-[#F1F5F9]">{act.title}</div>
                        <div className="text-[11px] text-[#94A3B8]">
                          {act.category || 'Geral'} &bull; {formatDate(act.date)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold font-mono ${
                          act.type === 'Inflow' ? 'text-[#34D399]' : 'text-[#F43F5E]'
                        }`}
                      >
                        {act.type === 'Inflow' ? '+' : '-'} {formatCurrency(act.amountCents)}
                      </div>
                      {act.reference && (
                        <div className="text-[10px] text-[#64748B] font-mono">
                          Ref: {act.reference}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 2: CONTAS A RECEBER (RECEIVABLES) */}
      {/* ============================================================== */}
      {activeTab === 'receivables' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Barra de Busca e Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111820] border border-[#273340] rounded-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar por fatura, cliente ou escopo..."
                value={receivableSearch}
                onChange={(e) => setReceivableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0B0F14] border border-[#273340] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={receivableStatusFilter}
                onChange={(e) => setReceivableStatusFilter(e.target.value as ReceivableStatus | '')}
                className="px-3 py-1.5 bg-[#0B0F14] border border-[#273340] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="">Todos os Status</option>
                <option value="Pending">Pendentes</option>
                <option value="PartiallyPaid">Parcialmente Pagas</option>
                <option value="Paid">Quitadas</option>
                <option value="Overdue">Atrasadas</option>
              </select>

              <Button
                size="sm"
                onClick={() => {
                  setReceivableToEdit(null)
                  setIsReceivableModalOpen(true)
                }}
                leftIcon={<PlusCircle className="w-3.5 h-3.5 text-[#38BDF8]" />}
              >
                Nova Conta
              </Button>
            </div>
          </div>

          {/* Listagem em Tabela */}
          {receivables.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-8 h-8 text-[#38BDF8]" />}
              title="Nenhuma conta a receber encontrada"
              description="Cadastre seus faturamentos, honorários ou gere parcelas a partir de contratos aprovados."
              actionLabel="Cadastrar Primeira Conta"
              onAction={() => {
                setReceivableToEdit(null)
                setIsReceivableModalOpen(true)
              }}
            />
          ) : (
            <div className="bg-[#111820] border border-[#273340] rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18212B]/70 border-b border-[#273340] text-[#94A3B8] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Fatura / Título</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Progresso / Saldo</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#273340]">
                    {receivables.map((r) => {
                      const isOverdue =
                        r.status === 'Overdue' ||
                        (r.status !== 'Paid' && new Date(r.dueDate) < new Date())
                      const percent =
                        r.amountCents > 0
                          ? Math.min(100, Math.round((r.paidAmountCents / r.amountCents) * 100))
                          : 0

                      return (
                        <tr key={r.id} className="hover:bg-[#18212B]/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#F1F5F9]">{r.title}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#94A3B8]">
                              <span>{r.categoryName}</span>
                              {r.totalInstallments && r.totalInstallments > 1 && (
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#273340] text-[#CBD5E1]">
                                  {r.installmentNumber}/{r.totalInstallments}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[#CBD5E1]">
                            <div className="font-medium text-[#F1F5F9]">{r.customerName}</div>
                            {r.contractTitle && (
                              <div className="text-[11px] text-[#94A3B8] truncate max-w-[150px]">
                                {r.contractTitle}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div
                              className={`flex items-center gap-1.5 font-medium ${
                                isOverdue ? 'text-red-400 font-bold' : 'text-[#F1F5F9]'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(r.dueDate)}</span>
                            </div>
                            {isOverdue && (
                              <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Vencida
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-[#F1F5F9]">
                            {formatCurrency(r.amountCents)}
                          </td>

                          <td className="py-3.5 px-4 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-[#34D399] font-medium">
                                {formatCurrency(r.paidAmountCents)}
                              </span>
                              <span className="text-[#94A3B8]">
                                Resta: {formatCurrency(r.remainingAmountCents)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  percent === 100
                                    ? 'bg-[#34D399]'
                                    : percent > 0
                                    ? 'bg-[#38BDF8]'
                                    : 'bg-[#273340]'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {r.status === 'Paid' && <Badge variant="positive">Quitado</Badge>}
                            {r.status === 'PartiallyPaid' && (
                              <Badge variant="sky">Parcial ({percent}%)</Badge>
                            )}
                            {r.status === 'Overdue' && <Badge variant="critical">Atrasado</Badge>}
                            {r.status === 'Pending' && <Badge variant="warning">Pendente</Badge>}
                            {r.status === 'Cancelled' && <Badge variant="default">Cancelado</Badge>}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedReceivable(r)
                                  setIsDrawerOpen(true)
                                }}
                                title="Ver Detalhes e Baixas"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#273340] transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {r.status !== 'Paid' && r.status !== 'Cancelled' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setReceivableForPayment(r)
                                      setIsPaymentModalOpen(true)
                                    }}
                                    title="Dar Baixa de Pagamento"
                                    className="p-1.5 rounded-lg text-[#34D399] hover:bg-[#34D399]/15 transition-colors"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setPreselectedForSimulator(r)
                                      setActiveTab('simulator')
                                    }}
                                    title="Testar no Simulador Idempotente"
                                    className="p-1.5 rounded-lg text-[#FBBF24] hover:bg-[#FBBF24]/15 transition-colors"
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setReceivableToEdit(r)
                                  setIsReceivableModalOpen(true)
                                }}
                                title="Editar"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#273340] transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: CONTAS A PAGAR / DESPESAS (EXPENSES) */}
      {/* ============================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111820] border border-[#273340] rounded-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar por descrição, fornecedor..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0B0F14] border border-[#273340] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value as ExpenseCategory | '')}
                className="px-3 py-1.5 bg-[#0B0F14] border border-[#273340] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="">Todas Categorias</option>
                <option value="SoftwareAndTools">Softwares & Ferramentas</option>
                <option value="OfficeAndCoworking">Escritório & Coworking</option>
                <option value="MarketingAndSales">Marketing & Vendas</option>
                <option value="TaxesAndAccounting">Impostos & Contabilidade</option>
                <option value="EquipmentAndHardware">Equipamentos</option>
                <option value="ThirdPartyServices">Terceiros</option>
                <option value="SalariesAndWithdrawals">Pró-Labore</option>
                <option value="Other">Outras</option>
              </select>

              <select
                value={expenseStatusFilter}
                onChange={(e) => setExpenseStatusFilter(e.target.value as ExpenseStatus | '')}
                className="px-3 py-1.5 bg-[#0B0F14] border border-[#273340] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="">Todos os Status</option>
                <option value="Pending">A Pagar</option>
                <option value="Paid">Pagas</option>
                <option value="Overdue">Vencidas</option>
              </select>

              <Button
                size="sm"
                onClick={() => {
                  setExpenseToEdit(null)
                  setIsExpenseModalOpen(true)
                }}
                leftIcon={<PlusCircle className="w-3.5 h-3.5 text-[#F43F5E]" />}
              >
                Nova Despesa
              </Button>
            </div>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon={<ArrowDownRight className="w-8 h-8 text-[#F43F5E]" />}
              title="Nenhuma despesa operacional cadastrada"
              description="Controle despesas de software, coworking, servidores em nuvem e impostos."
              actionLabel="Cadastrar Primeira Despesa"
              onAction={() => {
                setExpenseToEdit(null)
                setIsExpenseModalOpen(true)
              }}
            />
          ) : (
            <div className="bg-[#111820] border border-[#273340] rounded-xl overflow-hidden shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18212B]/70 border-b border-[#273340] text-[#94A3B8] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Fornecedor</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#273340]">
                    {expenses.map((e) => {
                      const isOverdue =
                        e.status === 'Overdue' ||
                        (e.status === 'Pending' && new Date(e.dueDate) < new Date())

                      return (
                        <tr key={e.id} className="hover:bg-[#18212B]/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#F1F5F9]">
                            {e.description}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-[#18212B] text-[#94A3B8] text-[11px]">
                              {e.categoryName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[#CBD5E1]">
                            {e.supplier || <span className="text-[#64748B]">—</span>}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`font-medium ${
                                isOverdue ? 'text-red-400 font-bold' : 'text-[#F1F5F9]'
                              }`}
                            >
                              {formatDate(e.dueDate)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-[#F43F5E]">
                            {formatCurrency(e.amountCents)}
                          </td>

                          <td className="py-3.5 px-4">
                            {e.status === 'Paid' ? (
                              <Badge variant="positive">Pago</Badge>
                            ) : isOverdue ? (
                              <Badge variant="critical">Vencido</Badge>
                            ) : (
                              <Badge variant="warning">A Pagar</Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {e.status !== 'Paid' && (
                                <button
                                  onClick={() => payExpenseMutation.mutate(e.id)}
                                  disabled={payExpenseMutation.isPending}
                                  title="Marcar como Paga"
                                  className="p-1.5 rounded-lg text-[#34D399] hover:bg-[#34D399]/15 transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setExpenseToEdit(e)
                                  setIsExpenseModalOpen(true)
                                }}
                                title="Editar"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#273340] transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Deseja excluir a despesa "${e.description}"?`)) {
                                    deleteExpenseMutation.mutate(e.id)
                                  }
                                }}
                                title="Excluir"
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 4: SIMULADOR DE PAGAMENTOS IDEMPOTENTE */}
      {/* ============================================================== */}
      {activeTab === 'simulator' && (
        <div className="animate-in fade-in">
          <PaymentSimulatorCard
            receivables={receivables}
            preselectedReceivable={preselectedForSimulator}
          />
        </div>
      )}

      {/* Modais e Gavetas Conectadas */}
      <ReceivableModal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
        receivableToEdit={receivableToEdit}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      {receivableForPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
            setReceivableForPayment(null)
          }}
          receivable={receivableForPayment}
        />
      )}

      <ReceivableDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedReceivable(null)
        }}
        receivable={selectedReceivable}
        onOpenPaymentModal={(r) => {
          setReceivableForPayment(r)
          setIsPaymentModalOpen(true)
        }}
        onOpenSimulator={(r) => {
          setPreselectedForSimulator(r)
          setActiveTab('simulator')
        }}
      />
    </div>
  )
}
