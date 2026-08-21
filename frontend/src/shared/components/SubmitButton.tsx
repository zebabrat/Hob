import { Button } from './ui/button'

interface SubmitButtonProps {
  children: string
  pendingLabel: string
  isSubmitting: boolean
  /** An extra gate beyond "already submitting" — e.g. sign-up's password not yet at the minimum strength. */
  disabled?: boolean
}

export function SubmitButton({ children, pendingLabel, isSubmitting, disabled }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isSubmitting || disabled} className="w-full">
      {isSubmitting ? pendingLabel : children}
    </Button>
  )
}
