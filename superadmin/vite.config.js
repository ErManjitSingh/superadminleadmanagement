import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { appVersionPlugin } from '../deploy/vite-app-version-plugin.js';

export default defineConfig({
  plugins: [react(), appVersionPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
});
