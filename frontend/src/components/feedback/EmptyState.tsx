import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#1A2A47] bg-[#0C1424]/60 max-w-lg mx-auto my-6 backdrop-blur-xs">
      <div className="p-4 rounded-full bg-[#131E35] text-[#38BDF8] mb-4 border border-[#1A2A47] shadow-xs">
        {icon || <Inbox className="w-8 h-8 text-[#38BDF8]" />}
      </div>
      <h4 className="text-base font-semibold text-[#F8FAFC] mb-1.5">{title}</h4>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
