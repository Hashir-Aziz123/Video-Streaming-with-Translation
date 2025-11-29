import * as React from "react"
import { cn } from "../../lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-zinc-800 [&>option]:text-white",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
