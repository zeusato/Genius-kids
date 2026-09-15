import path from 'path';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { isCoreAsset } from './pwa/download';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const builtAt = new Date().toISOString();
  const appVersion = `${builtAt.replace(/[-:TZ.]/g, '')}-${(process.env.GITHUB_SHA || 'local').slice(0, 7)}`;
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
        strategies: 'injectManifest',
        srcDir: 'pwa',
        filename: 'sw.ts',
        registerType: 'prompt',
        // Registration and manual update checks live in services/updateService.ts.
        injectRegister: false,
        includeAssets: [],
        includeManifestIcons: false,
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
        injectManifest: {
          maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webp,jpg,jpeg,json,webmanifest,mp3,ogg,wav,glb,ktx2,wasm}'],
          globIgnores: ['**/version.json', '**/*-preview.html', '**/horse-race/art/concept.webp', '**/404.html'],
          manifestTransforms: [async entries => {
            const manifest = await Promise.all(entries.map(async entry => {
              const content = await readFile(path.resolve('dist', entry.url));
              return { ...entry, byteSize: entry.size, integrity: `sha256-${createHash('sha256').update(content).digest('base64')}` };
            }));
            await writeFile(path.resolve('dist/version.json'), JSON.stringify({
              version: appVersion, builtAt,
              coreBytes: manifest.filter(isCoreAsset).reduce((sum, entry) => sum + entry.byteSize, 0),
              offlineBytes: manifest.reduce((sum, entry) => sum + entry.byteSize, 0),
            }));
            return { manifest, warnings: [] };
          }],
        },
        devOptions: {
          enabled: false,
          type: 'module'
        }
      })
    ],
    define: {
      '__APP_VERSION__': JSON.stringify(appVersion),
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
