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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        cleanupOutdatedCaches: true,
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
          }
        ],
      },
    }),
  ],
  build: {
    sourcemap: true, // Optional: generate sourcemaps for production
  }
});
