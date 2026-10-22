import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  leftIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full rounded-lg bg-[#131E35] border border-[#1A2A47] px-3.5 py-2 text-sm text-[#F8FAFC] placeholder-[#64748B] transition-all duration-150',
              'focus:outline-none focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF]/50 focus:bg-[#182745]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              error && 'border-[#F87171] focus:border-[#F87171] focus:ring-[#F87171]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-[#F87171]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
