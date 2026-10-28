import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { X, CheckCircle2, DollarSign, QrCode, CreditCard, Landmark, Banknote, HelpCircle } from 'lucide-react'
import type { Receivable, PaymentMethod, RegisterPaymentPayload } from '@/types'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  receivable: Receivable
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  receivable,
}) => {
  const queryClient = useQueryClient()

  const [amountInput, setAmountInput] = useState<string>(
    (receivable.remainingAmountCents / 100).toFixed(2)
  )
  const [method, setMethod] = useState<PaymentMethod>('Pix')
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [transactionReference, setTransactionReference] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Mutação para registrar o pagamento
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPaymentPayload) =>
      api.post<Receivable>(`/finance/receivables/${receivable.id}/payments`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Erro ao registrar baixa no pagamento.')
    },
  })

  if (!isOpen) return null

  const remainingCents = receivable.remainingAmountCents
  const remainingReais = remainingCents / 100

  const handleQuickAmount = (ratio: number) => {
    const val = (remainingReais * ratio).toFixed(2)
    setAmountInput(val)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const parsed = parseFloat(amountInput.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMessage('Informe um valor de pagamento válido maior que zero.')
      return
    }

    const amountCents = Math.round(parsed * 100)
    if (amountCents > remainingCents) {
      setErrorMessage(
        `O valor não pode exceder o saldo restante de ${formatCurrency(remainingCents)}.`
      )
      return
    }

    registerMutation.mutate({
      amountCents,
      paymentDate: new Date(paymentDate).toISOString(),
      method,
      notes: notes.trim() || undefined,
      transactionReference: transactionReference.trim() || undefined,
      idempotencyKey: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    })
  }

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'Pix', label: 'Pix', icon: <QrCode className="w-4 h-4 text-[#38BDF8]" /> },
    { id: 'BankTransfer', label: 'TED / Transf.', icon: <Landmark className="w-4 h-4 text-[#34D399]" /> },
    { id: 'CreditCard', label: 'Cartão de Crédito', icon: <CreditCard className="w-4 h-4 text-[#A78BFA]" /> },
    { id: 'BankSlip', label: 'Boleto', icon: <DollarSign className="w-4 h-4 text-[#FBBF24]" /> },
    { id: 'Cash', label: 'Dinheiro', icon: <Banknote className="w-4 h-4 text-[#F43F5E]" /> },
    { id: 'Other', label: 'Outro', icon: <HelpCircle className="w-4 h-4 text-[#94A3B8]" /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#111820] border border-[#273340] rounded-xl shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#273340] bg-[#18212B]/50">
          <div>
            <h3 className="text-lg font-bold text-[#F1F5F9]">Registrar Baixa de Pagamento</h3>
            <p className="text-xs text-[#94A3B8] truncate max-w-xs sm:max-w-md">
              {receivable.title} &bull; {receivable.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#273340] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Saldo */}
        <div className="px-6 py-3 bg-[#0B0F14] border-b border-[#273340] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#94A3B8]">Valor Total:</span>{' '}
            <span className="font-semibold text-[#F1F5F9]">{formatCurrency(receivable.amountCents)}</span>
          </div>
          <div>
            <span className="text-[#94A3B8]">Já Pago:</span>{' '}
            <span className="font-semibold text-[#34D399]">{formatCurrency(receivable.paidAmountCents)}</span>
          </div>
          <div>
            <span className="text-[#94A3B8]">Restante a Liquidar:</span>{' '}
            <span className="font-bold text-[#38BDF8]">{formatCurrency(receivable.remainingAmountCents)}</span>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Valor da Baixa */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Valor da Baixa (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">R$</span>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] font-mono text-base focus:outline-none focus:border-[#38BDF8] transition-colors"
                required
              />
            </div>

            {/* Botões de Preenchimento Rápido */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(1)}
                className="text-[11px] px-2.5 py-1 rounded bg-[#273340]/60 hover:bg-[#38BDF8]/20 hover:text-[#38BDF8] text-[#94A3B8] transition-colors"
              >
                100% (Total: {formatCurrency(remainingCents)})
              </button>
              {remainingCents > 100 && (
                <button
                  type="button"
                  onClick={() => handleQuickAmount(0.5)}
                  className="text-[11px] px-2.5 py-1 rounded bg-[#273340]/60 hover:bg-[#38BDF8]/20 hover:text-[#38BDF8] text-[#94A3B8] transition-colors"
                >
                  50% ({formatCurrency(remainingCents / 2)})
                </button>
              )}
            </div>
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setMethod(pm.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    method === pm.id
                      ? 'border-[#38BDF8] bg-[#38BDF8]/10 text-[#38BDF8]'
                      : 'border-[#273340] bg-[#0B0F14] text-[#94A3B8] hover:border-[#38BDF8]/50'
                  }`}
                >
                  {pm.icon}
                  <span className="truncate">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data do Pagamento & Comprovante/Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Data do Pagamento *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Código / Ref. Transação
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="Ex: PIX-998812 ou Aut. Cartão"
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Observações da Baixa (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Depositado pelo cliente no Banco Itaú c/c 12345..."
              rows={2}
              className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8] resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#273340]">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={registerMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-[#34D399]" />}
            >
              Confirmar Baixa
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
