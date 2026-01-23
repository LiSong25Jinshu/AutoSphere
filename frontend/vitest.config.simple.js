import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    setupFiles: [],
  },
});