import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, CheckSquare } from 'lucide-react'
import type {
  TaskItem,
  TaskPriority,
  CreateTaskPayload,
  UpdateTaskPayload,
  Customer,
  Contract,
  ServiceItem,
  PagedResult,
} from '@/types'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: TaskItem | null
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
}) => {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [dueDate, setDueDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [spentMinutes, setSpentMinutes] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [contractId, setContractId] = useState('')
  const [serviceItemId, setServiceItemId] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Clientes
  const { data: customersData } = useQuery<PagedResult<Customer>>({
    queryKey: ['customers-list-all'],
    queryFn: () => api.get<PagedResult<Customer>>('/customers?pageSize=100&status=1'),
    enabled: isOpen,
  })

  // Contratos
  const { data: contractsData } = useQuery<PagedResult<Contract>>({
    queryKey: ['contracts-list-all'],
    queryFn: () => api.get<PagedResult<Contract>>('/contracts?pageSize=100'),
    enabled: isOpen,
  })

  // Serviços
  const { data: servicesData } = useQuery<PagedResult<ServiceItem>>({
    queryKey: ['services-list-all'],
    queryFn: () => api.get<PagedResult<ServiceItem>>('/services?pageSize=100&status=1'),
    enabled: isOpen,
  })

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setDescription(taskToEdit.description || '')
      setPriority(taskToEdit.priority)
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.slice(0, 10) : '')
      setEstimatedMinutes(taskToEdit.estimatedMinutes ? taskToEdit.estimatedMinutes.toString() : '')
      setSpentMinutes(taskToEdit.spentMinutes ? taskToEdit.spentMinutes.toString() : '')
      setCustomerId(taskToEdit.customerId || '')
      setContractId(taskToEdit.contractId || '')
      setServiceItemId(taskToEdit.serviceItemId || '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('Medium')
      setDueDate('')
      setEstimatedMinutes('')
      setSpentMinutes('')
      setCustomerId('')
      setContractId('')
      setServiceItemId('')
    }
    setErrorMessage(null)
  }, [taskToEdit, isOpen])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const estMin = estimatedMinutes.trim() ? parseInt(estimatedMinutes) : undefined
      const spentMin = spentMinutes.trim() ? parseInt(spentMinutes) : undefined

      if (taskToEdit) {
        const payload: UpdateTaskPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          estimatedMinutes: estMin,
          spentMinutes: spentMin,
          customerId: customerId || undefined,
          contractId: contractId || undefined,
          serviceItemId: serviceItemId || undefined,
        }
        return api.put<TaskItem>(`/tasks/${taskToEdit.id}`, payload)
      } else {
        const payload: CreateTaskPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          estimatedMinutes: estMin,
          customerId: customerId || undefined,
          contractId: contractId || undefined,
          serviceItemId: serviceItemId || undefined,
        }
        return api.post<TaskItem>('/tasks', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Erro ao salvar tarefa.')
    },
  })

  if (!isOpen) return null

  const filteredContracts = contractsData?.items.filter(
    (c) => !customerId || c.customerId === customerId
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('O título da tarefa é obrigatório.')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#11131C] border border-[#1E2332] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E2332] bg-[#0E1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1D68F2]/15 text-[#38BDF8] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F4F5]">
                {taskToEdit ? 'Editar Tarefa Operacional' : 'Nova Tarefa'}
              </h3>
              <p className="text-[11px] text-[#8E9CAE]">
                Defina entregas, prioridade e vínculos com contratos
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#F87171]">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Título da Tarefa *
            </label>
            <Input
              type="text"
              placeholder="Ex: Desenvolver fluxo de checkout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
              >
                <option value="Low">Baixa</option>
                <option value="Medium">Média</option>
                <option value="High">Alta</option>
                <option value="Urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Data de Vencimento / Prazo
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Vínculo: Cliente e Contrato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Cliente Vinculado (Opcional)
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value)
                  setContractId('')
                }}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
              >
                <option value="">Nenhum cliente (Tarefa interna)</option>
                {customersData?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Contrato Vinculado (Opcional)
              </label>
              <select
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
              >
                <option value="">Nenhum contrato</option>
                {filteredContracts?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Serviço do Catálogo (Opcional)
            </label>
            <select
              value={serviceItemId}
              onChange={(e) => setServiceItemId(e.target.value)}
              className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
            >
              <option value="">Nenhum serviço associado</option>
              {servicesData?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Tempo Estimado (Minutos)
              </label>
              <Input
                type="number"
                placeholder="Ex: 120 (2h)"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
              />
            </div>

            {taskToEdit && (
              <div>
                <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                  Tempo Gasto (Minutos)
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 90"
                  value={spentMinutes}
                  onChange={(e) => setSpentMinutes(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Descrição / Checklist
            </label>
            <textarea
              rows={3}
              placeholder="Instruções de execução, notas ou critérios de aceitação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg p-2.5 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
            />
          </div>

          {/* Rodapé */}
          <div className="pt-2 border-t border-[#1E2332] flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={saveMutation.isPending}
            >
              {taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
