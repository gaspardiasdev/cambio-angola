/* eslint-disable no-unused-vars */
// vite.config.js - Versão corrigida com proxy para desenvolvimento
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    jsx: 'automatic',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          motion: ['framer-motion']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  server: {
    port: 5173,
    host: true,
    // Configurar proxy para resolver problemas de CORS em desenvolvimento
    proxy: {
      '/api': {
        target: 'https://cambio-angola-backend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        timeout: 30000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url);
            
            // Adicionar headers necessários
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
            
            // Remover headers problemáticos em desenvolvimento
            proxyReq.removeHeader('cache-control');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: []
  },
  preview: {
    port: 4173,
    host: true
  }
});