import react from '@vitejs/plugin-react';
/* import { visualizer } from 'rollup-plugin-visualizer'; */
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // visualizer({
    //   filename: 'dist/stats.html', // Output file for the bundle analysis
    //   open: true, // Automatically open it in the browser after build
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'], // Ensure offline.html is cached
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html', // Default fallback
        // Custom handler for offline navigation
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation-cache',
              networkTimeoutSeconds: 3, // Optional: timeout for network attempt
              plugins: [
                {
                  handlerDidError: async () => {
                    // Fallback to offline.html if network fails or times out
                    return (await caches.match('/offline.html')) || Response.error();
                  },
                },
              ],
            },
          },
          // Cache API calls
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'), // Adjust if your API path is different
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5, // How long to wait for network before falling back to cache
              cacheableResponse: {
                statuses: [0, 200], // Cache successful responses and opaque responses (for CORS)
              },
              plugins: [
                {
                  handlerDidError: async () => {
                    return Response.error(); // Or just let it fail if no specific offline API response is needed
                  },
                },
              ],
            },
          },
        ],
      },
      manifest: {
        name: 'LASCMMG - Sistema de Gerenciamento de Torneios', // Aligned with public/manifest.json
        short_name: 'LASCMMG',
        description: 'Sistema de gerenciamento de torneios da Liga Acadêmica de Sinuca da CMMG', // Aligned
        theme_color: '#2e9d3a', // Primary green, from public/manifest.json
        background_color: '#1a2a1a', // Dark green body, from public/manifest.json
        display: 'standalone',
        scope: '/',
        start_url: '/', // Explicit root
        orientation: 'portrait',
        categories: ['sports', 'utilities', 'productivity'],
        lang: 'pt-BR',
        icons: [
          {
            src: '/assets/logo-192x192.png', // Corrected path to assets folder
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/assets/logo-512x512.png', // Corrected path to assets folder
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          // Optional: include favicon.ico if desired in manifest icons as well
          // {
          //   "src": "/assets/favicon.ico",
          //   "sizes": "64x64 32x32 24x24 16x16",
          //   "type": "image/x-icon"
          // }
        ],
      },
    }),
  ],
  build: {
    sourcemap: true, // Optional: generate sourcemaps for production
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Your backend server address
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false, // For self-signed certs
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Add current origin to help backend know where the request is coming from
            proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            // Override CORS headers in the response
            proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
            proxyRes.headers['Access-Control-Allow-Credentials'] = true;
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization';
          });
        },
      },
    },
  },
});
