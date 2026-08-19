interface EmptyStateProps {
  message: string
}

/** What every chart shows instead of an empty or misleading plot when it has nothing to draw. */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex h-48 items-center justify-center bg-muted px-6 text-center font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">
      {message}
    </div>
  )
}
