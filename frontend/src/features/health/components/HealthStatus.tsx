import { useHealth } from '../hooks/useHealth'

/**
 * A single line of status text — the caller wraps it, so this renders a
 * span, not a block element, to stay safe to nest inside whatever text
 * container the caller uses (a `<p>` around a `<p>` is invalid HTML and was
 * exactly the bug here before).
 */
export function HealthStatus() {
  const { status, error, isLoading } = useHealth()

  if (isLoading) return <span>backend: loading…</span>
  if (error) return <span>backend: {error}</span>
  return <span>backend: {status}</span>
}
