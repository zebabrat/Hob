import { AuthProvider } from 'features/auth'
import { AppRouter } from './router'

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
