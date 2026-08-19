import { Link } from 'react-router'
import { HealthStatus } from 'features/health'
import { Button } from 'shared/components/ui/button'

export function HomePage() {
  return (
    <div className="flex flex-col items-start gap-6">
      <div>
        <h1 className="text-4xl tracking-[-0.02em] text-foreground">Welcome back</h1>
        <p className="mt-2 text-text-secondary">Keep track of where every application stands.</p>
      </div>

      {/*
       * Base UI's polymorphism is a render prop, not Radix's asChild.
       * nativeButton=false: rendering an <a> through `render` without it
       * trips Base UI's "expected a native <button>" warning, since the
       * default assumes render replaces the button with another button-like
       * element rather than a link.
       */}
      <Button render={<Link to="/board">Go to board</Link>} nativeButton={false} />

      <p className="font-mono text-xs tracking-[0.06em] text-text-secondary uppercase">
        <HealthStatus />
      </p>
    </div>
  )
}
