import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,   // DB operations can be slow
    hookTimeout: 30000,
    include: ['src/**/*.test.js', 'src/tests/**/*.test.js'],
    sequence: {
      // Run e2e tests sequentially to avoid DB conflicts
      concurrent: false,
    },
  },
});