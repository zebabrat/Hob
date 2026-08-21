import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "shared/lib/utils"

function Input({ className, type, placeholder, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      // A single space, not undefined, when the caller gives no placeholder:
      // :placeholder-shown only exists at all when a placeholder attribute is
      // present, so a field with none (e.g. the sign-in password field) never
      // matches it — not-placeholder-shown then matches *unconditionally*,
      // permanently darkening its underline whether or not it has a value
      // (found by hand: password looked "filled" from page load, while email,
      // which does pass a placeholder, correctly started light). A blank
      // space is invisible but still a real placeholder, so the pseudo-class
      // reads the field's actual empty/filled state everywhere.
      placeholder={placeholder ?? ' '}
      data-slot="input"
      className={cn(
        // Underlined, not boxed — the field baseline is the only border, per
        // the mockup's "подчёркнутые линии" pattern. Inactive/empty sits on
        // the weak line (--input); focus or a real value darkens it to
        // --foreground, same weight throughout so nothing shifts on focus.
        "h-8 w-full min-w-0 border-0 border-b border-input bg-transparent px-0 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-foreground not-placeholder-shown:border-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
