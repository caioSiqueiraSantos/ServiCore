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
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import type { DemoDashboardStats } from '@/types'

export interface OverdueInvoice {
  id: string
  invoiceNumber: string
  contractNumber: string
  contractTitle: string
  clientName: string
  amountCents: number
  dueDate: string
  daysOverdue: number
  pixKey: string
  phone?: string
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  // Estado interativo para check de compromissos diretamente no dashboard
  const [completedCommitments, setCompletedCommitments] = useState<Record<number, boolean>>({})

  // Estado para modal e seleção de faturas vencidas vinculadas a clientes/contratos
  const [chargeModalOpen, setChargeModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<OverdueInvoice | null>(null)
  const [paidInvoices, setPaidInvoices] = useState<Record<string, boolean>>({})
  const [pixCopied, setPixCopied] = useState(false)

  // Faturas vencidas em carteira vinculadas a clientes e contratos
  const overdueInvoices: OverdueInvoice[] = [
    {
      id: 'inv-4928',
      invoiceNumber: '#4928',
      contractNumber: 'CT-2026/04',
      contractTitle: 'Consultoria de Design de Interiores',
      clientName: 'Studio Alfa Arquitetura',
      amountCents: 185000,
      dueDate: '2026-10-15',
      daysOverdue: 6,
      pixKey: '00020126580014br.gov.bcb.pix0136servicore-cobranca-fatura-49280054000053039865802BR5925SERVICORE LTDA6009SAO PAULO62070503***6304E2D1',
      phone: '+55 11 99882-1001',
    },
    {
      id: 'inv-4890',
      invoiceNumber: '#4890',
      contractNumber: 'CT-2026/01',
      contractTitle: 'Manutenção Mensal de Infraestrutura',
      clientName: 'TechNova Soluções Digitais',
      amountCents: 200000,
      dueDate: '2026-10-10',
      daysOverdue: 11,
      pixKey: '00020126580014br.gov.bcb.pix0136servicore-cobranca-fatura-48900054000053039865802BR5925SERVICORE LTDA6009SAO PAULO62070503***6304A1B2',
      phone: '+55 11 98774-2002',
    },
  ]

  // Consome os dados demonstrativos providos pela API do backend
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<DemoDashboardStats>({
    queryKey: ['dashboard-demo-stats'],
    queryFn: () => api.get<DemoDashboardStats>('/health/demo-stats'),
    staleTime: 60000,
  })

  if (isLoading) {
    return <LoadingState message="Carregando métricas do painel operacional..." fullPage />
  }

  if (isError || !stats) {
    return (
      <ErrorState
        title="Não foi possível conectar ao backend"
        message="Certifique-se de que a API ASP.NET Core está em execução (ex: dotnet run em backend/src/ServiCore.Api)."
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    )
  }

  const toggleCommitment = (idx: number) => {
    setCompletedCommitments((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const handleCopyPix = (key?: string) => {
    const textToCopy = key || '00020126580014br.gov.bcb.pix0136servicore-cobranca-fatura-49280054000053039865802BR5925SERVICORE LTDA6009SAO PAULO62070503***6304E2D1'
    navigator.clipboard.writeText(textToCopy)
    setPixCopied(true)
    setTimeout(() => setPixCopied(false), 2000)
  }

  const handleMarkAsPaid = (invoiceId: string) => {
    setPaidInvoices((prev) => ({
      ...prev,
      [invoiceId]: true,
    }))
  }


  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Topo Operacional Integrado: Título + Resumo da Semana Promovido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#1E2332]">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E9CAE]">
            Visão Geral Operacional & Financeira
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Período de referência: <span className="text-[#F4F4F5] font-medium">{stats.period}</span>
          </p>
        </div>

        {/* Resumo Operacional da Semana promovido perto do topo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div
            onClick={() => navigate('/contratos')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#11131C] border border-[#1E2332] text-xs hover:border-[#2C3347] cursor-pointer transition-colors shrink-0"
            title="Ver contratos em andamento"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[#8E9CAE]">Contratos:</span>
            <span className="font-semibold text-[#F4F4F5] tabular-nums">
              {stats.kpis.activeContractsCount} em execução
            </span>
          </div>

          <div
            onClick={() => navigate('/tarefas')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#11131C] border border-[#1E2332] text-xs hover:border-[#2C3347] cursor-pointer transition-colors shrink-0"
            title="Ver tarefas pendentes"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#8E9CAE]">Tarefas:</span>
            <span className="font-semibold text-[#F4F4F5] tabular-nums">
              {stats.kpis.ongoingTasksCount} pendentes
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Atalhos Operacionais Refinada (Discreta e sem peso excessivo) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider mr-1 hidden md:inline">
            Ações Rápidas:
          </span>

          {/* Ação Primária Sóbria */}
          <button
            type="button"
            onClick={() => navigate('/contratos')}
            className="h-8 px-3 rounded-md bg-[#161A26] border border-[#282F44] hover:bg-[#1D2233] hover:border-[#38BDF8]/40 text-[#F4F4F5] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Criar Contrato</span>
          </button>

          {/* Botões Secundários Neutros com Contorno Suave */}
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
            <span>Lançar Despesa</span>
          </button>
        </div>

        <span className="text-[11px] text-[#64748B] hidden lg:inline font-mono">
          ServiCore v1.0
        </span>
      </div>

      {/* Cards de Métricas Financeiras (KPIs) - Imediatamente visíveis Above the Fold */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Receitas Recebidas"
          value={formatCurrency(stats.kpis.totalReceivedCents)}
          variant="positive"
          badgeText="+18% vs mês anterior"
          subtitle="Entrada confirmada no caixa"
          icon={<TrendingUp className="w-4 h-4" />}
          onClick={() => navigate('/financeiro')}
        />

        <StatCard
          title="A Receber (Pendentes)"
          value={formatCurrency(stats.kpis.pendingReceivablesCents)}
          variant="sky"
          badgeText="Previsão próx. 30 dias"
          subtitle="Contratos faturados em aberto"
          icon={<Clock className="w-4 h-4" />}
          onClick={() => navigate('/financeiro')}
        />

        <StatCard
          title="Valores Vencidos"
          value={formatCurrency(stats.kpis.overdueCents)}
          variant="critical"
          badgeText="2 faturas em atraso"
          subtitle="Necessitam cobrança ativa"
          icon={<AlertTriangle className="w-4 h-4" />}
          onClick={() => {
            setSelectedInvoice(null)
            setChargeModalOpen(true)
          }}
          action={{
            label: 'Ver faturas em atraso (2)',
            icon: <FileText className="w-3.5 h-3.5" />,
            onClick: () => {
              setSelectedInvoice(null)
              setChargeModalOpen(true)
            },
          }}
        />

        <StatCard
          title="Despesas Pagas"
          value={formatCurrency(stats.kpis.paidExpensesCents)}
          variant="warning"
          badgeText="Fixas e Variáveis"
          subtitle="Saídas operacionais do mês"
          icon={<Receipt className="w-4 h-4" />}
          onClick={() => navigate('/financeiro')}
        />
      </div>

      {/* Grids Centrais: Fluxo de Caixa e Próximos Compromissos Interativos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico Visual Demonstrativo do Fluxo de Caixa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fluxo de Caixa Operacional</CardTitle>
                <CardDescription>
                  Comparativo entre receitas recebidas e despesas liquidadas nos últimos 6 meses
                </CardDescription>
              </div>
              <Badge variant="default" className="text-[11px] font-mono">
                Semestral
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-1">
              {/* Legenda Discreta */}
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
                {stats.cashFlowSeries.map((item) => {
                  const maxVal = 16000
                  const heightRec = Math.round((item.received / maxVal) * 100)
                  const heightExp = Math.round((item.expenses / maxVal) * 100)

                  return (
                    <div key={item.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-32">
                        {/* Barra Receita */}
                        <div
                          className="w-1/2 max-w-[20px] bg-[#1D68F2] hover:bg-[#2563EB] rounded-t-xs transition-colors duration-150 relative cursor-pointer"
                          style={{ height: `${heightRec}%` }}
                          title={`Receitas: R$ ${item.received.toLocaleString('pt-BR')}`}
                        />
                        {/* Barra Despesa */}
                        <div
                          className="w-1/2 max-w-[20px] bg-[#EF4444]/75 hover:bg-[#EF4444] rounded-t-xs transition-colors duration-150 relative cursor-pointer"
                          style={{ height: `${heightExp}%` }}
                          title={`Despesas: R$ ${item.expenses.toLocaleString('pt-BR')}`}
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
                <span>Total médio mensal apurado: R$ 13.800,00</span>
                <span className="font-mono">Dados consolidados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Painel Operacional: Próximos Compromissos com Interações Diretas */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Próximos Compromissos</CardTitle>
                  <CardDescription>Ações interativas e entregas da semana</CardDescription>
                </div>
                <CalendarCheck2 className="w-4 h-4 text-[#38BDF8]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4 sm:p-5">
              {stats.recentCommitments.map((event, idx) => {
                const isCompleted = Boolean(completedCommitments[idx])
                const isMeeting = event.type === 'Reunião'

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border transition-colors ${
                      isCompleted
                        ? 'bg-[#10131B]/60 border-[#1E2332]/60 opacity-60'
                        : 'bg-[#11131C] border-[#1E2332] hover:border-[#2C3347]'
                    } flex items-start justify-between gap-3`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Checkbox tátil para concluir diretamente */}
                      <button
                        type="button"
                        onClick={() => toggleCommitment(idx)}
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
                        <p className="text-[11px] text-[#8E9CAE] truncate">Cliente: {event.client}</p>
                        <p className="text-[10px] text-[#64748B] font-mono">{formatDate(event.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Link externo para Reuniões sem sair da tela */}
                      {isMeeting && !isCompleted && (
                        <a
                          href="https://meet.google.com"
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded bg-[#161A26] border border-[#23293D] text-[#8E9CAE] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition-colors"
                          title="Abrir sala de reunião online"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <Badge
                        variant={isCompleted ? 'positive' : event.type === 'Entrega' ? 'positive' : 'sky'}
                        className="text-[10px] py-0 px-1.5 font-mono"
                      >
                        {isCompleted ? 'Concluído' : event.type}
                      </Badge>
                    </div>
                  </div>
                )
              })}
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

      {/* Modal / Painel de Valores Vencidos com Fluxo em 2 Níveis */}
      {chargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0E1017] border border-[#1E2332] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2332]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-[#EF4444]/15 text-[#EF4444]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5]">
                    {selectedInvoice ? `Cobrança da Fatura ${selectedInvoice.invoiceNumber}` : 'Faturas com Pagamento em Atraso'}
                  </h3>
                  <p className="text-xs text-[#8E9CAE]">
                    {selectedInvoice
                      ? `Cliente: ${selectedInvoice.clientName}`
                      : 'Selecione a fatura para visualizar detalhes ou emitir cobrança'}
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

            {/* Conteúdo: Nível 1 (Lista de Faturas Vencidas por Cliente/Contrato) */}
            {!selectedInvoice ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-[#8E9CAE]">Total em atraso apurado:</span>
                  <span className="font-bold text-[#F87171] tabular-nums font-mono-numbers">
                    {formatCurrency(stats.kpis.overdueCents)}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {overdueInvoices.map((inv) => {
                    const isPaid = Boolean(paidInvoices[inv.id])

                    return (
                      <div
                        key={inv.id}
                        onClick={() => !isPaid && setSelectedInvoice(inv)}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isPaid
                            ? 'bg-[#10131B]/50 border-[#1E2332]/60 opacity-60 cursor-default'
                            : 'bg-[#11131C] border-[#1E2332] hover:border-[#EF4444]/40 hover:bg-[#140D10]/50 cursor-pointer group'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#F4F4F5] font-mono">
                                {inv.invoiceNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#191D2B] text-[#8E9CAE] border border-[#242B3E] font-mono">
                                {inv.contractNumber}
                              </span>
                            </div>

                            <p className="text-xs font-medium text-[#F4F4F5] truncate">
                              {inv.clientName}
                            </p>
                            <p className="text-[11px] text-[#64748B] truncate">
                              {inv.contractTitle}
                            </p>

                            <div className="flex items-center gap-2 pt-1 text-[10px] text-[#8E9CAE]">
                              <span>Vencimento: {formatDate(inv.dueDate)}</span>
                              <span>•</span>
                              <span className="text-[#EF4444] font-medium">
                                {inv.daysOverdue} dias em atraso
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                            <span className="text-xs font-bold text-[#F87171] tabular-nums font-mono-numbers">
                              {formatCurrency(inv.amountCents)}
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

                <div className="pt-2 flex items-center justify-between border-t border-[#1E2332] text-xs">
                  <span className="text-[11px] text-[#64748B]">
                    Exibindo faturas com títulos vencidos na carteira
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setChargeModalOpen(false)
                      navigate('/financeiro')
                    }}
                  >
                    Ver todas no Financeiro
                  </Button>
                </div>
              </div>
            ) : (
              /* Conteúdo: Nível 2 (Detalhes da Fatura & Ações Específicas de Cobrança) */
              <div className="space-y-3.5 text-xs">
                {/* Botão de Retorno à Lista */}
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs text-[#8E9CAE] hover:text-[#F4F4F5] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para lista de faturas</span>
                </button>

                {/* Resumo da Fatura Selecionada */}
                <div className="p-3.5 rounded-lg bg-[#140D10] border border-[#EF4444]/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#F4F4F5] font-mono">
                          {selectedInvoice.invoiceNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#191D2B] text-[#8E9CAE] border border-[#242B3E] font-mono">
                          {selectedInvoice.contractNumber}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#F4F4F5] mt-1">
                        {selectedInvoice.clientName}
                      </p>
                      <p className="text-[11px] text-[#8E9CAE]">
                        {selectedInvoice.contractTitle}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-[#8E9CAE]">Valor devido:</p>
                      <p className="text-sm font-bold text-[#F87171] tabular-nums font-mono-numbers">
                        {formatCurrency(selectedInvoice.amountCents)}
                      </p>
                      <span className="text-[10px] text-[#EF4444] font-medium">
                        {selectedInvoice.daysOverdue} dias de atraso
                      </span>
                    </div>
                  </div>
                </div>

                {/* Opção 1: Chave Pix da Fatura */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E9CAE] block">
                    Chave Pix da fatura para liquidação imediata:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedInvoice.pixKey}
                      className="flex-1 bg-[#131620] border border-[#1E2332] rounded-md px-2.5 py-1.5 text-xs text-[#8E9CAE] font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyPix(selectedInvoice.pixKey)}
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

                {/* Opção 2: Disparo Direto via WhatsApp com Mensagem Personalizada */}
                <div className="pt-1 space-y-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Olá ${selectedInvoice.clientName}, tudo bem? Identificamos que a fatura ${selectedInvoice.invoiceNumber} referente ao contrato ${selectedInvoice.contractNumber} (${selectedInvoice.contractTitle}) no valor de ${formatCurrency(selectedInvoice.amountCents)} venceu em ${formatDate(selectedInvoice.dueDate)}. Segue a chave Pix para regularização imediata: ${selectedInvoice.pixKey}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-9 rounded-md bg-[#10B981] hover:bg-[#059669] text-[#090A0F] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enviar Cobrança via WhatsApp para o Cliente</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                      className="flex-1 h-8 rounded-md bg-[#161A26] border border-[#1E2332] hover:bg-[#1C2130] text-xs font-medium text-[#F4F4F5] transition-colors"
                    >
                      {paidInvoices[selectedInvoice.id] ? '✓ Marcado como Pago' : 'Marcar como Pago'}
                    </button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        setChargeModalOpen(false)
                        navigate('/contratos')
                      }}
                    >
                      Ver Contrato
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

