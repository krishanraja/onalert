/// <reference lib="webworker" />
// Custom OnAlert service worker (vite-plugin-pwa `injectManifest` strategy).
//
// Why custom: the default `generateSW` only precaches the app shell — it has no
// `push` or `notificationclick` handlers, so Web Push alerts could never be
// displayed or deep-linked. This SW keeps Workbox precaching (so offline/app-
// shell behaviour is unchanged) and adds the two Web Push handlers OnAlert needs:
// show the notification, and on tap focus an existing tab or open the deep link.
//
// The matching server side (send-push) signs a VAPID JWT and encrypts the
// payload; here we just receive, display, and route the click.
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope & {
  // Injected by vite-plugin-pwa at build time (injectManifest).
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// Precache the build manifest, then take control ASAP (autoUpdate behaviour).
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
self.skipWaiting()
clientsClaim()

interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

// A push arrived. The payload is JSON ({title, body, url}) produced by the
// send-push edge function. Be defensive: malformed/empty payloads still show a
// sensible default rather than throwing (which would drop the notification).
self.addEventListener('push', (event: PushEvent) => {
  let data: PushPayload = {}
  try {
    data = event.data ? (event.data.json() as PushPayload) : {}
  } catch {
    // Non-JSON payload — fall back to the raw text as the body.
    data = { body: event.data?.text() }
  }

  const title = data.title || 'OnAlert'
  const url = data.url || '/app'
  const options: NotificationOptions = {
    body: data.body || 'An appointment slot just opened.',
    icon: '/brand/icon-192.png',
    badge: '/brand/icon-192.png',
    // Group same-location alerts so a burst of slots does not spam the tray.
    tag: data.tag || 'onalert-slot',
    renotify: true,
    requireInteraction: true,
    // Carry the deep link through to the click handler.
    data: { url },
  } as NotificationOptions

  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification tapped: focus an already-open OnAlert tab (and navigate it to the
// deep link) or open a new window. Honours the per-alert `url` from the payload.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()

  const targetUrl = (event.notification.data?.url as string | undefined) || '/app'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      // Prefer focusing an existing tab on our origin, then route it.
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url)
          if (clientUrl.origin === self.location.origin) {
            await client.focus()
            if ('navigate' in client && typeof client.navigate === 'function') {
              await client.navigate(targetUrl).catch(() => {})
            }
            return
          }
        } catch {
          // Ignore unparsable client URLs and keep looking.
        }
      }

      // No existing tab — open a fresh one at the deep link.
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl)
      }
    })(),
  )
})
