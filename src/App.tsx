import { Outlet } from 'react-router-dom'
import { StrictMode } from 'react'
import type { RouteRecord } from 'vite-react-ssg'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { AlertsPage } from './pages/AlertsPage'
import { AddMonitorPage } from './pages/AddMonitorPage'
import { AlertDetailPage } from './pages/AlertDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminAuditPage } from './pages/AdminAuditPage'
import { InterviewPrepPage } from './pages/InterviewPrepPage'
import { OrganizationPage } from './pages/OrganizationPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { LocationsIndexPage } from './pages/LocationsIndexPage'
import { LocationPage } from './pages/LocationPage'
import { GuidePage } from './pages/GuidePage'
import { WaitTimesPage } from './pages/WaitTimesPage'
import { AppLayout } from './components/layout/AppLayout'
import NotFoundPage from './pages/NotFoundPage'
import { TOP_LOCATIONS } from './lib/locations'

// Root layout: the single pathless shell every route renders inside. vite-react-ssg
// supplies the HelmetProvider on both server and client, so we only own StrictMode +
// the error boundary here (no router, no HelmetProvider — those are framework-owned).
function RootLayout() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </StrictMode>
  )
}

// Public routes prerender to real HTML at build time (see ssgOptions.includedRoutes in
// vite.config.ts). The /app subtree is gated by AppLayout, which renders a loading shell
// until auth resolves — so at build time it produces only that spinner (no Supabase,
// no realtime), which is exactly what the client first renders → clean hydration.
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, Component: LandingPage },
      { path: 'auth', Component: AuthPage },
      { path: 'auth/reset', Component: ResetPasswordPage },
      { path: 'privacy', Component: PrivacyPage },
      { path: 'terms', Component: TermsPage },
      { path: 'locations', Component: LocationsIndexPage },
      {
        path: 'locations/:locationId',
        Component: LocationPage,
        // Enumerate the location detail pages to prerender (one static HTML each).
        getStaticPaths: () => TOP_LOCATIONS.map((l) => `locations/${l.id}`),
      },
      { path: 'guide', Component: GuidePage },
      { path: 'wait-times', Component: WaitTimesPage },
      {
        path: 'app',
        Component: AppLayout,
        children: [
          { index: true, Component: DashboardPage },
          { path: 'alerts', Component: AlertsPage },
          { path: 'alerts/:id', Component: AlertDetailPage },
          { path: 'add', Component: AddMonitorPage },
          { path: 'settings', Component: SettingsPage },
          { path: 'interview-prep', Component: InterviewPrepPage },
          { path: 'organization', Component: OrganizationPage },
          { path: 'admin/audit', Component: AdminAuditPage },
          // 404 inside the app shell — keeps sidebar/bottom nav for signed-in users.
          { path: '*', Component: NotFoundPage },
        ],
      },
      // Static /404 so vite-react-ssg emits 404.html (Vercel serves it with a real 404
      // status for unmatched URLs — no more soft-200 catch-all).
      { path: '404', Component: NotFoundPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
