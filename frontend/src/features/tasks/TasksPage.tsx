import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { TaskModal } from './TaskModal'
import { formatDate } from '@/lib/utils'
import {
  CheckSquare,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  PlayCircle,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { TaskItem, TaskPriority, TaskItemStatus, PagedResult } from '@/types'

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [statusFilter, setStatusFilter] = useState<TaskItemStatus | ''>('')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [page, setPage] = useState(1)
  const pageSize = 50

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null)

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<PagedResult<TaskItem>>({
    queryKey: ['tasks', search, priorityFilter, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (priorityFilter) params.append('priority', priorityFilter)
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      return api.get<PagedResult<TaskItem>>(`/tasks?${params.toString()}`)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskItemStatus }) => {
      return api.patch(`/tasks/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    },
  })

  const handleOpenCreate = () => {
    setTaskToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (task: TaskItem) => {
    setTaskToEdit(task)
    setIsModalOpen(true)
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30">
            Urgente
          </span>
        )
      case 'High':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30">
            Alta
          </span>
        )
      case 'Medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#1D68F2]/20 text-[#38BDF8] border border-[#1D68F2]/30">
            Média
          </span>
        )
      case 'Low':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#161A26] text-[#8E9CAE] border border-[#1E2332]">
            Baixa
          </span>
        )
    }
  }

  const getDueDateInfo = (dueDateStr?: string) => {
    if (!dueDateStr) return null
    const due = new Date(dueDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)

    const isOverdue = due < today
    const isToday = due.getTime() === today.getTime()

    return {
      formatted: formatDate(dueDateStr),
      isOverdue,
      isToday,
    }
  }

  const filterByStatusGroup = (status: TaskItemStatus) => {
    if (!data) return []
    return data.items.filter((t) => t.status === status)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2332]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#F4F4F5]">Tarefas & Prazos da Operação</h2>
            {data && (
              <Badge variant="sky" className="text-[10px] font-mono">
                {data.totalCount} {data.totalCount === 1 ? 'tarefa' : 'tarefas'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#8E9CAE] mt-0.5">
            Organize o fluxo de entregas, prioridades e acompanhamento das etapas de cada contrato
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador de Visualização */}
          <div className="flex items-center bg-[#11131C] border border-[#1E2332] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'board'
                  ? 'bg-[#1D68F2] text-white'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#1D68F2] text-white'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
              title="Visualização em Lista / Tabela"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, escopo ou detalhes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-[#11131C] border border-[#1E2332] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4F4F5] placeholder-[#64748B] focus:outline-none focus:border-[#2C3347] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TaskItemStatus | '')
              setPage(1)
            }}
            className="bg-[#11131C] border border-[#1E2332] rounded-lg px-2.5 py-1 text-xs text-[#F4F4F5] focus:outline-none focus:border-[#2C3347]"
          >
            <option value="">Todos os status</option>
            <option value="Pending">Pendente</option>
            <option value="InProgress">Em Andamento</option>
            <option value="Completed">Concluída</option>
            <option value="Cancelled">Cancelada</option>
          </select>

          {/* Prioridade */}
          <div className="flex items-center bg-[#11131C] border border-[#1E2332] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                priorityFilter === ''
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('Urgent')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                priorityFilter === 'Urgent'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Urgente
            </button>
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('High')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                priorityFilter === 'High'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Alta
            </button>
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('Medium')
                setPage(1)
              }}
              className={`px-2 py-1 rounded-md transition-colors ${
                priorityFilter === 'Medium'
                  ? 'bg-[#1D68F2] text-white font-medium'
                  : 'text-[#8E9CAE] hover:text-[#F4F4F5]'
              }`}
            >
              Média
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Carregando tarefas da operação..." />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar tarefas"
          message="Não foi possível obter as tarefas."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-[#38BDF8]" />}
          title={search ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa cadastrada ainda'}
          description={
            search
              ? 'Nenhuma tarefa corresponde aos filtros aplicados.'
              : 'Organize suas entregas vinculando tarefas a contratos e clientes.'
          }
          actionLabel="Criar Primeira Tarefa"
          onAction={handleOpenCreate}
        />
      ) : viewMode === 'board' ? (
        /* VISUALIZAÇÃO KANBAN */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Coluna 1: Pendentes */}
          <div className="bg-[#0B0D14] border border-[#1E2332] rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2332]/60">
              <div className="flex items-center gap-2">
                <Circle className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="text-xs font-bold text-[#F4F4F5]">Pendente</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161A26] text-[#8E9CAE]">
                {filterByStatusGroup('Pending').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filterByStatusGroup('Pending').map((task) => {
                const dueInfo = getDueDateInfo(task.dueDate)
                return (
                  <Card
                    key={task.id}
                    className="p-3 bg-[#11131C] border-[#1E2332] hover:border-[#2C3347] transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#F4F4F5] leading-snug line-clamp-2">
                        {task.title}
                      </span>
                      {getPriorityBadge(task.priority)}
                    </div>

                    {task.customerName && (
                      <div className="flex items-center gap-1 text-[11px] text-[#8E9CAE] truncate">
                        <Building2 className="w-3 h-3 text-[#38BDF8]" />
                        <span className="truncate">{task.customerName}</span>
                      </div>
                    )}

                    {task.contractTitle && (
                      <div className="text-[10px] text-[#64748B] truncate">
                        {task.contractTitle}
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#1E2332]/60 flex items-center justify-between text-[10px]">
                      {dueInfo ? (
                        <span
                          className={`flex items-center gap-1 font-mono ${
                            dueInfo.isOverdue
                              ? 'text-[#EF4444] font-semibold'
                              : dueInfo.isToday
                              ? 'text-[#F59E0B] font-semibold'
                              : 'text-[#8E9CAE]'
                          }`}
                        >
                          {dueInfo.isOverdue && <AlertTriangle className="w-3 h-3 text-[#EF4444]" />}
                          <Calendar className="w-3 h-3" />
                          {dueInfo.formatted}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">Sem prazo</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(task)}
                          className="p-1 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26]"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: task.id, status: 'InProgress' })
                          }
                          className="p-1 rounded text-[#8E9CAE] hover:text-[#38BDF8] hover:bg-[#161A26]"
                          title="Iniciar tarefa"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Coluna 2: Em Andamento */}
          <div className="bg-[#0B0D14] border border-[#1E2332] rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2332]/60">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-xs font-bold text-[#F4F4F5]">Em Andamento</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161A26] text-[#38BDF8]">
                {filterByStatusGroup('InProgress').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filterByStatusGroup('InProgress').map((task) => {
                const dueInfo = getDueDateInfo(task.dueDate)
                return (
                  <Card
                    key={task.id}
                    className="p-3 bg-[#11131C] border-[#1E2332] hover:border-[#38BDF8]/50 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#F4F4F5] leading-snug line-clamp-2">
                        {task.title}
                      </span>
                      {getPriorityBadge(task.priority)}
                    </div>

                    {task.customerName && (
                      <div className="flex items-center gap-1 text-[11px] text-[#8E9CAE] truncate">
                        <Building2 className="w-3 h-3 text-[#38BDF8]" />
                        <span className="truncate">{task.customerName}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#1E2332]/60 flex items-center justify-between text-[10px]">
                      {dueInfo ? (
                        <span
                          className={`flex items-center gap-1 font-mono ${
                            dueInfo.isOverdue
                              ? 'text-[#EF4444] font-semibold'
                              : 'text-[#8E9CAE]'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {dueInfo.formatted}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">Sem prazo</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(task)}
                          className="p-1 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26]"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateStatusMutation.mutate({ id: task.id, status: 'Completed' })
                          }
                          className="p-1 rounded text-[#8E9CAE] hover:text-[#10B981] hover:bg-[#161A26]"
                          title="Concluir tarefa"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Coluna 3: Concluídas */}
          <div className="bg-[#0B0D14] border border-[#1E2332] rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E2332]/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-xs font-bold text-[#F4F4F5]">Concluídas</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161A26] text-[#10B981]">
                {filterByStatusGroup('Completed').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filterByStatusGroup('Completed').map((task) => (
                <Card
                  key={task.id}
                  className="p-3 bg-[#11131C]/60 border-[#1E2332]/60 hover:border-[#1E2332] transition-all space-y-2 opacity-80 hover:opacity-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-[#94A3B8] line-through leading-snug line-clamp-2">
                      {task.title}
                    </span>
                    <Badge variant="positive" className="text-[9px]">OK</Badge>
                  </div>

                  {task.customerName && (
                    <div className="text-[10px] text-[#64748B] truncate">
                      {task.customerName}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#1E2332]/40 flex items-center justify-between text-[10px]">
                    <span className="text-[#64748B] font-mono">
                      {task.completedAtUtc ? formatDate(task.completedAtUtc) : 'Concluída'}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: task.id, status: 'Pending' })
                      }
                      className="text-[10px] text-[#8E9CAE] hover:text-[#F4F4F5]"
                    >
                      Reabrir
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA */
        <Card className="overflow-hidden border-[#1E2332]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2332] bg-[#0A0C12] text-[#8E9CAE]">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Status
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Tarefa
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Cliente / Contrato
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Prioridade
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px]">
                    Prazo
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px] text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2332]/50">
                {data.items.map((task) => {
                  const dueInfo = getDueDateInfo(task.dueDate)
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-[#12151F] transition-colors cursor-pointer group"
                      onClick={() => handleOpenEdit(task)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const next =
                              task.status === 'Completed'
                                ? 'Pending'
                                : task.status === 'Pending'
                                ? 'InProgress'
                                : 'Completed'
                            updateStatusMutation.mutate({ id: task.id, status: next })
                          }}
                          className="text-[#8E9CAE] hover:text-[#38BDF8]"
                        >
                          {task.status === 'Completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                          ) : task.status === 'InProgress' ? (
                            <PlayCircle className="w-4 h-4 text-[#38BDF8]" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-medium text-[#F4F4F5]">
                        <span className={task.status === 'Completed' ? 'line-through text-[#64748B]' : ''}>
                          {task.title}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#8E9CAE]">
                        <div>{task.customerName || '—'}</div>
                        {task.contractTitle && (
                          <div className="text-[10px] text-[#64748B]">{task.contractTitle}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">{getPriorityBadge(task.priority)}</td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {dueInfo ? (
                          <span className={dueInfo.isOverdue ? 'text-[#EF4444] font-semibold' : 'text-[#8E9CAE]'}>
                            {dueInfo.formatted}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 rounded text-[#8E9CAE] hover:text-[#F4F4F5] hover:bg-[#161A26]"
                            title="Editar tarefa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            className="p-1.5 rounded text-[#8E9CAE] hover:text-[#EF4444] hover:bg-[#EF4444]/15"
                            title="Excluir tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#8E9CAE] pt-2">
          <span>
            Página {data.page} de {data.totalPages} ({data.totalCount} {data.totalCount === 1 ? 'tarefa' : 'tarefas'})
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  )
}
