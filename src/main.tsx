import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import { emitLifecycle } from './lib/attribution'
import './index.css'

// vite-react-ssg owns the root: it server-renders each route to static HTML at build
// time and hydrates on the client. It supplies StrictMode-free RouterProvider +
// HelmetProvider internally, so this entry only exports `createRoot` and runs the
// client-only boot side-effects inside the setup callback (guarded by isClient).
//
// vite-plugin-pwa registers the service worker via injectRegister:'auto' (see
// vite.config.ts) — no manual registration needed here.
export const createRoot = ViteReactSSG({ routes }, ({ isClient }) => {
  if (!isClient) return

  // One 'landed' lifecycle event per tab session (dormant until VITE_ATTRIBUTION_ENABLED).
  try {
    if (!sessionStorage.getItem('onalert_landed')) {
      sessionStorage.setItem('onalert_landed', '1')
      emitLifecycle('landed')
    }
  } catch {
    /* attribution must never break boot */
  }
})
