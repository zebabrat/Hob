import { useCurrentUser } from '../hooks/useCurrentUser'
import { useSignOut } from '../hooks/useSignOut'

export function UserMenu() {
  const { user } = useCurrentUser()
  const { submit, isSubmitting } = useSignOut()

  if (!user) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-50">
          Привет, {user.email}
        </p>
        {user.name && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.name}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => void submit()}
        disabled={isSubmitting}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        {isSubmitting ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
