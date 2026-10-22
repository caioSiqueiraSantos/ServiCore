import React from 'react'
import { Wallet, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'

export const FinancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#F1F5F9]">Gestão Financeira & Fluxo de Caixa</h2>
            <Badge variant="sky">Etapa 4</Badge>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Controle contas a receber, parcelas, despesas fixas/variáveis e simulação segura de pagamentos.
          </p>
        </div>
        <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
          Novo Lançamento
        </Button>
      </div>

      <EmptyState
        icon={<Wallet className="w-8 h-8 text-[#34D399]" />}
        title="Módulo Financeiro Pronto para a Etapa 4"
        description="Contas a receber, baixas parciais/totais, despesas, fluxo de caixa e o simulador de pagamentos idempotente serão entregues na Etapa 4."
        actionLabel="Simular Lançamento (Etapa 4)"
        onAction={() => alert('O módulo financeiro completo será ativado na Etapa 4.')}
      />
    </div>
  )
}
