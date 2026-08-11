import { UserMenu } from 'features/auth'
import { HealthStatus } from 'features/health'

export function HomePage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Hob
      </h1>

      <UserMenu />

      <div className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
        <HealthStatus />
      </div>
    </main>
  )
}
