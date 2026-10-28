import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  X,
  User,
  FileText,
  Calendar,
  CheckCircle2,
  DollarSign,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import type { Receivable } from '@/types'

interface ReceivableDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  receivable: Receivable | null
  onOpenPaymentModal: (receivable: Receivable) => void
  onOpenSimulator: (receivable: Receivable) => void
}

export const ReceivableDetailsDrawer: React.FC<ReceivableDetailsDrawerProps> = ({
  isOpen,
  onClose,
  receivable,
  onOpenPaymentModal,
  onOpenSimulator,
}) => {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/finance/receivables/${receivable?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      onClose()
    },
    onError: (err: any) => {
      alert(err.message || 'Erro ao cancelar conta a receber.')
    },
  })

  if (!isOpen || !receivable) return null

  const percentPaid =
    receivable.amountCents > 0
      ? Math.min(100, Math.round((receivable.paidAmountCents / receivable.amountCents) * 100))
      : 0

  const getStatusBadge = () => {
    switch (receivable.status) {
      case 'Paid':
        return <Badge variant="emerald">Quitado</Badge>
      case 'PartiallyPaid':
        return <Badge variant="sky">Parcialmente Pago</Badge>
      case 'Overdue':
        return <Badge variant="rose">Atrasado</Badge>
      case 'Cancelled':
        return <Badge variant="gray">Cancelado</Badge>
      default:
        return <Badge variant="amber">Pendente</Badge>
    }
  }

  const handleDelete = () => {
    const isPaid = receivable.paidAmountCents > 0
    const msg = isPaid
      ? 'Esta conta possui baixas registradas. O cancelamento estornará a pendência. Continuar?'
      : 'Tem certeza que deseja excluir esta conta a receber?'

    if (confirm(msg)) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#111820] border-l border-[#273340] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#273340] bg-[#18212B]/40 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {getStatusBadge()}
                {receivable.installmentNumber && receivable.totalInstallments && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#273340] text-[#94A3B8]">
                    Parcela {receivable.installmentNumber}/{receivable.totalInstallments}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-[#F1F5F9] leading-tight">
                {receivable.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#273340] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Bloco de Valor e Progresso de Pagamento */}
            <div className="p-4 rounded-xl bg-[#0B0F14] border border-[#273340] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Status de Quitação</span>
                <span className="font-bold text-[#F1F5F9]">{percentPaid}%</span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2 rounded-full bg-[#18212B] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentPaid === 100
                      ? 'bg-[#34D399]'
                      : percentPaid > 0
                      ? 'bg-[#38BDF8]'
                      : 'bg-[#273340]'
                  }`}
                  style={{ width: `${percentPaid}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#273340]/50 text-xs">
                <div>
                  <div className="text-[11px] text-[#94A3B8]">Valor Total</div>
                  <div className="font-semibold text-[#F1F5F9]">
                    {formatCurrency(receivable.amountCents)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#94A3B8]">Saldo Restante</div>
                  <div
                    className={`font-bold ${
                      receivable.remainingAmountCents === 0 ? 'text-[#34D399]' : 'text-[#38BDF8]'
                    }`}
                  >
                    {formatCurrency(receivable.remainingAmountCents)}
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Cliente e Vencimento */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-[#F1F5F9] uppercase tracking-wider text-[11px]">
                Informações da Cobrança
              </h4>

              <div className="grid grid-cols-1 gap-2.5 p-3 rounded-lg bg-[#18212B]/40 border border-[#273340]">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <User className="w-4 h-4 text-[#38BDF8]" />
                  <span>Cliente:</span>
                  <strong className="text-[#F1F5F9]">{receivable.customerName}</strong>
                </div>

                {receivable.contractTitle && (
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <FileText className="w-4 h-4 text-[#A78BFA]" />
                    <span>Contrato:</span>
                    <strong className="text-[#F1F5F9] truncate">{receivable.contractTitle}</strong>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Tag className="w-4 h-4 text-[#FBBF24]" />
                  <span>Categoria:</span>
                  <span className="text-[#F1F5F9]">{receivable.categoryName}</span>
                </div>

                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Calendar className="w-4 h-4 text-[#34D399]" />
                  <span>Vencimento:</span>
                  <span className="font-semibold text-[#F1F5F9]">{formatDate(receivable.dueDate)}</span>
                </div>

                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Calendar className="w-4 h-4 text-[#64748B]" />
                  <span>Emissão:</span>
                  <span className="text-[#94A3B8]">{formatDate(receivable.issueDate)}</span>
                </div>
              </div>

              {receivable.description && (
                <div className="p-3 rounded-lg bg-[#0B0F14] border border-[#273340]">
                  <div className="text-[11px] font-semibold text-[#94A3B8] mb-1">Descrição</div>
                  <p className="text-xs text-[#CBD5E1] whitespace-pre-wrap">{receivable.description}</p>
                </div>
              )}

              {receivable.notes && (
                <div className="p-3 rounded-lg bg-[#0B0F14] border border-[#273340]">
                  <div className="text-[11px] font-semibold text-[#94A3B8] mb-1">Observações Internas</div>
                  <p className="text-xs text-[#94A3B8] whitespace-pre-wrap">{receivable.notes}</p>
                </div>
              )}
            </div>

            {/* Histórico de Pagamentos e Baixas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#F1F5F9] uppercase tracking-wider text-[11px]">
                  Histórico de Baixas ({receivable.payments.length})
                </h4>
              </div>

              {receivable.payments.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#0B0F14] border border-[#273340] text-center text-xs text-[#94A3B8]">
                  Nenhum pagamento registrado ainda nesta conta.
                </div>
              ) : (
                <div className="space-y-2">
                  {receivable.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg bg-[#0B0F14] border border-[#273340] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                          <span className="font-semibold text-[#34D399]">
                            {formatCurrency(p.amountCents)}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#94A3B8]">
                          {formatDateTime(p.paymentDate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>Método: {p.methodName}</span>
                        {p.transactionReference && (
                          <span className="font-mono text-[10px] text-[#38BDF8]">
                            Ref: {p.transactionReference}
                          </span>
                        )}
                      </div>

                      {p.notes && (
                        <p className="text-[11px] text-[#CBD5E1] bg-[#18212B]/60 p-1.5 rounded">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-[#273340] bg-[#18212B]/60 flex flex-col gap-2 shrink-0">
            {receivable.status !== 'Paid' && receivable.status !== 'Cancelled' && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onClose()
                    onOpenPaymentModal(receivable)
                  }}
                  leftIcon={<CheckCircle2 className="w-4 h-4 text-[#34D399]" />}
                >
                  Dar Baixa Manual
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose()
                    onOpenSimulator(receivable)
                  }}
                  leftIcon={<QrCode className="w-4 h-4 text-[#38BDF8]" />}
                >
                  Simulador
                </Button>
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {receivable.paidAmountCents > 0 ? 'Cancelar Conta a Receber' : 'Excluir Lançamento'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
