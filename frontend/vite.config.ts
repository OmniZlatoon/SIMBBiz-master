import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import Tailwind

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
   tailwindcss(), // 2. Add to plugins
   ],
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts: [ 'subtarsal-kathyrn-untreated.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})