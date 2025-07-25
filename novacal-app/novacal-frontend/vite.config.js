import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server : {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Flask backend runs on port 5000
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix if your Flask routes don't have it
      },
    },
  }
})
