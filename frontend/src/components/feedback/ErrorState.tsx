import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  isRetrying?: boolean
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Não foi possível carregar os dados',
  message = 'Ocorreu uma instabilidade na comunicação com a API do ServiCore.',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-[#F87171]/20 bg-[#0C1424] max-w-md mx-auto my-6">
      <div className="p-3 rounded-full bg-[#F87171]/10 text-[#F87171] mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-[#F8FAFC] mb-1">{title}</h4>
      <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
