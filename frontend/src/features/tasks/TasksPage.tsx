import React from 'react'
import { CheckSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#F1F5F9]">Tarefas & Prazos</h2>
            <Badge variant="sky">Etapa 3</Badge>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Organize o fluxo de entregas, prioridades e acompanhamento das etapas de cada contrato.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Nova Tarefa
        </Button>
      </div>

      <EmptyState
        icon={<CheckSquare className="w-8 h-8 text-[#38BDF8]" />}
        title="Nenhuma tarefa pendente"
        description="Gerencie tarefas com prioridade, prazos e vínculos diretos a serviços e contratos."
        actionLabel="Criar Tarefa (Etapa 3)"
        onAction={() => alert('O gerenciador de tarefas será ativado na Etapa 3.')}
      />
    </div>
  )
}
