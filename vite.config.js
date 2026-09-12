import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: { main: resolve(process.cwd(), 'index.html') },
      output: {
        // Deterministic hashed filenames (matches the original build layout)
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[extname]',
        // Reproduce the original 3-chunk split: lesson content and the
        // storage layer change independently of app logic, so they cache
        // separately (and lesson data edits don't invalidate app code).
        manualChunks: {
          lessons: ['src/js/data/lessonData.js'],
          storage: ['src/js/storage/StorageManager.js'],
        },
      },
    },
  },
  plugins: [
    // Service worker is GENERATED from the actual build output — the precache
    // manifest always matches the hashed filenames (fixes the stale sw.js bug
    // where precaching non-existent /css/* and /js/* paths killed installation).
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // manifest.json is maintained by hand in public/
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        // Netlify functions live outside dist/ at deploy time, but keep the SW
        // from ever trying to cache API traffic (Phase 4 adds /api/* routes).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Network-first for anything under /api/ (cloud sync endpoints)
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
