import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  X,
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  PlayCircle,
  Edit2,
  Database,
  Layers,
  CheckSquare,
} from 'lucide-react'
import type { Contract, ContractStatus } from '@/types'

interface ContractDetailsDrawerProps {
  contract: Contract | null
  isOpen: boolean
  onClose: () => void
  onEdit: (contract: Contract) => void
}

export const ContractDetailsDrawer: React.FC<ContractDetailsDrawerProps> = ({
  contract,
  isOpen,
  onClose,
  onEdit,
}) => {
  const queryClient = useQueryClient()

  const statusMutation = useMutation({
    mutationFn: async (newStatus: ContractStatus) => {
      if (!contract) return
      return api.patch(`/contracts/${contract.id}/status`, { status: newStatus })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      onClose()
    },
  })

  if (!isOpen || !contract) return null

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="positive" dot>Ativo / Vigente</Badge>
      case 'Draft':
        return <Badge variant="default" dot>Rascunho</Badge>
      case 'Completed':
        return <Badge variant="sky" dot>Concluído</Badge>
      case 'Suspended':
        return <Badge variant="critical" dot>Suspenso</Badge>
      case 'Cancelled':
        return <Badge variant="critical" dot>Cancelado</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FixedPrice':
        return 'Preço Fixo'
      case 'Hourly':
        return 'Por Hora'
      case 'Recurring':
        return 'Recorrente (Mensal)'
      default:
        return type
    }
  }

  const progressPercentage =
    contract.tasksCount > 0
      ? Math.round((contract.completedTasksCount / contract.tasksCount) * 100)
      : 0

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#11131C] border-l border-[#1E2332] shadow-2xl flex flex-col">
          {/* Cabeçalho */}
          <div className="p-4 border-b border-[#1E2332] bg-[#0E1017] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1D68F2]/15 text-[#38BDF8] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8E9CAE] uppercase tracking-wider block">
                  Visão 360º do Contrato
                </span>
                <h3 className="text-sm font-bold text-[#F4F4F5] truncate max-w-[260px]">
                  {contract.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(contract)}
                className="p-1.5 rounded text-[#8E9CAE] hover:text-[#38BDF8] hover:bg-[#161A26] transition-colors"
                title="Editar Contrato"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo com rolagem */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Status e Valor Principal */}
            <div className="p-3.5 rounded-xl bg-[#0A0C12] border border-[#1E2332] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8E9CAE]">Situação do Contrato</span>
                {getStatusBadge(contract.status)}
              </div>

              <div className="pt-2 border-t border-[#1E2332]/60 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-[#8E9CAE] uppercase font-mono block">
                    {contract.type === 'Hourly' ? 'Taxa Horária' : 'Valor Contratado'}
                  </span>
                  <div className="text-xl font-bold font-mono text-[#F4F4F5]">
                    {formatCurrency(contract.amountCents)}
                    {contract.type === 'Hourly' && (
                      <span className="text-xs text-[#8E9CAE] font-normal"> /hora</span>
                    )}
                    {contract.type === 'Recurring' && (
                      <span className="text-xs text-[#8E9CAE] font-normal"> /mês</span>
                    )}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1D68F2]/15 text-[#38BDF8] border border-[#1D68F2]/30">
                  {getTypeLabel(contract.type)}
                </span>
              </div>
            </div>

            {/* Ações Rápidas de Status */}
            <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#8E9CAE] block">
                Alterar Status Operacional
              </span>
              <div className="flex flex-wrap gap-1.5">
                {contract.status !== 'Active' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-[11px] py-1 text-[#10B981] hover:text-[#10B981]"
                    onClick={() => statusMutation.mutate('Active')}
                    leftIcon={<PlayCircle className="w-3.5 h-3.5 text-[#10B981]" />}
                  >
                    Ativar
                  </Button>
                )}
                {contract.status === 'Active' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-[11px] py-1 text-[#F59E0B] hover:text-[#F59E0B]"
                    onClick={() => statusMutation.mutate('Suspended')}
                    leftIcon={<PauseCircle className="w-3.5 h-3.5 text-[#F59E0B]" />}
                  >
                    Suspender
                  </Button>
                )}
                {contract.status !== 'Completed' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-[11px] py-1 text-[#38BDF8] hover:text-[#38BDF8]"
                    onClick={() => statusMutation.mutate('Completed')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />}
                  >
                    Concluir
                  </Button>
                )}
                {contract.status !== 'Cancelled' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-[11px] py-1 text-[#EF4444] hover:text-[#EF4444]"
                    onClick={() => statusMutation.mutate('Cancelled')}
                    leftIcon={<XCircle className="w-3.5 h-3.5 text-[#EF4444]" />}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Cliente Contratante */}
            <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#8E9CAE] text-[10px] font-mono uppercase">
                <Building2 className="w-3 h-3 text-[#38BDF8]" />
                <span>Cliente Vinculado</span>
              </div>
              <div className="text-sm font-semibold text-[#F4F4F5]">{contract.customerName}</div>
            </div>

            {/* Vigência e Horas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-1">
                <div className="flex items-center gap-1 text-[#8E9CAE] text-[10px]">
                  <Calendar className="w-3 h-3 text-[#38BDF8]" />
                  <span>Início</span>
                </div>
                <div className="font-mono text-xs text-[#F4F4F5]">
                  {formatDate(contract.startDate)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-1">
                <div className="flex items-center gap-1 text-[#8E9CAE] text-[10px]">
                  <Calendar className="w-3 h-3 text-[#38BDF8]" />
                  <span>Término</span>
                </div>
                <div className="font-mono text-xs text-[#F4F4F5]">
                  {contract.endDate ? formatDate(contract.endDate) : 'Indeterminado'}
                </div>
              </div>
            </div>

            {contract.estimatedHours && (
              <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#8E9CAE]">
                  <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Horas Estimadas</span>
                </div>
                <span className="font-mono font-bold text-[#F4F4F5]">
                  {contract.estimatedHours}h
                </span>
              </div>
            )}

            {/* Progresso de Tarefas da Operação */}
            <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#8E9CAE] text-[10px] font-mono uppercase">
                  <CheckSquare className="w-3 h-3 text-[#38BDF8]" />
                  <span>Tarefas Operacionais</span>
                </div>
                <span className="text-[10px] font-mono text-[#F4F4F5]">
                  {contract.completedTasksCount} / {contract.tasksCount} concluídas
                </span>
              </div>

              <div className="w-full bg-[#161A26] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#38BDF8] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Descrição do Escopo */}
            {contract.description && (
              <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#8E9CAE] block">
                  Descrição & Escopo
                </span>
                <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">
                  {contract.description}
                </p>
              </div>
            )}

            {/* Itens Contratados */}
            {contract.items && contract.items.length > 0 && (
              <div className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-2">
                <div className="flex items-center gap-1.5 text-[#8E9CAE] text-[10px] font-mono uppercase">
                  <Layers className="w-3 h-3 text-[#38BDF8]" />
                  <span>Entregas & Serviços Discriminados</span>
                </div>
                <div className="space-y-1.5">
                  {contract.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded bg-[#0A0C12] border border-[#1E2332]/60 text-xs"
                    >
                      <div>
                        <div className="font-medium text-[#F4F4F5]">{item.description}</div>
                        <div className="text-[10px] text-[#8E9CAE]">
                          Qtd: {item.quantity} × {formatCurrency(item.unitPriceCents)}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-[#F4F4F5]">
                        {formatCurrency(item.totalPriceCents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloco de Anexos com Arquitetura Neon PostgreSQL */}
            <div className="p-3.5 rounded-xl bg-[#18212B] border border-[#273340] space-y-2">
              <div className="flex items-center gap-1.5 text-[#38BDF8] text-xs font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>Gestão de Anexos & PostgreSQL Neon</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Nesta fase SQLite, uploads pesados de arquivos estão desabilitados para manter o
                banco leve. A estrutura está totalmente pronta para receber os PDFs e contratos
                assinados quando ativada a migração para a nuvem Neon Database.
              </p>
            </div>
          </div>

          {/* Rodapé */}
          <div className="p-4 border-t border-[#1E2332] bg-[#0E1017] flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
