import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { UserMenu } from 'features/auth'
import { ApplicationDetailPage } from 'pages/ApplicationDetailPage'
import { ArchivePage } from 'pages/ArchivePage'
import { BoardPage } from 'pages/BoardPage'
import { SignInPage } from 'pages/SignInPage'
import { SignUpPage } from 'pages/SignUpPage'
import { AppLayout } from 'shared/components/AppLayout'
import { Pending, RequireAuth, RequireGuest } from './routes/AuthGate'

/*
 * The only lazy route: recharts and the whole analytics feature are a
 * meaningful chunk of the bundle that everyone else — signing in, working the
 * board, editing an application — never touches. Loaded as its own chunk, it
 * downloads only when a user actually opens /analytics.
 */
const AnalyticsPage = lazy(() =>
  import('pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })),
)

/**
 * The header/footer shell for every signed-in page. AppLayout itself is
 * feature-agnostic (shared/ cannot import features/auth); UserMenu is wired
 * in here, at the one layer that is allowed to import both.
 */
function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppLayout headerUserSlot={<UserMenu />}>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedLayout />}>
          {/* No standalone home screen — board is where a signed-in user lands. */}
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<Pending />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
        </Route>
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
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
