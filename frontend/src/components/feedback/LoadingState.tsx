import React from 'react'

export interface LoadingStateProps {
  message?: string
  fullPage?: boolean
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando dados...',
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1D68F2]/30 to-[#00D2FF]/30 blur-md animate-pulse" />
        <div className="w-16 h-16 rounded-full border-2 border-[#1A2A47] border-t-[#00D2FF] animate-spin" />
        <img
          src="/logo.png"
          alt="ServiCore"
          className="w-8 h-8 object-contain absolute inset-0 m-auto drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] animate-pulse"
        />
      </div>
      <p className="text-sm text-[#94A3B8] font-medium tracking-wide">{message}</p>
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center w-full">
        {content}
      </div>
    )
  }

  return content
}
