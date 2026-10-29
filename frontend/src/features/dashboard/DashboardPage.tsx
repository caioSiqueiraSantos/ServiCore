import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Receipt,
  FileCheck2,
  CalendarCheck2,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  FilePlus2,
  ListPlus,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Check,
  Copy,
  X,
  FileText,
  Activity,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { DashboardOverview, UrgentOverdueInvoice } from '@/types'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  // Estado interativo para check de compromissos diretamente no dashboard
  const [completedCommitments, setCompletedCommitments] = useState<Record<string, boolean>>({})

  // Estado para modal e seleção de faturas vencidas vinculadas a clientes/contratos
  const [chargeModalOpen, setChargeModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<UrgentOverdueInvoice | null>(null)
  const [paidInvoices, setPaidInvoices] = useState<Record<string, boolean>>({})
  const [pixCopied, setPixCopied] = useState(false)

  // Consome a visão geral consolidada real da API ASP.NET Core
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get<DashboardOverview>('/dashboard/overview'),
    staleTime: 30000,
  })

  if (isLoading) {
    return <LoadingState message="Consolidando métricas em tempo real do ServiCore..." fullPage />
  }

  if (isError || !overview) {
    return (
      <ErrorState
        title="Não foi possível sincronizar o painel executivo"
        message="Verifique se o backend ASP.NET Core e o banco de dados estão respondendo normalmente."
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    )
  }

  const { kpis, urgentOverdueInvoices, upcomingCommitments, monthlyCashFlowSeries, recentActivities } = overview

  const toggleCommitment = (id: string) => {
    setCompletedCommitments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const generatePixKey = (invoice: UrgentOverdueInvoice) => {
    return `00020126580014br.gov.bcb.pix0136servicore-cobranca-${invoice.receivableId.substring(0, 8)}520400005303986540${(invoice.remainingCents / 100).toFixed(2)}5802BR5925SERVICORE LTDA6009SAO PAULO62070503***6304`
  }

  const handleCopyPix = (pixText: string) => {
    navigator.clipboard.writeText(pixText)
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 2000)
  }

  const handleMarkAsPaid = (invoiceId: string) => {
    setPaidInvoices((prev) => ({
      ...prev,
      [invoiceId]: true,
    }))
  }

  // Cálculo de escala dinâmica para o gráfico de fluxo de caixa semestral
  const maxCents = Math.max(
    ...monthlyCashFlowSeries.flatMap((p) => [p.receivedCents, p.expensesCents]),
    100000 // R$ 1.000 mínimo para manter proporções agradáveis quando zerado
  )

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Topo Operacional Integrado: Título + Resumo em Tempo Real */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E2332]">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E9CAE]">
            Painel Executivo & Operações Unificadas
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Dados sincronizados em tempo real com auditoria ativa
          </p>
        </div>

        {/* Resumo Operacional da Semana promovido no topo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#11131C] border border-[#1E2332] text-xs hover:border-[#2C3347] cursor-pointer transition-colors shrink-0"
            title="Ver carteira de clientes ativos"
          >
            <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#8E9CAE]">Clientes:</span>
            <span className="font-semibold text-[#F4F4F5] tabular-nums">
              {kpis.totalCustomersCount} ativos
            </span>
          </div>

          <div
            onClick={() => navigate('/contratos')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#11131C] border border-[#1E2332] text-xs hover:border-[#2C3347] cursor-pointer transition-colors shrink-0"
            title="Ver contratos em andamento"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[#8E9CAE]">Contratos:</span>
            <span className="font-semibold text-[#F4F4F5] tabular-nums">
              {kpis.activeContractsCount} ativos
            </span>
          </div>

          <div
            onClick={() => navigate('/tarefas')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#11131C] border border-[#1E2332] text-xs hover:border-[#2C3347] cursor-pointer transition-colors shrink-0"
            title="Ver tarefas pendentes"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-[#8E9CAE]">Tarefas:</span>
            <span className="font-semibold text-[#F4F4F5] tabular-nums">
              {kpis.ongoingTasksCount} pendentes
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Atalhos Operacionais */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider mr-1 hidden md:inline">
            Ações Rápidas:
          </span>

          <button
            type="button"
            onClick={() => navigate('/contratos')}
            className="h-8 px-3 rounded-md bg-[#161A26] border border-[#282F44] hover:bg-[#1D2233] hover:border-[#38BDF8]/40 text-[#F4F4F5] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Criar Contrato</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="h-8 px-3 rounded-md bg-[#11131C] border border-[#1E2332] hover:bg-[#161A26] hover:border-[#2C3347] text-[#94A3B8] hover:text-[#F4F4F5] text-xs transition-colors flex items-center gap-1.5 cursor-pointer group"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#94A3B8]" />
            <span>Novo Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/tarefas')}
            className="h-8 px-3 rounded-md bg-[#11131C] border border-[#1E2332] hover:bg-[#161A26] hover:border-[#2C3347] text-[#94A3B8] hover:text-[#F4F4F5] text-xs transition-colors flex items-center gap-1.5 cursor-pointer group"
          >
            <ListPlus className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#94A3B8]" />
            <span>Nova Tarefa</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/financeiro')}
            className="h-8 px-3 rounded-md bg-[#11131C] border border-[#1E2332] hover:bg-[#161A26] hover:border-[#2C3347] text-[#94A3B8] hover:text-[#F4F4F5] text-xs transition-colors flex items-center gap-1.5 cursor-pointer group"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#94A3B8]" />
            <span>Lançar Financeiro</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="sky" className="text-[10px] font-mono">
            Produção v1.0
          </Badge>
        </div>
      </div>

      {/* Cards de Métricas Financeiras Principais (KPIs Reais) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Receitas Recebidas"
          value={formatCurrency(kpis.totalReceivedCents)}
          variant="positive"
          badgeText="Entrada realizada"
          subtitle="Total acumulado em caixa"
          icon={<TrendingUp className="w-4 h-4" />}
          onClick={() => navigate('/financeiro')}
        />

        <StatCard
          title="A Receber (Pendentes)"
          value={formatCurrency(kpis.pendingReceivablesCents)}
          variant="sky"
          badgeText="Em carteira"
          subtitle="Títulos faturados a vencer"
          icon={<Clock className="w-4 h-4" />}
          onClick={() => navigate('/financeiro')}
        />

        <StatCard
          title="Valores Vencidos"
          value={formatCurrency(kpis.overdueReceivablesCents)}
          variant="critical"
          badgeText={
            urgentOverdueInvoices.length > 0
              ? `${urgentOverdueInvoices.length} ${urgentOverdueInvoices.length === 1 ? 'fatura em atraso' : 'faturas em atraso'}`
              : 'Sem títulos vencidos'
          }
          subtitle="Cobrança ativa prioritária"
          icon={<AlertTriangle className="w-4 h-4" />}
          onClick={() => {
            if (urgentOverdueInvoices.length > 0) {
              setSelectedInvoice(urgentOverdueInvoices[0])
              setChargeModalOpen(true)
            } else {
              navigate('/financeiro')
            }
          }}
          action={
            urgentOverdueInvoices.length > 0
              ? {
                  label: `Emitir cobrança (${urgentOverdueInvoices.length})`,
                  icon: <FileText className="w-3.5 h-3.5" />,
                  onClick: () => {
                    setSelectedInvoice(urgentOverdueInvoices[0])
                    setChargeModalOpen(true)
                  },
                }
              : undefined
          }
        />

        <StatCard
          title="Despesas Liquidadas"
          value={formatCurrency(kpis.paidExpensesCents)}
          variant="warning"
          badgeText="Saídas pagas"
          subtitle="Despesas operacionais e fixas"
          icon={<Receipt className="w-4 h-4" />}
          onClick={() => navigate('/financeiro')}
        />
      </div>

      {/* Grids Centrais: Gráfico Semestral e Próximos Compromissos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico do Fluxo de Caixa Real Consolidado */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fluxo de Caixa Operacional</CardTitle>
                <CardDescription>
                  Comparativo semestral entre receitas recebidas e despesas pagas
                </CardDescription>
              </div>
              <Badge variant="default" className="text-[11px] font-mono">
                Semestral
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-1">
              {/* Legenda */}
              <div className="flex items-center justify-end gap-5 text-xs text-[#8E9CAE] pb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#1D68F2]" /> Receita Recebida
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]/75" /> Despesa Paga
                </span>
              </div>

              {/* Colunas do Gráfico */}
              <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 pt-2 border-b border-[#1E2332] pb-2">
                {monthlyCashFlowSeries.map((item) => {
                  const heightRec = Math.max(Math.round((item.receivedCents / maxCents) * 100), 2)
                  const heightExp = Math.max(Math.round((item.expensesCents / maxCents) * 100), 2)

                  return (
                    <div key={item.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-32">
                        {/* Barra Receita */}
                        <div
                          className="w-1/2 max-w-[20px] bg-[#1D68F2] hover:bg-[#2563EB] rounded-t-xs transition-all duration-150 relative cursor-pointer"
                          style={{ height: `${item.receivedCents > 0 ? heightRec : 4}%` }}
                          title={`Receitas em ${item.month}: ${formatCurrency(item.receivedCents)}`}
                        />
                        {/* Barra Despesa */}
                        <div
                          className="w-1/2 max-w-[20px] bg-[#EF4444]/75 hover:bg-[#EF4444] rounded-t-xs transition-all duration-150 relative cursor-pointer"
                          style={{ height: `${item.expensesCents > 0 ? heightExp : 4}%` }}
                          title={`Despesas em ${item.month}: ${formatCurrency(item.expensesCents)}`}
                        />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono text-[#8E9CAE] group-hover:text-[#F4F4F5] truncate">
                        {item.month}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-0.5">
                <span>
                  Saldo Líquido Realizado:{' '}
                  <strong className={kpis.realizedNetBalanceCents >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                    {formatCurrency(kpis.realizedNetBalanceCents)}
                  </strong>
                </span>
                <span className="font-mono">Dados auditados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Compromissos Interativos */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Próximos Compromissos</CardTitle>
                  <CardDescription>Entregas e compromissos da agenda</CardDescription>
                </div>
                <CalendarCheck2 className="w-4 h-4 text-[#38BDF8]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4 sm:p-5">
              {upcomingCommitments.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#64748B]">
                  Nenhum evento agendado para os próximos 7 dias.
                </div>
              ) : (
                upcomingCommitments.map((event) => {
                  const isCompleted = Boolean(completedCommitments[event.id] ?? event.isCompleted)
                  const isMeeting = event.type === 'Meeting' || event.typeName.toLowerCase().includes('reuni')

                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isCompleted
                          ? 'bg-[#10131B]/60 border-[#1E2332]/60 opacity-60'
                          : 'bg-[#11131C] border-[#1E2332] hover:border-[#2C3347]'
                      } flex items-start justify-between gap-3`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleCommitment(event.id)}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                            isCompleted
                              ? 'bg-[#10B981] border-[#10B981] text-[#090A0F]'
                              : 'border-[#2C3347] hover:border-[#38BDF8] bg-[#161A26]'
                          }`}
                          title={isCompleted ? 'Desmarcar conclusão' : 'Marcar como concluído'}
                        >
                          {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="space-y-0.5 min-w-0">
                          <p
                            className={`text-xs font-semibold leading-tight truncate ${
                              isCompleted ? 'line-through text-[#64748B]' : 'text-[#F4F4F5]'
                            }`}
                          >
                            {event.title}
                          </p>
                          {event.customerName && (
                            <p className="text-[11px] text-[#8E9CAE] truncate">Cliente: {event.customerName}</p>
                          )}
                          <p className="text-[10px] text-[#64748B] font-mono">{formatDate(event.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isMeeting && !isCompleted && (
                          <a
                            href={event.locationOrLink?.startsWith('http') ? event.locationOrLink : 'https://meet.google.com'}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-[#161A26] border border-[#23293D] text-[#8E9CAE] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition-colors"
                            title="Abrir sala de reunião online"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <Badge
                          variant={isCompleted ? 'positive' : event.type === 'Delivery' ? 'positive' : 'sky'}
                          className="text-[10px] py-0 px-1.5 font-mono"
                        >
                          {isCompleted ? 'Concluído' : event.typeName}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </div>

          <div className="p-4 pt-0 border-t border-[#1E2332]/60 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs justify-center hover:text-[#38BDF8]"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/agenda')}
            >
              Ver agenda completa
            </Button>
          </div>
        </Card>
      </div>

      {/* Trilha de Auditoria & Atividades Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#38BDF8]" />
              <div>
                <CardTitle className="text-sm">Trilha de Auditoria Operacional & Segurança</CardTitle>
                <CardDescription>
                  Registro cronológico imutável de eventos e ações executadas no workspace
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#34D399] font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditoria Ativa</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#64748B]">
              Nenhum registro de auditoria disponível no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#11131C] border border-[#1E2332] text-xs hover:border-[#2C3347] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-[#191D2B] border border-[#242B3E] font-mono text-[10px] text-[#38BDF8] shrink-0">
                      {item.action}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-[#F4F4F5] truncate">{item.description}</p>
                      <p className="text-[11px] text-[#64748B]">
                        Entidade: <span className="text-[#8E9CAE] font-medium">{item.entityName}</span>
                        {item.userFullName && ` • Por: ${item.userFullName}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono shrink-0 pl-2">
                    {formatDateTime(item.timestampUtc)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cobrança de Faturas Vencidas */}
      {chargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0E1017] border border-[#1E2332] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2332]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-[#EF4444]/15 text-[#EF4444]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">
                    {selectedInvoice ? `Cobrança de Fatura` : 'Títulos em Atraso'}
                  </h3>
                  <p className="text-xs text-[#8E9CAE]">
                    {selectedInvoice ? `Cliente: ${selectedInvoice.customerName}` : 'Selecione a fatura para emitir cobrança'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChargeModalOpen(false)
                  setSelectedInvoice(null)
                }}
                className="p-1 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo Nível 1: Seleção de Fatura */}
            {!selectedInvoice ? (
              <div className="space-y-3">
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {urgentOverdueInvoices.map((inv) => {
                    const isPaid = Boolean(paidInvoices[inv.receivableId])

                    return (
                      <div
                        key={inv.receivableId}
                        onClick={() => !isPaid && setSelectedInvoice(inv)}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isPaid
                            ? 'bg-[#10131B]/50 border-[#1E2332]/60 opacity-60 cursor-default'
                            : 'bg-[#11131C] border-[#1E2332] hover:border-[#EF4444]/40 hover:bg-[#140D10]/50 cursor-pointer group'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <p className="text-xs font-semibold text-[#F4F4F5] truncate">{inv.invoiceTitle}</p>
                            <p className="text-xs text-[#8E9CAE] truncate">{inv.customerName}</p>
                            {inv.contractTitle && (
                              <p className="text-[11px] text-[#64748B] truncate">{inv.contractTitle}</p>
                            )}
                            <div className="flex items-center gap-2 pt-1 text-[10px] text-[#8E9CAE]">
                              <span>Vencimento: {formatDate(inv.dueDate)}</span>
                              <span>•</span>
                              <span className="text-[#EF4444] font-medium">{inv.daysOverdue} dias de atraso</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                            <span className="text-xs font-bold text-[#F87171] tabular-nums font-mono-numbers">
                              {formatCurrency(inv.remainingCents)}
                            </span>
                            {isPaid ? (
                              <Badge variant="positive" className="text-[10px] py-0 px-1.5 font-mono">
                                Pago
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedInvoice(inv)
                                }}
                                className="mt-2 text-xs font-medium text-[#38BDF8] group-hover:text-white flex items-center gap-1 transition-colors"
                              >
                                <span>Cobrar</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Conteúdo Nível 2: Cobrança Ativa da Fatura */
              <div className="space-y-3.5 text-xs">
                {urgentOverdueInvoices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="text-xs text-[#8E9CAE] hover:text-[#F4F4F5] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para lista de títulos</span>
                  </button>
                )}

                <div className="p-3.5 rounded-lg bg-[#140D10] border border-[#EF4444]/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#F4F4F5]">{selectedInvoice.invoiceTitle}</p>
                      <p className="text-xs text-[#F4F4F5] mt-0.5">{selectedInvoice.customerName}</p>
                      {selectedInvoice.contractTitle && (
                        <p className="text-[11px] text-[#8E9CAE]">{selectedInvoice.contractTitle}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#8E9CAE]">Saldo Devido:</p>
                      <p className="text-sm font-bold text-[#F87171] tabular-nums font-mono-numbers">
                        {formatCurrency(selectedInvoice.remainingCents)}
                      </p>
                      <span className="text-[10px] text-[#EF4444] font-medium">
                        {selectedInvoice.daysOverdue} dias de atraso
                      </span>
                    </div>
                  </div>
                </div>

                {/* Opção Pix */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E9CAE] block">
                    Chave Pix para quitação:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatePixKey(selectedInvoice)}
                      className="flex-1 bg-[#131620] border border-[#1E2332] rounded-md px-2.5 py-1.5 text-xs text-[#8E9CAE] font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyPix(generatePixKey(selectedInvoice))}
                      className="h-8 px-2.5 rounded-md bg-[#161A26] border border-[#282F44] hover:bg-[#1D2233] text-xs font-medium flex items-center gap-1.5 text-[#F4F4F5] transition-colors cursor-pointer shrink-0"
                    >
                      {pixCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="text-[#10B981]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Disparo WhatsApp */}
                <div className="pt-1 space-y-2">
                  <a
                    href={`https://wa.me/${(selectedInvoice.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${selectedInvoice.customerName}, tudo bem? Identificamos que o título "${selectedInvoice.invoiceTitle}" no valor de ${formatCurrency(selectedInvoice.remainingCents)} com vencimento em ${formatDate(selectedInvoice.dueDate)} consta em aberto. Segue a chave Pix para regularização: ${generatePixKey(selectedInvoice)}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-9 rounded-md bg-[#10B981] hover:bg-[#059669] text-[#090A0F] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Disparar Cobrança via WhatsApp</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkAsPaid(selectedInvoice.receivableId)}
                      className="flex-1 h-8 rounded-md bg-[#161A26] border border-[#1E2332] hover:bg-[#1C2130] text-xs font-medium text-[#F4F4F5] transition-colors"
                    >
                      {paidInvoices[selectedInvoice.receivableId] ? '✓ Marcado como Regularizado' : 'Marcar Regularizado'}
                    </button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setChargeModalOpen(false)
                        navigate('/financeiro')
                      }}
                    >
                      Ver no Financeiro
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
