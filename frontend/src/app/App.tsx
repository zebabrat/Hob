import { AuthProvider } from 'features/auth'
import { ErrorBoundary } from './ErrorBoundary'
import { AppRouter } from './router'

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  )
}
