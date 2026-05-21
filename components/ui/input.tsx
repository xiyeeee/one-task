import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'flex h-12 w-full rounded-xl border border-neutral-200 bg-white/70 px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:bg-white focus:ring-4 focus:ring-neutral-950/10 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  )
}

export { Input }
