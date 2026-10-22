import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'positive' | 'warning' | 'critical' | 'sky'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#131620] text-[#94A3B8] border-[#1E2332]',
    positive: 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/25',
    warning: 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/25',
    critical: 'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/25',
    sky: 'bg-[#0284C7]/15 text-[#38BDF8] border-[#0284C7]/30',
  }

  const dotColors = {
    default: 'bg-[#94A3B8]',
    positive: 'bg-[#10B981]',
    warning: 'bg-[#F59E0B]',
    critical: 'bg-[#EF4444]',
    sky: 'bg-[#38BDF8]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}

