import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white border border-gray-200 rounded-lg p-6 shadow-sm', className)}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'
