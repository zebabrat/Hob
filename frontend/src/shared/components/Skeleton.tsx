import { cn } from 'shared/lib/utils'

/** One shimmering placeholder block — see the .skeleton keyframe in app/index.css. Compose these into the shape of the content being loaded. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}
