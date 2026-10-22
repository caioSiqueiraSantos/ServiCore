import React from 'react'
import { Briefcase, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const ServicesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#F1F5F9]">Catálogo de Serviços</h2>
            <Badge variant="sky">Etapa 3</Badge>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Padronize os serviços prestados, valores de referência e horas estimadas de trabalho.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Cadastrar Serviço
        </Button>
      </div>

      <EmptyState
        icon={<Briefcase className="w-8 h-8 text-[#38BDF8]" />}
        title="Nenhum serviço cadastrado"
        description="Vincule serviços padronizados diretamente a contratos e tarefas na Etapa 3."
        actionLabel="Adicionar Serviço (Etapa 3)"
        onAction={() => alert('O catálogo de serviços será ativado na Etapa 3.')}
      />
    </div>
  )
}
