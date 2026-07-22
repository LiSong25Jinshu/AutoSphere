import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — always needed
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // Router
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'router';
          }
          // MUI — large, split from app code
          if (id.includes('node_modules/@mui/')) {
            return 'mui';
          }
          // Other large vendor libs
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
          // Role-based page chunks
          if (id.includes('/pages/admin/')) return 'pages-admin';
          if (id.includes('/pages/dealer/')) return 'pages-dealer';
          if (id.includes('/pages/service-provider/')) return 'pages-service-provider';
          if (id.includes('/pages/user/')) return 'pages-user';
          if (id.includes('/pages/public/')) return 'pages-public';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    testTimeout: 10000,
    hookTimeout: 10000,
  },
}))
