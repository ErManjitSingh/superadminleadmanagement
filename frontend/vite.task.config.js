import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { appVersionPlugin } from '../deploy/vite-app-version-plugin.js';

export default defineConfig({
  root: resolve(process.cwd(), 'task-app'),
  base: process.env.VITE_BASE || '/task/',
  plugins: [react(), appVersionPlugin({ outDir: 'dist-task' })],
  build: {
    outDir: resolve(process.cwd(), 'dist-task'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:5000', ws: true, changeOrigin: true },
    },
  },
});
