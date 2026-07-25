import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Listen on all local IP interfaces for mobile/tablet diagnostics
    watch: {
      usePolling: true, // Needed inside docker containers on Windows hosts
    }
  }
})
