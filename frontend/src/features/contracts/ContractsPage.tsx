import React from 'react'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const ContractsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#F1F5F9]">Contratos de Prestação de Serviços</h2>
            <Badge variant="sky">Etapa 3</Badge>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Controle contratos de preço fixo, horas e recorrência vinculados aos seus clientes.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Criar Contrato
        </Button>
      </div>

      <EmptyState
        icon={<FileText className="w-8 h-8 text-[#38BDF8]" />}
        title="Nenhum contrato ativo"
        description="A estruturação de contratos por escopo, valor, modalidade e status será ativada na Etapa 3 — Contratos e Operação."
        actionLabel="Novo Contrato (Etapa 3)"
        onAction={() => alert('O módulo de contratos será ativado na Etapa 3.')}
      />
    </div>
  )
}
