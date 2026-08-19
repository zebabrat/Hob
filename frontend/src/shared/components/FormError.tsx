import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'

export function FormError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    // Alert already sets role="alert" itself.
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertDescription className="text-destructive">{message}</AlertDescription>
    </Alert>
  )
}
