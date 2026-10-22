import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-[#090A0F] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer'

    const variantStyles = {
      primary:
        'bg-[#1D68F2] hover:bg-[#1858D4] text-white focus:ring-[#38BDF8] font-medium shadow-xs border border-transparent',
      secondary:
        'bg-[#131620] text-[#E2E8F0] border border-[#1E2332] hover:bg-[#181C28] hover:border-[#2C3347] hover:text-white focus:ring-[#38BDF8]',
      outline:
        'border border-[#1E2332] text-[#38BDF8] hover:bg-[#131620] hover:border-[#38BDF8]/50 focus:ring-[#38BDF8]',
      ghost:
        'text-[#94A3B8] hover:text-[#F4F4F5] hover:bg-[#131620] focus:ring-[#38BDF8]',
      danger:
        'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25 hover:bg-[#EF4444]/20 focus:ring-[#EF4444]',
    }

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-xs sm:text-sm px-3.5 py-2 gap-2',
      lg: 'text-sm px-4.5 py-2.5 gap-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

