import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ContractModal } from './ContractModal'
import { ContractDetailsDrawer } from './ContractDetailsDrawer'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  Plus,
  Search,
  Building2,
  Calendar,
  Clock,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Layers,
} from 'lucide-react'
import type {
  Contract,
  ContractBillingType,
  ContractStatus,
  ContractMetrics,
  PagedResult,
} from '@/types'

export const ContractsPage: React.FC = () => {
  // Estados de busca e filtros
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ContractBillingType | ''>('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Modais e gaveta
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Consulta de métricas do header
  const { data: metrics } = useQuery<ContractMetrics>({
    queryKey: ['contract-metrics'],
    queryFn: () => api.get<ContractMetrics>('/contracts/metrics'),
  })

  // Consulta de listagem paginada
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<PagedResult<Contract>>({
    queryKey: ['contracts', search, typeFilter, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (typeFilter) params.append('type', typeFilter)
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      return api.get<PagedResult<Contract>>(`/contracts?${params.toString()}`)
    },
  })

  const handleOpenCreate = () => {
    setContractToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (contract: Contract) => {
    setContractToEdit(contract)
    setIsModalOpen(true)
  }

  const handleOpenDetails = (contract: Contract) => {
    setSelectedContract(contract)
    setIsDrawerOpen(true)
  }

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="positive" dot className="text-[10px]">Ativo</Badge>
      case 'Draft':
        return <Badge variant="default" dot className="text-[10px]">Rascunho</Badge>
      case 'Completed':
        return <Badge variant="sky" dot className="text-[10px]">Concluído</Badge>
      case 'Suspended':
        return <Badge variant="critical" dot className="text-[10px]">Suspenso</Badge>
      case 'Cancelled':
        return <Badge variant="critical" dot className="text-[10px]">Cancelado</Badge>
    }
  }

  const getTypeBadge = (type: ContractBillingType) => {
    switch (type) {
      case 'FixedPrice':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1D68F2]/15 text-[#38BDF8] border border-[#1D68F2]/30">
            Preço Fixo
          </span>
        )
      case 'Hourly':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
            Por Hora
          </span>
        )
      case 'Recurring':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
            Recorrente (MRR)
          </span>
        )
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Topo: Título + Botão Criar Contrato */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2332]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#F4F4F5]">Contratos de Prestação de Serviços</h2>
            <Badge variant="sky" className="text-[10px] font-mono">
              Etapa 3
            </Badge>
          </div>
          <p className="text-xs text-[#8E9CAE] mt-0.5">
            Gestão de contratos com preço fixo, horas ou recorrência com controle de vigência e escopo
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Novo Contrato
        </Button>
      </div>

      {/* Cards de Métricas Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Contratos Ativos"
          value={metrics ? metrics.activeContracts.toString() : '—'}
          subtitle={metrics ? `${metrics.totalContracts} cadastrados no total` : 'Carregando...'}
          icon={<Briefcase className="w-4 h-4 text-[#38BDF8]" />}
          variant="sky"
        />

        <StatCard
          title="Volume sob Gestão (Fixos)"
          value={metrics ? formatCurrency(metrics.totalActiveValueCents) : '—'}
          subtitle="Total contratado em escopo fechado"
          icon={<Layers className="w-4 h-4 text-[#34D399]" />}
          variant="positive"
        />

        <StatCard
          title="MRR Recorrente Mensal"
          value={metrics ? formatCurrency(metrics.monthlyRecurringRevenueCents) : '—'}
          subtitle="Receita previsível mensal contratada"
          icon={<TrendingUp className="w-4 h-4 text-[#A78BFA]" />}
          variant="default"
        />
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca Textual */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, escopo ou cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-[#11131C] border border-[#1E2332] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4F4F5] placeholder-[#64748B] focus:outline-none focus:border-[#2C3347] transition-colors"
          />
        </div>

        {/* Filtros por Modalidade e Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Modalidade */}
          <div className="flex items-center bg-[#11131C] border border-[#1E2332] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                typeFilter === ''
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Todas Modalidades
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('FixedPrice')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                typeFilter === 'FixedPrice'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Fixo
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('Hourly')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                typeFilter === 'Hourly'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Hora
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('Recurring')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                typeFilter === 'Recurring'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Recorrente
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center bg-[#11131C] border border-[#1E2332] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === ''
                  ? 'bg-[#161A26] text-[#F4F4F5] font-semibold border border-[#1E2332]'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Todos Status
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Active')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                statusFilter === 'Active'
                  ? 'bg-[#161A26] text-[#10B981] font-semibold border border-[#1E2332]'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Draft')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                statusFilter === 'Draft'
                  ? 'bg-[#161A26] text-[#94A3B8] font-semibold border border-[#1E2332]'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Rascunho
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Completed')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                statusFilter === 'Completed'
                  ? 'bg-[#161A26] text-[#38BDF8] font-semibold border border-[#1E2332]'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Concluídos
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Contratos */}
      {isLoading ? (
        <LoadingState message="Carregando contratos..." />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar contratos"
          message="Não foi possível obter a listagem de contratos do workspace ativo."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-[#38BDF8]" />}
          title={search ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado ainda'}
          description={
            search
              ? 'Nenhum contrato corresponde aos filtros aplicados.'
              : 'Cadastre seu primeiro contrato para estruturar valores, prazos e tarefas vinculadas aos seus clientes.'
          }
          actionLabel="Criar Primeiro Contrato"
          onAction={handleOpenCreate}
        />
      ) : (
        <Card className="overflow-hidden border-[#1E2332]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2332] bg-[#0A0C12] text-[#8E9CAE]">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Contrato & Escopo
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Cliente
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Modalidade
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Valor
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Vigência
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Situação
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px] text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2332]/50">
                {data.items.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => handleOpenDetails(contract)}
                    className="hover:bg-[#12151F] transition-colors cursor-pointer group"
                  >
                    {/* Título e Horas */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#F4F4F5] group-hover:text-[#38BDF8] transition-colors truncate max-w-[240px]">
                        {contract.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8E9CAE]">
                        {contract.estimatedHours && (
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="w-3 h-3 text-[#38BDF8]" />
                            {contract.estimatedHours}h
                          </span>
                        )}
                        {contract.tasksCount > 0 && (
                          <span className="text-[10px] font-mono text-[#8E9CAE]">
                            • {contract.completedTasksCount}/{contract.tasksCount} tarefas
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4 font-medium text-[#F4F4F5]">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <Building2 className="w-3 h-3 text-[#8E9CAE]" />
                        <span className="truncate">{contract.customerName}</span>
                      </div>
                    </td>

                    {/* Modalidade */}
                    <td className="py-3 px-4">{getTypeBadge(contract.type)}</td>

                    {/* Valor Formatado */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#F4F4F5] text-xs">
                        {formatCurrency(contract.amountCents)}
                      </span>
                      {contract.type === 'Hourly' && (
                        <span className="text-[10px] text-[#8E9CAE]"> /h</span>
                      )}
                      {contract.type === 'Recurring' && (
                        <span className="text-[10px] text-[#8E9CAE]"> /mês</span>
                      )}
                    </td>

                    {/* Vigência */}
                    <td className="py-3 px-4 text-[11px] text-[#8E9CAE] font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#64748B]" />
                        <span>{formatDate(contract.startDate)}</span>
                        {contract.endDate && (
                          <>
                            <span className="text-[#64748B]">até</span>
                            <span>{formatDate(contract.endDate)}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(contract.status)}</td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(contract)}
                          className="p-1.5 rounded text-[#8E9CAE] hover:text-[#38BDF8] hover:bg-[#161A26] transition-colors"
                          title="Ver detalhes 360º"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(contract)}
                          className="p-1.5 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
                          title="Editar contrato"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data.totalPages > 1 && (
            <div className="p-3 border-t border-[#1E2332] bg-[#0A0C12] flex items-center justify-between text-xs text-[#8E9CAE]">
              <span>
                Página <span className="text-[#F4F4F5] font-mono">{data.page}</span> de{' '}
                <span className="text-[#F4F4F5] font-mono">{data.totalPages}</span> ({data.totalCount} contratos)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal de Criação / Edição */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contractToEdit={contractToEdit}
      />

      {/* Gaveta de Detalhes 360º */}
      <ContractDetailsDrawer
        contract={selectedContract}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(contract) => {
          setIsDrawerOpen(false)
          handleOpenEdit(contract)
        }}
      />
    </div>
  )
}
