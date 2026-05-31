// Live browser test of the prerendered build, driven by real headless Chromium.
// Not shipped — lives under _upgrade/. Serves dist/ through a static server that
// mirrors vercel.json (cleanUrls + /app/* -> /app.html rewrite + 404.html) so
// hydration, SPA routing, and the auth gate behave exactly as on Vercel.
//
// Run: NODE_PATH=<global node_modules> node _upgrade/onalert/livetest.mjs
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { createRequire } from 'node:module'
// Playwright is installed globally, not in this repo. createRequire honors
// NODE_PATH (ESM import does not), so resolve the global module through it.
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const DIST = join(process.cwd(), 'dist')
const PORT = 4399
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
}

async function tryFile(p) {
  try { const s = await stat(p); if (s.isFile()) return p } catch { /* nope */ }
  return null
}

// Resolve a request path to a file on disk, mirroring vercel.json semantics.
async function resolve(pathname) {
  if (pathname === '/') return join(DIST, 'index.html')
  // /app and /app/* rewrite to the prerendered SPA shell.
  if (pathname === '/app' || pathname.startsWith('/app/')) return join(DIST, 'app.html')
  const clean = pathname.replace(/\/$/, '')
  // Direct static asset (has an extension).
  if (extname(clean)) {
    const f = await tryFile(join(DIST, clean))
    if (f) return f
  }
  // cleanUrls: /guide -> guide.html ; /locations/5140 -> locations/5140.html
  return (await tryFile(join(DIST, `${clean}.html`)))
    || (await tryFile(join(DIST, clean, 'index.html')))
    || join(DIST, '404.html')
}

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0])
  const file = await resolve(pathname)
  try {
    const body = await readFile(file)
    const is404 = file.endsWith('404.html') && pathname !== '/404'
    res.writeHead(is404 ? 404 : 200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(500); res.end('error')
  }
})

const results = []
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail })
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

await new Promise((r) => server.listen(PORT, r))
const base = `http://localhost:${PORT}`
const browser = await chromium.launch()

// Capture console errors + page errors across the whole run, keyed by URL.
const consoleErrors = []
const pageErrors = []

async function newPage() {
  const page = await browser.newPage()
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${page.url()} :: ${m.text()}`) })
  page.on('pageerror', (e) => pageErrors.push(`${page.url()} :: ${e.message}`))
  return page
}

try {
  // 1. HOMEPAGE — real prerendered content + clean hydration
  const home = await newPage()
  await home.goto(`${base}/`, { waitUntil: 'networkidle' })
  const title = await home.title()
  check('home: <title> is OnAlert', /OnAlert/.test(title), title)
  check('home: hero text present', await home.locator('text=Never miss a Trusted Traveler').count() > 0)
  check('home: JSON-LD SoftwareApplication in DOM',
    (await home.content()).includes('SoftwareApplication'))
  // Explicit hydration proof: vite-react-ssg sets this global only after the
  // client hydrateRoot completes. Waiting on it both proves hydration AND
  // guarantees event handlers are attached before we click.
  const hydrated = await home.waitForFunction(
    () => !!window.__VITE_REACT_SSG_CONTEXT__, null, { timeout: 8000 },
  ).then(() => true).catch(() => false)
  check('home: hydration completed (__VITE_REACT_SSG_CONTEXT__ set)', hydrated)
  // Now a client-routed nav must work (React mounted + router live).
  await home.locator('text=Set up your first monitor').first().click()
  await home.waitForURL('**/auth', { timeout: 5000 }).catch(() => {})
  check('home: client nav to /auth works (React hydrated)', /\/auth$/.test(home.url()), home.url())

  // 2. AUTH page renders
  const auth = await newPage()
  await auth.goto(`${base}/auth`, { waitUntil: 'networkidle' })
  check('auth: sign-in heading present', await auth.locator('text=Sign in to OnAlert').count() > 0)
  check('auth: title set', /Sign in/.test(await auth.title()), await auth.title())

  // 3. LOCATION detail — prerendered SEO + content
  const loc = await newPage()
  await loc.goto(`${base}/locations/5140`, { waitUntil: 'networkidle' })
  check('location 5140: JFK name rendered', await loc.locator('text=JFK').count() > 0)
  check('location 5140: GovernmentOffice JSON-LD', (await loc.content()).includes('GovernmentOffice'))
  check('location 5140: canonical correct',
    (await loc.locator('link[rel="canonical"]').getAttribute('href'))?.endsWith('/locations/5140'))

  // 4. /app deep link — SPA shell hydrates, auth gate redirects to /auth
  //    (preview build has no Supabase env, so supabase===null -> authed=false -> redirect)
  // Check the RAW served shell first (before the client redirect rewrites the DOM):
  // a deep link /app/alerts must serve app.html (the noindex spinner shell).
  const rawApp = await fetch(`${base}/app/alerts`).then((r) => r.text())
  check('app shell: /app/* deep link serves noindex shell HTML',
    rawApp.includes('noindex') && rawApp.includes('data-server-rendered="true"'))
  const app = await newPage()
  await app.goto(`${base}/app/alerts`, { waitUntil: 'networkidle' })
  await app.waitForURL('**/auth', { timeout: 6000 }).catch(() => {})
  check('app: auth gate redirects to /auth', /\/auth/.test(app.url()), app.url())

  // 5. 404
  const nf = await newPage()
  const resp = await nf.goto(`${base}/this-does-not-exist`, { waitUntil: 'networkidle' })
  check('404: HTTP 404 status', resp?.status() === 404, String(resp?.status()))
  check('404: page-not-found content', await nf.locator('text=Page not found').count() > 0)

  // 6. MOBILE 390px — homepage, no horizontal overflow
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } })
  mob.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`mobile :: ${m.text()}`) })
  await mob.goto(`${base}/`, { waitUntil: 'networkidle' })
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  check('mobile 390: no horizontal overflow', overflow <= 1, `overflow=${overflow}px`)
  await mob.screenshot({ path: join(process.cwd(), '_upgrade/onalert/home-mobile.png') })

  // 7. HYDRATION / CONSOLE — the decisive check
  const hydrationErrs = consoleErrors.filter((e) =>
    /hydrat|did not match|server.*client|Minified React error #(418|423|425)/i.test(e))
  check('no hydration mismatch errors', hydrationErrs.length === 0, hydrationErrs.join(' | ') || 'clean')
  // Supabase-null noise is expected in preview (no env); filter it out of the fatal set.
  const fatal = pageErrors.filter((e) => !/supabase/i.test(e))
  check('no uncaught page errors', fatal.length === 0, fatal.join(' | ') || 'clean')
} finally {
  await browser.close()
  server.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n=== ${results.length - failed.length}/${results.length} passed ===`)
if (consoleErrors.length) console.log(`console errors seen (informational):\n  ${consoleErrors.slice(0, 20).join('\n  ')}`)
process.exit(failed.length ? 1 : 0)
