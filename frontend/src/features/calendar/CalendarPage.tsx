import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CalendarEventModal } from './CalendarEventModal'
import { formatDate } from '@/lib/utils'
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Building2,
  Video,
} from 'lucide-react'
import type { CalendarEvent, CalendarEventType } from '@/types'

export const CalendarPage: React.FC = () => {
  // Data de referência do mês selecionado
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null)

  // Intervalo do mês visualizado
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Início e fim do mês
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // Consulta de eventos para o mês visível
  const { data: events, isLoading, isError, refetch, isRefetching } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', year, month],
    queryFn: () => {
      const start = new Date(year, month, 1).toISOString()
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      return api.get<CalendarEvent[]>(
        `/calendar?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(
          end
        )}&includeTaskDeadlines=true`
      )
    },
  })

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // Gera dias da grade do calendário (com preenchimento do mês anterior)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Domingo, 1 = Segunda...

  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = []

  // Dias do mês anterior
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    calendarDays.push({ date: d, isCurrentMonth: false })
  }

  // Dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    calendarDays.push({ date: d, isCurrentMonth: true })
  }

  // Dias do próximo mês para completar 35 ou 42 células
  const remainingCells = 42 - calendarDays.length
  if (remainingCells > 0 && remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i)
      calendarDays.push({ date: d, isCurrentMonth: false })
    }
  }

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  const getEventsForDay = (date: Date) => {
    if (!events) return []
    return events.filter((e) => {
      const eventDate = new Date(e.startTimeUtc)
      return isSameDay(eventDate, date)
    })
  }

  const selectedDayEvents = getEventsForDay(selectedDate)

  const getEventTypePill = (type: CalendarEventType) => {
    switch (type) {
      case 'Meeting':
        return 'bg-[#1D68F2]/20 text-[#38BDF8] border-[#1D68F2]/30'
      case 'Delivery':
        return 'bg-[#8B5CF6]/20 text-[#C084FC] border-[#8B5CF6]/30'
      case 'FollowUp':
        return 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/30'
      case 'TaskDeadline':
        return 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'
      case 'Internal':
        return 'bg-[#161A26] text-[#8E9CAE] border-[#1E2332]'
    }
  }

  const getEventTypeName = (type: CalendarEventType) => {
    switch (type) {
      case 'Meeting':
        return 'Reunião'
      case 'Delivery':
        return 'Entrega'
      case 'FollowUp':
        return 'Follow-up'
      case 'TaskDeadline':
        return 'Prazo de Tarefa'
      case 'Internal':
        return 'Interno'
    }
  }

  const handleOpenCreateForDate = (date: Date) => {
    setSelectedDate(date)
    setEventToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2332]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#F4F4F5]">Agenda & Compromissos</h2>
            <Badge variant="sky" className="text-[10px] font-mono">
              Etapa 3
            </Badge>
          </div>
          <p className="text-xs text-[#8E9CAE] mt-0.5">
            Visualizações integradas de compromissos, reuniões e prazos de contratos e tarefas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navegação de Mês */}
          <div className="flex items-center bg-[#11131C] border border-[#1E2332] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-[#F4F4F5] min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26] transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={goToToday}>
            Hoje
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreateForDate(selectedDate)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Novo Compromisso
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Carregando eventos da agenda..." />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar agenda"
          message="Não foi possível obter os compromissos."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Grade Mensal (3 colunas em lg) */}
          <div className="lg:col-span-3">
            <Card className="p-3 border-[#1E2332] bg-[#11131C]">
              {/* Cabeçalho dos Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-[#8E9CAE] pb-2 border-b border-[#1E2332]">
                {weekDays.map((w, idx) => (
                  <div key={idx} className="py-1">
                    {w}
                  </div>
                ))}
              </div>

              {/* Dias do Mês */}
              <div className="grid grid-cols-7 gap-1 pt-1.5">
                {calendarDays.map((cell, idx) => {
                  const dayEvents = getEventsForDay(cell.date)
                  const isToday = isSameDay(cell.date, new Date())
                  const isSelected = isSameDay(cell.date, selectedDate)

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`min-h-[85px] sm:min-h-[100px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#38BDF8] bg-[#141926]'
                          : isToday
                          ? 'border-[#1D68F2]/60 bg-[#0E131F]'
                          : cell.isCurrentMonth
                          ? 'border-[#1E2332]/50 bg-[#0D0F17] hover:bg-[#121520]'
                          : 'border-[#1E2332]/20 bg-[#090A10]/50 opacity-40'
                      }`}
                    >
                      {/* Número do Dia */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-[#38BDF8] text-[#090A0F]'
                              : isSelected
                              ? 'text-[#38BDF8]'
                              : 'text-[#8E9CAE]'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-mono text-[#8E9CAE]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Pílulas de Eventos */}
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium ${getEventTypePill(
                              ev.type
                            )}`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-[#8E9CAE] font-mono pl-1">
                            +{dayEvents.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Painel Lateral: Detalhes do Dia Selecionado */}
          <div className="lg:col-span-1 space-y-3">
            <Card className="p-4 border-[#1E2332] bg-[#11131C] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2332]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8E9CAE] block">
                    Dia Selecionado
                  </span>
                  <h3 className="text-sm font-bold text-[#F4F4F5]">
                    {formatDate(selectedDate)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCreateForDate(selectedDate)}
                  className="p-1.5 rounded-lg bg-[#1D68F2]/15 text-[#38BDF8] hover:bg-[#1D68F2]/30 transition-colors"
                  title="Agendar neste dia"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8E9CAE] space-y-2">
                  <CalendarIcon className="w-8 h-8 text-[#64748B] mx-auto opacity-50" />
                  <p>Nenhum compromisso agendado para este dia.</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenCreateForDate(selectedDate)}
                  >
                    Agendar Evento
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {selectedDayEvents.map((ev) => {
                    const startTime = new Date(ev.startTimeUtc).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const endTime = new Date(ev.endTimeUtc).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg bg-[#0E1017] border border-[#1E2332] space-y-1.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-semibold text-[#F4F4F5] leading-snug">
                            {ev.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${getEventTypePill(
                              ev.type
                            )}`}
                          >
                            {getEventTypeName(ev.type)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-[#8E9CAE] font-mono">
                          <Clock className="w-3 h-3 text-[#38BDF8]" />
                          <span>
                            {startTime} - {endTime}
                          </span>
                        </div>

                        {ev.locationOrLink && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#8E9CAE] truncate">
                            {ev.locationOrLink.includes('http') ||
                            ev.locationOrLink.toLowerCase().includes('meet') ? (
                              <Video className="w-3 h-3 text-[#38BDF8]" />
                            ) : (
                              <MapPin className="w-3 h-3 text-[#38BDF8]" />
                            )}
                            <span className="truncate">{ev.locationOrLink}</span>
                          </div>
                        )}

                        {ev.customerName && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#8E9CAE] truncate">
                            <Building2 className="w-3 h-3 text-[#8E9CAE]" />
                            <span className="truncate">{ev.customerName}</span>
                          </div>
                        )}

                        {ev.description && (
                          <p className="text-[11px] text-[#94A3B8] pt-1 border-t border-[#1E2332]/40">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={eventToEdit}
        defaultDate={selectedDate.toISOString().slice(0, 10)}
      />
    </div>
  )
}
