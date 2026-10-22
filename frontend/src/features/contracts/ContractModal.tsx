import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, FileText, Database, Plus, Trash2 } from 'lucide-react'
import type {
  Contract,
  ContractBillingType,
  CreateContractPayload,
  UpdateContractPayload,
  Customer,
  PagedResult,
  ServiceItem,
} from '@/types'

interface ContractModalProps {
  isOpen: boolean
  onClose: () => void
  contractToEdit?: Contract | null
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  contractToEdit,
}) => {
  const queryClient = useQueryClient()

  // Form states
  const [customerId, setCustomerId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ContractBillingType>('FixedPrice')
  const [amountInput, setAmountInput] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [description, setDescription] = useState('')
  const [terms, setTerms] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Scope items
  const [items, setItems] = useState<
    Array<{ serviceItemId?: string; description: string; quantity: number; unitPriceCents: number }>
  >([])

  // Busca lista de clientes para vincular ao contrato
  const { data: customersData } = useQuery<PagedResult<Customer>>({
    queryKey: ['customers-list-all'],
    queryFn: () => api.get<PagedResult<Customer>>('/customers?pageSize=100&status=1'),
    enabled: isOpen,
  })

  // Busca catálogo de serviços
  const { data: servicesData } = useQuery<PagedResult<ServiceItem>>({
    queryKey: ['services-list-all'],
    queryFn: () => api.get<PagedResult<ServiceItem>>('/services?pageSize=100&status=1'),
    enabled: isOpen,
  })

  useEffect(() => {
    if (contractToEdit) {
      setCustomerId(contractToEdit.customerId)
      setTitle(contractToEdit.title)
      setType(contractToEdit.type)
      setAmountInput((contractToEdit.amountCents / 100).toFixed(2))
      setStartDate(contractToEdit.startDate ? contractToEdit.startDate.slice(0, 10) : '')
      setEndDate(contractToEdit.endDate ? contractToEdit.endDate.slice(0, 10) : '')
      setEstimatedHours(contractToEdit.estimatedHours ? contractToEdit.estimatedHours.toString() : '')
      setDescription(contractToEdit.description || '')
      setTerms(contractToEdit.terms || '')
      setItems(
        contractToEdit.items.map((i) => ({
          serviceItemId: i.serviceItemId,
          description: i.description,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        }))
      )
    } else {
      setCustomerId('')
      setTitle('')
      setType('FixedPrice')
      setAmountInput('')
      const today = new Date().toISOString().slice(0, 10)
      setStartDate(today)
      setEndDate('')
      setEstimatedHours('')
      setDescription('')
      setTerms('')
      setItems([])
    }
    setErrorMessage(null)
  }, [contractToEdit, isOpen])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanAmount = parseFloat(amountInput.replace(',', '.')) || 0
      const amountCents = Math.round(cleanAmount * 100)
      const hoursNum = estimatedHours.trim() ? parseFloat(estimatedHours) : undefined

      if (contractToEdit) {
        const payload: UpdateContractPayload = {
          customerId,
          title: title.trim(),
          type,
          amountCents,
          estimatedHours: hoursNum,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          terms: terms.trim() || undefined,
          description: description.trim() || undefined,
        }
        return api.put<Contract>(`/contracts/${contractToEdit.id}`, payload)
      } else {
        const payload: CreateContractPayload = {
          customerId,
          title: title.trim(),
          type,
          amountCents,
          estimatedHours: hoursNum,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          terms: terms.trim() || undefined,
          description: description.trim() || undefined,
          items: items.length > 0 ? items : undefined,
        }
        return api.post<Contract>('/contracts', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contract-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Erro ao salvar contrato.')
    },
  })

  if (!isOpen) return null

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPriceCents: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...items]
    if (field === 'serviceItemId') {
      const service = servicesData?.items.find((s) => s.id === value)
      updated[index] = {
        ...updated[index],
        serviceItemId: value,
        description: service ? service.name : updated[index].description,
        unitPriceCents: service ? service.defaultPriceCents : updated[index].unitPriceCents,
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setItems(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      setErrorMessage('Selecione o cliente do contrato.')
      return
    }
    if (!title.trim()) {
      setErrorMessage('Informe o título do contrato.')
      return
    }
    if (!startDate) {
      setErrorMessage('Informe a data de início do contrato.')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#11131C] border border-[#1E2332] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E2332] bg-[#0E1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1D68F2]/15 text-[#38BDF8] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F4F5]">
                {contractToEdit ? 'Editar Contrato de Serviços' : 'Novo Contrato de Prestação'}
              </h3>
              <p className="text-[11px] text-[#8E9CAE]">
                Defina valores, modalidade, prazos e escopo do projeto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com rolagem */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#F87171]">
              {errorMessage}
            </div>
          )}

          {/* Cliente e Modalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Cliente Contratante *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
                required
              >
                <option value="">Selecione um cliente...</option>
                {customersData?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'Company' ? 'PJ' : 'PF'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Modalidade de Cobrança *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContractBillingType)}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
              >
                <option value="FixedPrice">Preço Fixo (Escopo Fechado)</option>
                <option value="Hourly">Por Hora (Banco de Horas)</option>
                <option value="Recurring">Recorrente (Retainer / Mensalidade)</option>
              </select>
            </div>
          </div>

          {/* Título do Contrato */}
          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Título do Contrato / Projeto *
            </label>
            <Input
              type="text"
              placeholder="Ex: Desenvolvimento de E-commerce & Design System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Valor e Horas Estimadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                {type === 'FixedPrice'
                  ? 'Valor Total Acordado (R$) *'
                  : type === 'Hourly'
                  ? 'Valor da Hora (R$/h) *'
                  : 'Valor da Recorrência / Mês (R$) *'}
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Horas Estimadas de Execução
              </label>
              <Input
                type="number"
                step="0.5"
                placeholder="Ex: 40"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>
          </div>

          {/* Prazos: Início e Fim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Data de Início *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Data de Término / Validade (Opcional)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Descrição e Escopo */}
          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Descrição do Escopo / Objetivos
            </label>
            <textarea
              rows={2}
              placeholder="Descreva as entregas acordadas, tecnologias ou detalhes relevantes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg p-2.5 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
            />
          </div>

          {/* Itens e Serviços do Contrato */}
          {!contractToEdit && (
            <div className="space-y-2 border-t border-[#1E2332] pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[#F4F4F5]">Itens / Serviços do Escopo</h4>
                  <p className="text-[10px] text-[#8E9CAE]">
                    Vincule serviços do catálogo ou cadastre entregas discriminadas
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddItem}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Adicionar Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-2 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <select
                        value={item.serviceItemId || ''}
                        onChange={(e) => handleItemChange(index, 'serviceItemId', e.target.value)}
                        className="w-full bg-[#0A0C12] border border-[#1E2332] rounded px-2 py-1.5 text-xs text-[#F4F4F5]"
                      >
                        <option value="">Serviço Avulso / Customizado</option>
                        {servicesData?.items.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (R$ {(s.defaultPriceCents / 100).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Descrição da entrega..."
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full bg-[#0A0C12] border border-[#1E2332] rounded px-2 py-1.5 text-xs text-[#F4F4F5]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        placeholder="Qtd"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)
                        }
                        className="w-full bg-[#0A0C12] border border-[#1E2332] rounded px-2 py-1.5 text-xs text-[#F4F4F5]"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-[#EF4444] hover:bg-[#EF4444]/15 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Banner Arquitetural: Preparado para PostgreSQL / Neon Database */}
          <div className="p-3 rounded-lg bg-[#18212B] border border-[#273340] flex items-start gap-2.5">
            <Database className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#94A3B8] leading-relaxed">
              <span className="font-semibold text-[#F1F5F9] block">
                Arquitetura de Anexos & PostgreSQL Neon:
              </span>
              Em ambiente SQLite local, o armazenamento de arquivos físicos pesados foi desacoplado
              para preservar a agilidade do banco. A estrutura de dados já está 100% pronta para a
              migração para o <strong className="text-[#38BDF8]">PostgreSQL Neon</strong> com
              suporte nativo a Object Storage.
            </div>
          </div>
        </form>

        {/* Rodapé com botões */}
        <div className="p-4 border-t border-[#1E2332] bg-[#0E1017] flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={saveMutation.isPending}
          >
            {contractToEdit ? 'Salvar Alterações' : 'Criar Contrato'}
          </Button>
        </div>
      </div>
    </div>
  )
}
