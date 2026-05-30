import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { ErrorBoundary } from './components/ErrorBoundary'
import { emitLifecycle } from './lib/attribution'
import App from './App.tsx'
import './index.css'

// vite-plugin-pwa: SW auto-registered via injectRegister in vite.config.ts.
// No manual registration needed here — keep this comment for future devs.

// One 'landed' lifecycle event per tab session (dormant until VITE_ATTRIBUTION_ENABLED).
try {
  if (!sessionStorage.getItem('onalert_landed')) {
    sessionStorage.setItem('onalert_landed', '1')
    emitLifecycle('landed')
  }
} catch { /* attribution must never break boot */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)