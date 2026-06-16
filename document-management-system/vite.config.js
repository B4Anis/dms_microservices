import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      ignored: ['**/db.json', '**/test-results/**', '**/playwright-report/**']
    },
    proxy: {
      // Auth endpoints → API Gateway (8080) → auth-service (8083)
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Documents microservice → API Gateway (8080) → documents-service (8082)
      '/api/documents': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Comments microservice → API Gateway (8080) → comments-service (8081)
      '/api/comments': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Everything else (users, categories, departments) → json-server :3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
