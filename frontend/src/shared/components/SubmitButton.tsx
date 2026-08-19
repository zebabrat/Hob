import { Button } from './ui/button'

interface SubmitButtonProps {
  children: string
  pendingLabel: string
  isSubmitting: boolean
}

export function SubmitButton({ children, pendingLabel, isSubmitting }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? pendingLabel : children}
    </Button>
  )
}
