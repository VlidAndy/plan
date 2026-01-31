
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  server: {
    port: 3000,
    proxy: {
      // 将所有 /api 请求代理到 Spring Boot 后端
      '/api': {
        target: 'https://vli-task-manager-api-123.loca.lt',
        changeOrigin: true,
        secure: false,
        headers: {
          'bypass-tunnel-reminder': 'true'
        }
      }
    }
  }
});
