import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
// Pulls in vite-react-ssg's `declare module 'vite'` augmentation so `ssgOptions`
// is a recognized key on the Vite config below.
import type { ViteReactSSGOptions } from "vite-react-ssg";

// Public routes prerendered to static HTML by vite-react-ssg (build: `vite-react-ssg
// build`). Dev stays plain CSR (`vite`). The allowlist below is the single source of
// truth for which paths become real HTML files:
//   - every public marketing/SEO page,
//   - every location detail page (expanded from getStaticPaths in src/App.tsx), and
//   - `/app` once, as the auth loading shell (the SPA fallback target — see vercel.json).
// The private /app/* children are NOT prerendered; they are served the /app shell and
// resolve client-side after auth. `/404` is emitted so Vercel serves a real 404.
const PRERENDER_ALLOWLIST = new Set([
  "/",
  "/auth",
  "/auth/reset",
  "/privacy",
  "/terms",
  "/locations",
  "/guide",
  "/wait-times",
  "/app",
  "/404",
]);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest: ship our own SW (src/sw.ts) so Web Push `push` +
      // `notificationclick` handlers exist. Workbox still precaches the build
      // manifest inside that SW (see precacheAndRoute(self.__WB_MANIFEST)).
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["brand/favicon-32.png", "brand/favicon-16.png", "brand/apple-touch-icon.png", "brand/icon-192.png", "brand/icon-512.png"],
      manifest: {
        name: "OnAlert",
        short_name: "OnAlert",
        description: "Stop checking. Start knowing. Real-time alerts the instant a Global Entry, NEXUS, or SENTRI interview slot opens, with a one-tap deep link into the CBP scheduler.",
        theme_color: "#0A0A0A",
        background_color: "#0A0A0A",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/brand/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/brand/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  ssgOptions: {
    // Prerender exactly the allowlisted paths plus every /locations/:id. vite-react-ssg
    // discovers route paths WITHOUT a leading slash (e.g. "auth", "locations/5140")
    // except the index "/", so normalize to a leading-slash form before matching.
    // The framework's own DefaultIncludedRoutes runs after this and strips any path
    // still containing ":" or "*" (the dynamic template + the /app/* catch-all).
    includedRoutes(paths: string[]): string[] {
      return paths.filter((p: string) => {
        const norm = p === "/" ? "/" : `/${p.replace(/^\//, "")}`;
        return PRERENDER_ALLOWLIST.has(norm) || norm.startsWith("/locations/");
      });
    },
  } satisfies ViteReactSSGOptions,
});
