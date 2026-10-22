import React from 'react'
import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#F1F5F9]">Relatórios & Indicadores</h2>
            <Badge variant="sky">Etapa 5</Badge>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Métricas de desempenho financeiro, rentabilidade por contrato e cliente.
          </p>
        </div>
      </div>

      <EmptyState
        icon={<BarChart3 className="w-8 h-8 text-[#38BDF8]" />}
        title="Relatórios consolidados"
        description="Métricas consolidadas de faturamento, rentabilidade e carga de trabalho serão ativadas no fechamento do produto."
      />
    </div>
  )
}
