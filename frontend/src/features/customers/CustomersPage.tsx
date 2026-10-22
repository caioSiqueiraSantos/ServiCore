import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CustomerModal } from './CustomerModal'
import { CustomerDetailsDrawer } from './CustomerDetailsDrawer'
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Edit2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
} from 'lucide-react'
import type { Customer, CustomerType, CustomerStatus, PagedResult } from '@/types'

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient()

  // Estados de busca e filtros
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('')
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('Active')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Estados de modais e gavetas
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Consulta paginada com cache e sincronização via TanStack Query
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<PagedResult<Customer>>({
    queryKey: ['customers', search, typeFilter, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (typeFilter) params.append('type', typeFilter === 'Individual' ? '1' : '2')
      if (statusFilter) params.append('status', statusFilter === 'Active' ? '1' : '2')
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      return api.get<PagedResult<Customer>>(`/customers?${params.toString()}`)
    },
  })

  // Mutação para inativar / ativar cliente
  const toggleStatusMutation = useMutation({
    mutationFn: async (customer: Customer) => {
      if (customer.status === 'Active') {
        return api.delete(`/customers/${customer.id}`)
      } else {
        return api.put(`/customers/${customer.id}`, {
          name: customer.name,
          type: customer.type,
          document: customer.document,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
          status: 'Active',
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      if (selectedCustomer) {
        setIsDrawerOpen(false)
      }
    },
  })

  const handleOpenCreate = () => {
    setCustomerToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setCustomerToEdit(customer)
    setIsModalOpen(true)
  }

  const handleOpenDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDrawerOpen(true)
  }

  const formatDoc = (doc?: string) => {
    if (!doc) return '—'
    const clean = doc.replace(/\D/g, '')
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
    }
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
    }
    return doc
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Topo: Título + Contador + Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2332]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#F4F4F5]">Gestão de Clientes</h2>
            {data && (
              <Badge variant="sky" className="text-[10px] font-mono">
                {data.totalCount} {data.totalCount === 1 ? 'cliente' : 'clientes'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#8E9CAE] mt-0.5">
            Cadastro e histórico centralizado de clientes Pessoa Física (PF) e Jurídica (PJ)
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Novo Cliente
        </Button>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Busca Textual */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-[#11131C] border border-[#1E2332] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4F4F5] placeholder-[#64748B] focus:outline-none focus:border-[#2C3347] transition-colors"
          />
        </div>

        {/* Filtros por Segmento e Situação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo: Todos / PF / PJ */}
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
              Todos
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('Individual')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'Individual'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              <User className="w-3 h-3" />
              <span>PF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('Company')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'Company'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>PJ</span>
            </button>
          </div>

          {/* Status: Ativos / Inativos / Todos */}
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

      {/* Tabela de Listagem de Clientes */}
      {isLoading ? (
        <LoadingState message="Carregando carteira de clientes..." />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar clientes"
          message="Não foi possível obter a listagem de clientes do workspace ativo."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-[#38BDF8]" />}
          title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          description={
            search
              ? 'Nenhum cliente corresponde aos critérios de busca ou filtros aplicados.'
              : 'Comece cadastrando seu primeiro cliente para gerenciar propostas, contratos e serviços.'
          }
          actionLabel="Cadastrar Primeiro Cliente"
          onAction={handleOpenCreate}
        />
      ) : (
        <Card className="overflow-hidden border-[#1E2332]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2332] bg-[#0A0C12] text-[#8E9CAE]">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Cliente
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Tipo
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Documento
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Contato
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
                {data.items.map((customer) => {
                  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : null
                  const whatsappUrl = cleanPhone
                    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                        `Olá ${customer.name}, tudo bem? Entramos em contato a respeito da prestação de serviços.`
                      )}`
                    : null

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => handleOpenDetails(customer)}
                      className="hover:bg-[#12151F] transition-colors cursor-pointer group"
                    >
                      {/* Nome e E-mail */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#F4F4F5] group-hover:text-[#38BDF8] transition-colors truncate max-w-[220px]">
                          {customer.name}
                        </div>
                        {customer.email && (
                          <div className="text-[11px] text-[#8E9CAE] truncate max-w-[220px]">
                            {customer.email}
                          </div>
                        )}
                      </td>

                      {/* Tipo PF / PJ */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            customer.type === 'Company'
                              ? 'bg-[#1D68F2]/15 text-[#38BDF8] border border-[#1D68F2]/25'
                              : 'bg-[#161A26] text-[#8E9CAE] border border-[#1E2332]'
                          }`}
                        >
                          {customer.type === 'Company' ? (
                            <>
                              <Building2 className="w-3 h-3" /> PJ
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3" /> PF
                            </>
                          )}
                        </span>
                      </td>

                      {/* CPF / CNPJ */}
                      <td className="py-3 px-4 font-mono text-[#8E9CAE] text-[11px]">
                        {formatDoc(customer.document)}
                      </td>

                      {/* Contato com WhatsApp direto */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-[#F4F4F5]">
                            {customer.phone || '—'}
                          </span>
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#34D399] transition-colors"
                              title="Iniciar conversa no WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={customer.status === 'Active' ? 'positive' : 'critical'}
                          dot
                          className="text-[10px] py-0 px-1.5"
                        >
                          {customer.status === 'Active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(customer)}
                            className="p-1.5 rounded text-[#8E9CAE] hover:text-[#38BDF8] hover:bg-[#161A26] transition-colors"
                            title="Ver detalhes do cliente"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
                            title="Editar cadastro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data.totalPages > 1 && (
            <div className="p-3 border-t border-[#1E2332] bg-[#0A0C12] flex items-center justify-between text-xs text-[#8E9CAE]">
              <span>
                Página <span className="text-[#F4F4F5] font-mono">{data.page}</span> de{' '}
                <span className="text-[#F4F4F5] font-mono">{data.totalPages}</span> ({data.totalCount} clientes)
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

      {/* Modal de Cadastro / Edição */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={customerToEdit}
      />

      {/* Gaveta de Detalhes do Cliente */}
      <CustomerDetailsDrawer
        customer={selectedCustomer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={(customer) => {
          setIsDrawerOpen(false)
          handleOpenEdit(customer)
        }}
        onToggleStatus={(customer) => toggleStatusMutation.mutate(customer)}
      />
    </div>
  )
}
