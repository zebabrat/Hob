import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence: a render error anywhere below leaves a blank white page
 * otherwise, with nothing to tell the user what happened or how to recover.
 *
 * A class is not a style choice — React exposes error boundaries only through
 * componentDidCatch, which has no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack)
  }

  override render(): ReactNode {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            The page could not be displayed. Reloading usually helps.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
