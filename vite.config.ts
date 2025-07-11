import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 6252,
    proxy: {
      '/api': {
        target: 'http://localhost:6252', // or your backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
   preview: {
    host: true,
    port: 4173,
    allowedHosts: ['fabraco.sharda.co.in'],
  },
})
