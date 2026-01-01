import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    watch: {
      usePolling: false,
    },
  },
  // Reduce log level to minimize console noise
  logLevel: 'warn',
  // Better error handling for HMR
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
