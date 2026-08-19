import * as React from "react"

import { cn } from "shared/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        // Mono, uppercase, tracked — "лейбл над полем — moно 9.5px uppercase"
        // per the mockup. Color is --text-secondary rather than the
        // brief's literal tertiary tier: a field label is real information
        // (it's the only thing naming an empty field), and tertiary
        // (#8b93a0) fails WCAG AA text contrast on every surface — see the
        // notes in index.css. Secondary already clears AA everywhere.
        "flex items-center gap-1.5 font-mono text-[0.625rem] font-medium tracking-[0.08em] text-text-secondary uppercase select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
