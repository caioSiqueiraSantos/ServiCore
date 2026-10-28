import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { X, ArrowDownRight, CheckCircle2 } from 'lucide-react'
import type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  CreateExpensePayload,
} from '@/types'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expenseToEdit?: Expense | null
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const queryClient = useQueryClient()
  const isEditing = Boolean(expenseToEdit)

  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<ExpenseCategory>('SoftwareAndTools')
  const [amountStr, setAmountStr] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [supplier, setSupplier] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isAlreadyPaid, setIsAlreadyPaid] = useState<boolean>(false)
  const [paymentDate, setPaymentDate] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CreditCard')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description)
      setCategory(expenseToEdit.category)
      setAmountStr((expenseToEdit.amountCents / 100).toFixed(2))
      setDueDate(expenseToEdit.dueDate.split('T')[0])
      setSupplier(expenseToEdit.supplier || '')
      setNotes(expenseToEdit.notes || '')
      setIsAlreadyPaid(expenseToEdit.status === 'Paid')
      setPaymentDate(expenseToEdit.paymentDate ? expenseToEdit.paymentDate.split('T')[0] : '')
      setPaymentMethod(expenseToEdit.paymentMethod || 'CreditCard')
    } else {
      setDescription('')
      setCategory('SoftwareAndTools')
      setAmountStr('')
      const today = new Date().toISOString().split('T')[0]
      setDueDate(today)
      setSupplier('')
      setNotes('')
      setIsAlreadyPaid(false)
      setPaymentDate(today)
      setPaymentMethod('CreditCard')
    }
    setErrorMessage(null)
  }, [expenseToEdit, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      api.post<Expense>('/finance/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Falha ao registrar despesa.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      api.put<Expense>(`/finance/expenses/${expenseToEdit?.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Falha ao atualizar despesa.')
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!description.trim()) {
      setErrorMessage('A descrição da despesa é obrigatória.')
      return
    }

    const parsed = parseFloat(amountStr.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMessage('Informe um valor válido maior que zero.')
      return
    }

    const amountCents = Math.round(parsed * 100)

    if (isEditing) {
      updateMutation.mutate({
        description: description.trim(),
        category,
        amountCents,
        dueDate: new Date(dueDate).toISOString(),
        supplier: supplier.trim() || null,
        notes: notes.trim() || null,
      })
    } else {
      createMutation.mutate({
        description: description.trim(),
        category,
        amountCents,
        dueDate: new Date(dueDate).toISOString(),
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        isAlreadyPaid,
        paymentDate: isAlreadyPaid && paymentDate ? new Date(paymentDate).toISOString() : undefined,
        paymentMethod: isAlreadyPaid ? paymentMethod : undefined,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#111820] border border-[#273340] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#273340] bg-[#18212B]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F43F5E]/10 text-[#F43F5E]">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F1F5F9]">
                {isEditing ? 'Editar Despesa' : 'Nova Despesa Operacional'}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Registre saídas operacionais, ferramentas, impostos ou despesas fixas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#273340] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Assinatura GitHub, Hospedagem Neon, Coworking..."
              className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
              required
            />
          </div>

          {/* Categoria e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="SoftwareAndTools">Softwares & Ferramentas</option>
                <option value="OfficeAndCoworking">Escritório & Coworking</option>
                <option value="MarketingAndSales">Marketing & Vendas</option>
                <option value="TaxesAndAccounting">Impostos & Contabilidade</option>
                <option value="EquipmentAndHardware">Equipamentos & Hardware</option>
                <option value="ThirdPartyServices">Serviços de Terceiros</option>
                <option value="SalariesAndWithdrawals">Pró-Labore & Salários</option>
                <option value="Other">Outras Despesas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Valor da Despesa (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">R$</span>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vencimento e Fornecedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Fornecedor / Beneficiário
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ex: Google, AWS, Vercel, WeWork..."
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          {/* Flag se já está paga no momento do cadastro */}
          {!isEditing && (
            <div className="p-3 bg-[#0B0F14] border border-[#273340] rounded-lg space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAlreadyPaid}
                  onChange={(e) => setIsAlreadyPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#38BDF8] focus:ring-0 bg-[#18212B] border-[#273340]"
                />
                <span className="text-xs font-medium text-[#F1F5F9]">
                  Esta despesa já foi paga (liquidada agora)?
                </span>
              </label>

              {isAlreadyPaid && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#273340]/50 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Data do Pagamento</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#18212B] border border-[#273340] rounded text-[#F1F5F9] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Método de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-2.5 py-1.5 bg-[#18212B] border border-[#273340] rounded text-[#F1F5F9] text-xs"
                    >
                      <option value="CreditCard">Cartão de Crédito</option>
                      <option value="Pix">Pix Instantâneo</option>
                      <option value="BankTransfer">TED / Transferência</option>
                      <option value="BankSlip">Boleto Bancário</option>
                      <option value="Cash">Dinheiro</option>
                      <option value="Other">Outro</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Observações (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais, link do recibo, detalhes..."
              rows={2}
              className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8] resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#273340]">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-[#F43F5E]" />}
            >
              {isEditing ? 'Salvar Alterações' : 'Registrar Despesa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
