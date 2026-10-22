import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ServiceModal } from './ServiceModal'
import { formatCurrency } from '@/lib/utils'
import {
  Briefcase,
  Plus,
  Search,
  Clock,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Power,
} from 'lucide-react'
import type { ServiceItem, ServiceBillingUnit, ServiceStatus, PagedResult } from '@/types'

export const ServicesPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState<ServiceBillingUnit | ''>('')
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | ''>('Active')
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null)

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<PagedResult<ServiceItem>>({
    queryKey: ['services', search, unitFilter, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (unitFilter) params.append('billingUnit', unitFilter)
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      return api.get<PagedResult<ServiceItem>>(`/services?${params.toString()}`)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async (service: ServiceItem) => {
      if (service.status === 'Active') {
        return api.delete(`/services/${service.id}`)
      } else {
        return api.put(`/services/${service.id}`, {
          name: service.name,
          description: service.description,
          defaultPriceCents: service.defaultPriceCents,
          billingUnit: service.billingUnit,
          estimatedHours: service.estimatedHours,
          status: 'Active',
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['services-list-all'] })
    },
  })

  const handleOpenCreate = () => {
    setServiceToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (service: ServiceItem) => {
    setServiceToEdit(service)
    setIsModalOpen(true)
  }

  const getBillingUnitLabel = (unit: ServiceBillingUnit) => {
    switch (unit) {
      case 'Hour':
        return '/hora'
      case 'Project':
        return '/projeto'
      case 'Month':
        return '/mês'
      case 'Deliverable':
        return '/entrega'
      case 'Unit':
        return '/unid'
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2332]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#F4F4F5]">Catálogo de Serviços</h2>
            {data && (
              <Badge variant="sky" className="text-[10px] font-mono">
                {data.totalCount} {data.totalCount === 1 ? 'serviço' : 'serviços'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#8E9CAE] mt-0.5">
            Padronize os serviços prestados, valores de referência e horas estimadas de trabalho
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Cadastrar Serviço
        </Button>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca Textual */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição do serviço..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-[#11131C] border border-[#1E2332] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4F4F5] placeholder-[#64748B] focus:outline-none focus:border-[#2C3347] transition-colors"
          />
        </div>

        {/* Filtros por Unidade e Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unidade */}
          <div className="flex items-center bg-[#11131C] border border-[#1E2332] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setUnitFilter('')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                unitFilter === ''
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Todas Unidades
            </button>
            <button
              type="button"
              onClick={() => {
                setUnitFilter('Hour')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                unitFilter === 'Hour'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Hora
            </button>
            <button
              type="button"
              onClick={() => {
                setUnitFilter('Project')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                unitFilter === 'Project'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Projeto
            </button>
            <button
              type="button"
              onClick={() => {
                setUnitFilter('Month')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                unitFilter === 'Month'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Mensal
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center bg-[#11131C] border border-[#1E2332] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Active')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
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
                setStatusFilter('Inactive')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'Inactive'
                  ? 'bg-[#161A26] text-[#EF4444] font-semibold border border-[#1E2332]'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Inativos
            </button>
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
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Serviços */}
      {isLoading ? (
        <LoadingState message="Carregando catálogo de serviços..." />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar serviços"
          message="Não foi possível obter os itens do catálogo."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-8 h-8 text-[#38BDF8]" />}
          title={search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado ainda'}
          description={
            search
              ? 'Nenhum serviço corresponde aos termos de busca aplicados.'
              : 'Cadastre seus serviços mais comuns para facilitar orçamentos e criação de contratos.'
          }
          actionLabel="Adicionar Primeiro Serviço"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {data.items.map((service) => (
            <Card
              key={service.id}
              className="p-4 border-[#1E2332] bg-[#11131C] hover:border-[#2C3347] transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1D68F2]/15 text-[#38BDF8] flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <Badge
                    variant={service.status === 'Active' ? 'positive' : 'critical'}
                    dot
                    className="text-[10px]"
                  >
                    {service.status === 'Active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#F4F4F5] group-hover:text-[#38BDF8] transition-colors">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-xs text-[#8E9CAE] mt-1 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#1E2332]/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8E9CAE] font-mono uppercase block">
                    Preço de Referência
                  </span>
                  <div className="text-base font-bold font-mono text-[#F4F4F5]">
                    {formatCurrency(service.defaultPriceCents)}
                    <span className="text-[11px] text-[#8E9CAE] font-normal">
                      {' '}
                      {getBillingUnitLabel(service.billingUnit)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {service.estimatedHours && (
                    <span className="flex items-center gap-1 text-[11px] text-[#8E9CAE] font-mono mr-2">
                      <Clock className="w-3 h-3 text-[#38BDF8]" />
                      {service.estimatedHours}h
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(service)}
                    className="p-1.5 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
                    title="Editar serviço"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStatusMutation.mutate(service)}
                    className={`p-1.5 rounded transition-colors ${
                      service.status === 'Active'
                        ? 'text-[#8E9CAE] hover:text-[#EF4444] hover:bg-[#EF4444]/15'
                        : 'text-[#8E9CAE] hover:text-[#10B981] hover:bg-[#10B981]/15'
                    }`}
                    title={service.status === 'Active' ? 'Inativar serviço' : 'Reativar serviço'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="p-3 border border-[#1E2332] rounded-xl bg-[#0A0C12] flex items-center justify-between text-xs text-[#8E9CAE]">
          <span>
            Página <span className="text-[#F4F4F5] font-mono">{data.page}</span> de{' '}
            <span className="text-[#F4F4F5] font-mono">{data.totalPages}</span> ({data.totalCount} serviços)
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

      {/* Modal de Criação / Edição */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceToEdit={serviceToEdit}
      />
    </div>
  )
}
