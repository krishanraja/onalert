import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/locations" element={<LocationsIndexPage />} />
        <Route path="/locations/:locationId" element={<LocationPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/wait-times" element={<WaitTimesPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="alerts/:id" element={<AlertDetailPage />} />
          <Route path="add" element={<AddMonitorPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="interview-prep" element={<InterviewPrepPage />} />
          <Route path="organization" element={<OrganizationPage />} />
          <Route path="admin/audit" element={<AdminAuditPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
