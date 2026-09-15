import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({ root, base: './', publicDir: 'public', plugins: [react(), VitePWA({
  registerType: 'prompt', injectRegister: 'auto', includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'licenses/*.txt'],
  manifest: { name: 'Kỳ Viên · Cờ Tướng', short_name: 'Kỳ Viên', description: 'Một ván cờ trong khu vườn yên bình.', theme_color: '#315c45', background_color: '#f6f4eb', display: 'standalone', start_url: './', scope: './', icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }, { src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] },
  workbox: { globPatterns: ['**/*.{js,css,html,woff2,webp,svg,png,txt}'], maximumFileSizeToCacheInBytes: 3000000, cleanupOutdatedCaches: true },
})], server: { host: '127.0.0.1', port: 4317, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } }, build: { outDir: '.build', emptyOutDir: true }, cacheDir: '.vite-cache' });
