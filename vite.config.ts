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
      // Proxy Google Translate TTS cho dev — tránh 403 do Referer/User-Agent.
      {
        name: 'google-tts-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.originalUrl || req.url || '';
            if (!url.startsWith('/api/tts?')) { next(); return; }
            const qs = url.slice('/api/tts'.length); // '?ie=UTF-8&q=...'
            const googleUrl = `https://translate.google.com/translate_tts${qs}`;
            try {
              const resp = await fetch(googleUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              });
              if (!resp.ok) {
                console.warn('[TTS proxy] Google returned', resp.status);
                res.writeHead(resp.status); res.end(); return;
              }
              res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400' });
              const buf = Buffer.from(await resp.arrayBuffer());
              res.end(buf);
            } catch (e) {
              console.error('[TTS proxy] fetch error:', e);
              res.writeHead(502); res.end();
            }
          });
        },
      },
      react({
        babel: {
          plugins: ['styled-jsx/babel']
        }
      }),
      VitePWA({
        registerType: 'prompt',
        // Service worker được đăng ký thủ công qua registerSW() trong services/updateService.ts.
        // injectRegister: false để plugin không tự chèn thêm script đăng ký (tránh đăng ký 2 lần).
        injectRegister: false,
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
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webp}', 'audio/**/*.mp3'],
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
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
