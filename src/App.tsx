import { Outlet } from 'react-router-dom'
import { StrictMode } from 'react'
import type { RouteRecord } from 'vite-react-ssg'
import { ErrorBoundary } from './components/ErrorBoundary'
// Public/prerendered routes are imported eagerly — they render at build time and
// must be in the SSG bundle. The AppLayout shell is also eager because /app is
// prerendered as the loading shell (clean hydration).
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
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

// The authenticated /app pages are NOT prerendered and only ever load after
// sign-in, so lazy-import them. This code-splits the heavy app surface out of
// the main bundle every public/SEO visitor downloads. Each `lazy` returns the
// route's Component (pages export named components, so map them to `Component`).
const lazyComponent = (
  loader: () => Promise<Record<string, React.ComponentType>>,
  name: string,
) => async () => {
  const mod = await loader()
  return { Component: mod[name] }
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
        getStaticPaths: () => TOP_LOCATIONS.map((l) => `locations/${l.id}`),
      },
      { path: 'guide', Component: GuidePage },
      { path: 'wait-times', Component: WaitTimesPage },
      {
        path: 'app',
        Component: AppLayout,
        children: [
          { index: true, lazy: lazyComponent(() => import('./pages/DashboardPage'), 'DashboardPage') },
          { path: 'alerts', lazy: lazyComponent(() => import('./pages/AlertsPage'), 'AlertsPage') },
          { path: 'alerts/:id', lazy: lazyComponent(() => import('./pages/AlertDetailPage'), 'AlertDetailPage') },
          { path: 'add', lazy: lazyComponent(() => import('./pages/AddMonitorPage'), 'AddMonitorPage') },
          { path: 'settings', lazy: lazyComponent(() => import('./pages/SettingsPage'), 'SettingsPage') },
          { path: 'interview-prep', lazy: lazyComponent(() => import('./pages/InterviewPrepPage'), 'InterviewPrepPage') },
          { path: 'organization', lazy: lazyComponent(() => import('./pages/OrganizationPage'), 'OrganizationPage') },
          { path: 'admin/audit', lazy: lazyComponent(() => import('./pages/AdminAuditPage'), 'AdminAuditPage') },
          // 404 inside the app shell — keeps sidebar/bottom nav for signed-in users.
          { path: '*', Component: NotFoundPage },
        ],
      },
      // Static /404 so vite-react-ssg emits 404.html (Vercel serves it with a real
      // 404 status for unmatched URLs — no more soft-200 catch-all).
      { path: '404', Component: NotFoundPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
