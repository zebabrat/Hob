import { Avatar, AvatarFallback } from 'shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'shared/components/ui/dropdown-menu'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useSignOut } from '../hooks/useSignOut'

function initialOf(user: { name: string | null; email: string }): string {
  return (user.name ?? user.email).charAt(0).toUpperCase()
}

/**
 * Compact by design — this sits in the header, next to the nav pills, not
 * on its own. The full email/name pairing the old card-style menu showed up
 * front now lives inside the dropdown, one click away.
 */
export function UserMenu() {
  const { user } = useCurrentUser()
  const { submit, isSubmitting } = useSignOut()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="size-7">
          <AvatarFallback>{initialOf(user)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <p className="font-medium text-foreground">{user.name ?? user.email}</p>
          {user.name && <p className="font-normal text-muted-foreground">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isSubmitting} onClick={() => void submit()}>
          {isSubmitting ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
