import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/Genius-kids/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react({
        babel: {
          plugins: ['styled-jsx/babel']
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['Logo.png', 'OG.png'],
        manifest: {
          name: 'MathGenius Kids',
          short_name: 'MathGenius',
          description: 'Ứng dụng học toán vui nhộn cho bé',
          theme_color: '#0ea5e9',
          start_url: './',
          scope: './',
          display: 'standalone',
          background_color: '#000000',
          icons: [
            {
              src: 'Logo.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'Logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false,
          type: 'module'
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    assetsInclude: ['**/*.glb'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
