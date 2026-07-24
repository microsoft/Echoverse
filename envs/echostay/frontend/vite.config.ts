import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.VITE_PORT || '5173'),
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.VITE_API_PORT || '8000'}`,
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  },
})
