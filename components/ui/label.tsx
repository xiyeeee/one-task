'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm font-medium text-neutral-800 select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      data-slot="label"
      {...props}
    />
  )
}

export { Label }
