import React from 'react'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#F1F5F9]">Agenda & Compromissos</h2>
            <Badge variant="sky">Etapa 3</Badge>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Visualizações mensal, semanal e diária integradas a entregas de contratos e tarefas.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Novo Compromisso
        </Button>
      </div>

      <EmptyState
        icon={<CalendarIcon className="w-8 h-8 text-[#38BDF8]" />}
        title="Agenda limpa"
        description="A agenda integrada com visualizações de compromissos, reuniões e entregas de contratos será entregue na Etapa 3."
        actionLabel="Agendar Evento (Etapa 3)"
        onAction={() => alert('A agenda interativa será ativada na Etapa 3.')}
      />
    </div>
  )
}
