import React from 'react'
import { cn } from '@/lib/utils'

export interface LogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showBadge?: boolean
  badgeText?: string
  subtitle?: string
  animateGlow?: boolean
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = 'md',
  showText = true,
  showBadge = false,
  badgeText = 'MVP',
  subtitle,
  animateGlow = false,
}) => {
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  }

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none group', className)}>
      {/* Ícone com renderização nítida */}
      <div className="relative shrink-0 flex items-center justify-center">
        {animateGlow && (
          <div className="absolute inset-0 rounded-full bg-[#38BDF8]/20 blur-md pointer-events-none -z-10" />
        )}
        <img
          src="/logo.png"
          alt="ServiCore Logo"
          className={cn(
            'relative object-contain transition-transform duration-150 group-hover:scale-102',
            iconSizes[size]
          )}
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={cn('font-bold tracking-tight text-[#F8FAFC]', textSizes[size])}>
              Servi
              <span className="bg-gradient-to-r from-[#38BDF8] via-[#00D2FF] to-[#2563EB] bg-clip-text text-transparent font-extrabold">
                Core
              </span>
            </span>

            {showBadge && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#152442] text-[#38BDF8] border border-[#1E3A66] shadow-xs">
                {badgeText}
              </span>
            )}
          </div>

          {subtitle && (
            <span className="text-[10px] text-[#64748B] font-medium tracking-wide">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
