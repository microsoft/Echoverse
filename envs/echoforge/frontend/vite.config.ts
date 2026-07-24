import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: parseInt(process.env.VITE_PORT || '5173', 10),
    proxy: {
      '/api': `http://localhost:${process.env.VITE_API_PORT || '8000'}`,
    },
  },
});
