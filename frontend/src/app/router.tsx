import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { HomePage } from 'pages/HomePage'
import { SignInPage } from 'pages/SignInPage'
import { SignUpPage } from 'pages/SignUpPage'
import { RequireAuth, RequireGuest } from './routes/AuthGate'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/sign-in"
          element={
            <RequireGuest>
              <SignInPage />
            </RequireGuest>
          }
        />
        <Route
          path="/sign-up"
          element={
            <RequireGuest>
              <SignUpPage />
            </RequireGuest>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
