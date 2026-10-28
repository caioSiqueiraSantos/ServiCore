import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { X, DollarSign, Calendar, Layers, FileText, CheckCircle2 } from 'lucide-react'
import type {
  Receivable,
  ReceivableCategory,
  CreateReceivablePayload,
  Customer,
  Contract,
} from '@/types'

interface ReceivableModalProps {
  isOpen: boolean
  onClose: () => void
  receivableToEdit?: Receivable | null
}

export const ReceivableModal: React.FC<ReceivableModalProps> = ({
  isOpen,
  onClose,
  receivableToEdit,
}) => {
  const queryClient = useQueryClient()
  const isEditing = Boolean(receivableToEdit)

  // Estados do formulário
  const [customerId, setCustomerId] = useState<string>('')
  const [contractId, setContractId] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<ReceivableCategory>('ServiceExecution')
  const [amountStr, setAmountStr] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [issueDate, setIssueDate] = useState<string>('')
  const [totalInstallments, setTotalInstallments] = useState<number>(1)
  const [notes, setNotes] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Carrega clientes para o dropdown
  const { data: customersData } = useQuery<{ items: Customer[] } | Customer[]>({
    queryKey: ['customers-list-modal'],
    queryFn: () => api.get<any>('/customers?pageSize=100'),
    enabled: isOpen,
  })

  const customers: Customer[] = Array.isArray(customersData)
    ? customersData
    : (customersData as any)?.items || []

  // Carrega contratos para o dropdown
  const { data: contractsData } = useQuery<{ items: Contract[] } | Contract[]>({
    queryKey: ['contracts-list-modal'],
    queryFn: () => api.get<any>('/contracts?pageSize=100'),
    enabled: isOpen,
  })

  const contracts: Contract[] = Array.isArray(contractsData)
    ? contractsData
    : (contractsData as any)?.items || []

  useEffect(() => {
    if (receivableToEdit) {
      setCustomerId(receivableToEdit.customerId)
      setContractId(receivableToEdit.contractId || '')
      setTitle(receivableToEdit.title)
      setDescription(receivableToEdit.description || '')
      setCategory(receivableToEdit.category)
      setAmountStr((receivableToEdit.amountCents / 100).toFixed(2))
      setDueDate(receivableToEdit.dueDate.split('T')[0])
      setIssueDate(receivableToEdit.issueDate.split('T')[0])
      setTotalInstallments(receivableToEdit.totalInstallments || 1)
      setNotes(receivableToEdit.notes || '')
    } else {
      setCustomerId('')
      setContractId('')
      setTitle('')
      setDescription('')
      setCategory('ServiceExecution')
      setAmountStr('')
      const today = new Date()
      const future = new Date()
      future.setDate(today.getDate() + 15)
      setDueDate(future.toISOString().split('T')[0])
      setIssueDate(today.toISOString().split('T')[0])
      setTotalInstallments(1)
      setNotes('')
    }
    setErrorMessage(null)
  }, [receivableToEdit, isOpen])

  const createMutation = useMutation({
    mutationFn: (payload: CreateReceivablePayload) =>
      api.post<Receivable[]>('/finance/receivables', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Falha ao salvar conta a receber.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      api.put<Receivable>(`/finance/receivables/${receivableToEdit?.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Falha ao atualizar conta a receber.')
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!customerId) {
      setErrorMessage('Por favor, selecione o cliente.')
      return
    }

    if (!title.trim()) {
      setErrorMessage('O título da conta a receber é obrigatório.')
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
        customerId,
        contractId: contractId || null,
        title: title.trim(),
        description: description.trim() || null,
        category,
        amountCents,
        dueDate: new Date(dueDate).toISOString(),
        issueDate: issueDate ? new Date(issueDate).toISOString() : null,
        installmentNumber: receivableToEdit?.installmentNumber || 1,
        totalInstallments: totalInstallments || 1,
        notes: notes.trim() || null,
      })
    } else {
      createMutation.mutate({
        customerId,
        contractId: contractId || null,
        title: title.trim(),
        description: description.trim() || null,
        category,
        amountCents,
        dueDate: new Date(dueDate).toISOString(),
        issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
        totalInstallments: totalInstallments > 1 ? totalInstallments : 1,
        notes: notes.trim() || null,
      })
    }
  }

  // Cálculo da parcela prévia
  const parsedAmount = parseFloat(amountStr.replace(',', '.')) || 0
  const installmentValueCents =
    totalInstallments > 0 ? Math.round((parsedAmount * 100) / totalInstallments) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#111820] border border-[#273340] rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#273340] bg-[#18212B]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F1F5F9]">
                {isEditing ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {isEditing
                  ? 'Atualize os dados e vencimentos da cobrança'
                  : 'Cadastre faturas à vista ou parceladas com cálculo em centavos'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Cliente e Contrato Vinculado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Cliente *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
                required
              >
                <option value="">Selecione um cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.document ? `(${c.document})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Contrato Vinculado (Opcional)
              </label>
              <select
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="">Nenhum contrato vinculado</option>
                {contracts.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Título e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Título do Lançamento *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Parcela de Desenvolvimento Web, Consultoria..."
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReceivableCategory)}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="ServiceExecution">Execução de Serviços</option>
                <option value="Consulting">Consultoria Especializada</option>
                <option value="RecurringSubscription">Mensalidade / Recorrente</option>
                <option value="Advisory">Assessoria Contínua</option>
                <option value="AdvancePayment">Entrada / Adiantamento</option>
                <option value="Other">Outro Recebimento</option>
              </select>
            </div>
          </div>

          {/* Valor, Data de Vencimento e Parcelamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Valor Total (R$) *
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

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Data de Vencimento (1ª Parcela) *
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
                Parcelamento
              </label>
              <select
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number(e.target.value))}
                disabled={isEditing}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8] disabled:opacity-50"
              >
                <option value={1}>À vista (1x)</option>
                <option value={2}>2x mensais</option>
                <option value={3}>3x mensais</option>
                <option value={4}>4x mensais</option>
                <option value={6}>6x semestral</option>
                <option value={10}>10x mensais</option>
                <option value={12}>12x anual</option>
              </select>
            </div>
          </div>

          {/* Banner de Pré-visualização de Parcelas */}
          {!isEditing && totalInstallments > 1 && parsedAmount > 0 && (
            <div className="p-3 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-lg flex items-center justify-between text-xs text-[#38BDF8]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>
                  Serão geradas <strong>{totalInstallments} parcelas mensais</strong> de aprox.{' '}
                  <strong>{formatCurrency(installmentValueCents)}</strong> cada.
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8]">
                Vencimentos calculados a cada 30 dias
              </span>
            </div>
          )}

          {/* Descrição e Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Descrição do Escopo / Fatura
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre o que está sendo faturado..."
                rows={3}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Instruções / Observações Internas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Enviar lembrete 3 dias antes por WhatsApp..."
                rows={3}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#273340] rounded-lg text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8] resize-none"
              />
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#273340] shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />}
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Conta a Receber'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
