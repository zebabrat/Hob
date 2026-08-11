import { useHealth } from '../hooks/useHealth'

export function HealthStatus() {
  const { status, error, isLoading } = useHealth()

  if (isLoading) return <p>backend: loading…</p>
  if (error) return <p>backend: {error}</p>
  return <p>backend: {status}</p>
}
