import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Briefcase } from 'lucide-react'
import type {
  ServiceItem,
  ServiceBillingUnit,
  ServiceStatus,
  CreateServicePayload,
  UpdateServicePayload,
} from '@/types'

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  serviceToEdit?: ServiceItem | null
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  serviceToEdit,
}) => {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultPriceInput, setDefaultPriceInput] = useState('')
  const [billingUnit, setBillingUnit] = useState<ServiceBillingUnit>('Hour')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [status, setStatus] = useState<ServiceStatus>('Active')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name)
      setDescription(serviceToEdit.description || '')
      setDefaultPriceInput((serviceToEdit.defaultPriceCents / 100).toFixed(2))
      setBillingUnit(serviceToEdit.billingUnit)
      setEstimatedHours(serviceToEdit.estimatedHours ? serviceToEdit.estimatedHours.toString() : '')
      setStatus(serviceToEdit.status)
    } else {
      setName('')
      setDescription('')
      setDefaultPriceInput('')
      setBillingUnit('Hour')
      setEstimatedHours('')
      setStatus('Active')
    }
    setErrorMessage(null)
  }, [serviceToEdit, isOpen])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanPrice = parseFloat(defaultPriceInput.replace(',', '.')) || 0
      const defaultPriceCents = Math.round(cleanPrice * 100)
      const hoursNum = estimatedHours.trim() ? parseFloat(estimatedHours) : undefined

      if (serviceToEdit) {
        const payload: UpdateServicePayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          defaultPriceCents,
          billingUnit,
          estimatedHours: hoursNum,
          status,
        }
        return api.put<ServiceItem>(`/services/${serviceToEdit.id}`, payload)
      } else {
        const payload: CreateServicePayload = {
          name: name.trim(),
          description: description.trim() || undefined,
          defaultPriceCents,
          billingUnit,
          estimatedHours: hoursNum,
        }
        return api.post<ServiceItem>('/services', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['services-list-all'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Erro ao salvar serviço.')
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMessage('Informe o nome do serviço.')
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
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F4F5]">
                {serviceToEdit ? 'Editar Serviço do Catálogo' : 'Novo Serviço Padronizado'}
              </h3>
              <p className="text-[11px] text-[#8E9CAE]">
                Padronize títulos, valores e unidades de cobrança
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#F87171]">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Nome do Serviço *
            </label>
            <Input
              type="text"
              placeholder="Ex: Consultoria em Cloud DevOps"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Unidade de Cobrança *
              </label>
              <select
                value={billingUnit}
                onChange={(e) => setBillingUnit(e.target.value as ServiceBillingUnit)}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
              >
                <option value="Hour">Por Hora (/h)</option>
                <option value="Project">Por Projeto / Escopo</option>
                <option value="Month">Mensalidade (/mês)</option>
                <option value="Deliverable">Por Entrega / Marco</option>
                <option value="Unit">Por Unidade</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Preço Padrão (R$) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={defaultPriceInput}
                onChange={(e) => setDefaultPriceInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Horas Estimadas de Trabalho
              </label>
              <Input
                type="number"
                step="0.5"
                placeholder="Ex: 8"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>

            {serviceToEdit && (
              <div>
                <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                  className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
                >
                  <option value="Active">Ativo</option>
                  <option value="Inactive">Inativo</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Descrição Detalhada do Serviço
            </label>
            <textarea
              rows={3}
              placeholder="Descreva o escopo padrão, ferramentas ou entregáveis deste serviço..."
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
              {serviceToEdit ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
