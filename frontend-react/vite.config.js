import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

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
  ],
  build: {
    sourcemap: true, // Optional: generate sourcemaps for production
  }
});
