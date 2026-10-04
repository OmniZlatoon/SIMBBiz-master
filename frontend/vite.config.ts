import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import Tailwind

const BACKEND_URL = 'https://subtarsal-kathyrn-untreated.ngrok-free.dev'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(`${BACKEND_URL}/api`)
  },
  plugins: [
    react(),
   tailwindcss(), // 2. Add to plugins
   ],
  server: {
    port: 3000,
    allowedHosts: true,
  }
})
