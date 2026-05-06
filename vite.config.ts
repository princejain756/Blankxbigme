import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { createApiMiddleware } from './server/api-handler.mjs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        viteCompression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 1024,
        }),
        viteCompression({
          algorithm: 'gzip',
          ext: '.gz',
          threshold: 1024,
        }),
        {
          name: 'blank-local-api',
          configureServer(server) {
            const handler = createApiMiddleware({
              dataFilePath: path.join(__dirname, 'data', 'orders.json'),
            });
            server.middlewares.use((req, res, next) => {
              if (!req.url?.startsWith('/api/')) {
                next();
                return;
              }

              handler(req, res, next).catch((error) => {
                console.error('API middleware error', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: 'Internal API error' }));
              });
            });
          },
        },
      ],
      build: {
        // Use terser for better minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,    // Remove console.* in production
            drop_debugger: true,
            passes: 2,             // Two compression passes
          },
        },
        // Code split: separate vendor chunks for better caching
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-motion': ['framer-motion'],
              'vendor-lucide': ['lucide-react'],
            },
          },
        },
        // Inline assets smaller than 4KB as base64
        assetsInlineLimit: 4096,
        // Warn on chunks >500KB
        chunkSizeWarningLimit: 500,
        // Enable CSS code splitting
        cssCodeSplit: true,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
