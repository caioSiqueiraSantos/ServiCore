import React from 'react'
import { Card } from './Card'
import { cn, splitCurrencyParts } from '@/lib/utils'

export interface StatCardAction {
  label: string
  onClick: (e: React.MouseEvent) => void
  icon?: React.ReactNode
}

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  variant?: 'default' | 'positive' | 'warning' | 'critical' | 'sky'
  badgeText?: string
  className?: string
  onClick?: () => void
  action?: StatCardAction
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  badgeText,
  className,
  onClick,
  action,
}) => {
  const iconVariants = {
    default: 'text-[#94A3B8] bg-[#131620] border border-[#1E2332]',
    positive: 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20',
    warning: 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20',
    critical: 'text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/25',
    sky: 'text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20',
  }

  const badgeVariants = {
    default: 'bg-[#131620] text-[#94A3B8] border border-[#1E2332]',
    positive: 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/20',
    warning: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/20',
    critical: 'bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/25',
    sky: 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/20',
  }

  const cardBorderVariants = {
    default: 'border-[#1E2332] hover:border-[#2C3347]',
    positive: 'border-[#1E2332] hover:border-[#10B981]/30',
    warning: 'border-[#1E2332] hover:border-[#F59E0B]/30',
    critical: 'border-[#EF4444]/35 bg-[#140D10]/80 hover:border-[#EF4444]/55',
    sky: 'border-[#1E2332] hover:border-[#38BDF8]/30',
  }

  // Decomposição de moeda para tipografia tabular e alinhamento basal perfeito
  const isStringVal = typeof value === 'string'
  const currencyParts = isStringVal ? splitCurrencyParts(value) : null
  const hasCurrencySymbol = Boolean(currencyParts?.symbol)

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 group relative',
        cardBorderVariants[variant],
        onClick && 'cursor-pointer hover:bg-[#12151F]',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#8E9CAE] tracking-wider uppercase">
              {title}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              {hasCurrencySymbol && (
                <span className="text-xs font-medium text-[#717F94] select-none">
                  {currencyParts?.symbol}
                </span>
              )}
              <span className="text-2xl font-bold tracking-tight text-[#F4F4F5] tabular-nums font-mono-numbers">
                {hasCurrencySymbol ? currencyParts?.amount : value}
              </span>
            </div>
          </div>
          <div
            className={cn(
              'w-9 h-9 rounded-lg shrink-0 flex items-center justify-center transition-colors',
              iconVariants[variant]
            )}
          >
            {icon}
          </div>
        </div>

        {/* Metadados inferiores com flex-wrap sem truncamento destrutivo */}
        {(subtitle || badgeText) && (
          <div className="mt-3.5 pt-2.5 border-t border-[#1E2332] flex flex-wrap items-center justify-between gap-1.5 text-xs">
            {badgeText && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight shrink-0',
                  badgeVariants[variant]
                )}
              >
                {badgeText}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] text-[#8E9CAE] font-normal leading-tight">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ação rápida contextual (ex: cobrança via Pix/WhatsApp para valores vencidos) */}
      {action && (
        <div className="mt-3 pt-2 border-t border-dashed border-[#EF4444]/25">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              action.onClick(e)
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#F87171] border border-[#EF4444]/30 text-xs font-medium transition-colors cursor-pointer group-hover:border-[#EF4444]/50"
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        </div>
      )}
    </Card>
  )
}

