import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border-4 border-black bg-white px-4 py-3 text-base font-medium text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-500 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:shadow-[6px_6px_0px_0px_rgba(0,0,255,1)] focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
