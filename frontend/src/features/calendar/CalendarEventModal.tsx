import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Calendar as CalendarIcon } from 'lucide-react'
import type {
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
  Customer,
  Contract,
  PagedResult,
} from '@/types'

interface CalendarEventModalProps {
  isOpen: boolean
  onClose: () => void
  eventToEdit?: CalendarEvent | null
  defaultDate?: string
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  defaultDate,
}) => {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationOrLink, setLocationOrLink] = useState('')
  const [type, setType] = useState<CalendarEventType>('Meeting')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('10:00')
  const [customerId, setCustomerId] = useState('')
  const [contractId, setContractId] = useState('')
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

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title)
      setDescription(eventToEdit.description || '')
      setLocationOrLink(eventToEdit.locationOrLink || '')
      setType(eventToEdit.type)
      const start = new Date(eventToEdit.startTimeUtc)
      const end = new Date(eventToEdit.endTimeUtc)
      setStartDate(start.toISOString().slice(0, 10))
      setStartTime(start.toTimeString().slice(0, 5))
      setEndDate(end.toISOString().slice(0, 10))
      setEndTime(end.toTimeString().slice(0, 5))
      setCustomerId(eventToEdit.customerId || '')
      setContractId(eventToEdit.contractId || '')
    } else {
      setTitle('')
      setDescription('')
      setLocationOrLink('')
      setType('Meeting')
      const targetDate = defaultDate || new Date().toISOString().slice(0, 10)
      setStartDate(targetDate)
      setStartTime('10:00')
      setEndDate(targetDate)
      setEndTime('11:00')
      setCustomerId('')
      setContractId('')
    }
    setErrorMessage(null)
  }, [eventToEdit, defaultDate, isOpen])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const startDateTime = new Date(`${startDate}T${startTime}:00Z`).toISOString()
      const endDateTime = new Date(`${endDate || startDate}T${endTime}:00Z`).toISOString()

      if (eventToEdit) {
        const payload: UpdateCalendarEventPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          locationOrLink: locationOrLink.trim() || undefined,
          startTimeUtc: startDateTime,
          endTimeUtc: endDateTime,
          type,
          customerId: customerId || undefined,
          contractId: contractId || undefined,
        }
        return api.put<CalendarEvent>(`/calendar/${eventToEdit.id}`, payload)
      } else {
        const payload: CreateCalendarEventPayload = {
          title: title.trim(),
          description: description.trim() || undefined,
          locationOrLink: locationOrLink.trim() || undefined,
          startTimeUtc: startDateTime,
          endTimeUtc: endDateTime,
          type,
          customerId: customerId || undefined,
          contractId: contractId || undefined,
        }
        return api.post<CalendarEvent>('/calendar', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Erro ao agendar compromisso.')
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage('O título do compromisso é obrigatório.')
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
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F4F4F5]">
                {eventToEdit ? 'Editar Compromisso' : 'Agendar Novo Compromisso'}
              </h3>
              <p className="text-[11px] text-[#8E9CAE]">
                Reuniões com clientes, marcos de entrega e alinhamentos
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
              Título do Compromisso *
            </label>
            <Input
              type="text"
              placeholder="Ex: Reunião de Alinhamento e Demonstração"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Tipo de Evento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CalendarEventType)}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
              >
                <option value="Meeting">Reunião com Cliente</option>
                <option value="Delivery">Entrega de Marco / Projeto</option>
                <option value="FollowUp">Follow-up / Acompanhamento</option>
                <option value="Internal">Compromisso Interno</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Local ou Link (Meet / Teams)
              </label>
              <Input
                type="text"
                placeholder="Ex: Google Meet, Zoom ou Escritório"
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
              />
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Data do Evento *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (!endDate) setEndDate(e.target.value)
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                  Início
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                  Término
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vínculo: Cliente e Contrato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
                Cliente (Opcional)
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value)
                  setContractId('')
                }}
                className="w-full bg-[#0A0C12] border border-[#1E2332] rounded-lg px-3 py-2 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
              >
                <option value="">Nenhum cliente específico</option>
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
                {contractsData?.items
                  .filter((c) => !customerId || c.customerId === customerId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8E9CAE] mb-1">
              Pauta / Observações
            </label>
            <textarea
              rows={2}
              placeholder="Descreva tópicos a discutir ou notas de preparação..."
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
              {eventToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
