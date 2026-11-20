import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// The browser calls /api on its own origin and the dev server forwards it to the backend,
// so the frontend needs no backend URL and no CORS setup.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backendUrl,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
