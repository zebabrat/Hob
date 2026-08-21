import * as React from "react"

import { cn } from "shared/lib/utils"

function Textarea({ className, placeholder, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      // See Input's identical fallback — same not-placeholder-shown pitfall.
      placeholder={placeholder ?? ' '}
      data-slot="textarea"
      className={cn(
        // Same underline treatment as Input — see the notes there.
        "flex field-sizing-content min-h-16 w-full border-0 border-b border-input bg-transparent px-0 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-foreground not-placeholder-shown:border-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
