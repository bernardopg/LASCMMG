import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html', // Output file for the bundle analysis
      open: true, // Automatically open it in the browser after build
      gzipSize: true,
      brotliSize: true,
    }),
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
                    return (
                      (await caches.match('/offline.html')) || Response.error()
                    );
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
                    // Optional: Provide a fallback response for API errors when offline
                    // return new Response(JSON.stringify({ success: false, message: 'API offline' }), {
                    //   headers: { 'Content-Type': 'application/json' }
                    // });
                    return Response.error(); // Or just let it fail if no specific offline API response is needed
                  },
                },
              ],
            },
          },
        ],
      },
      manifest: {
        name: 'LASCMMG Torneios',
        short_name: 'LASCMMG',
        description: 'Sistema de Gerenciamento de Torneios de Sinuca LASCMMG',
        theme_color: '#1a2a1a', // Cor do tema escuro --body-bg-dark
        background_color: '#ffffff', // Cor de fundo para splash screen
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo192.png', // Caminho relativo à pasta public/
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo512.png', // Caminho relativo à pasta public/
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/logo512.png', // Para máscara de ícone adaptável
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
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
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add current origin to help backend know where the request is coming from
            proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
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
