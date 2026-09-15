/// <reference lib="webworker" />
import { PrecacheController, PrecacheRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { downloadAssets, emptyProgress, inspectDownload, isCoreAsset, type AssetEntry } from './download';
import { PWA_CHANNEL, type DownloadState, type WorkerCommand, type WorkerStatus } from './protocol';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: AssetEntry[] };
const manifest = self.__WB_MANIFEST as AssetEntry[];
// Vite may append the web manifest/icon again without our size and integrity.
const entries = manifest.filter((entry, index) => manifest.findIndex(candidate => candidate.url === entry.url) === index);
const coreEntries = entries.filter(isCoreAsset);
const controller = new PrecacheController();
controller.addToCacheList(entries);
const cacheKey = (entry: AssetEntry) => controller.getCacheKeyForURL(entry.url)!;
const openCache = () => caches.open(controller.strategy.cacheName);
let core: DownloadState = { phase: 'idle', progress: emptyProgress() };
let offline: DownloadState = { phase: 'idle', progress: emptyProgress() };
let offlineJob: Promise<void> | undefined;
let offlineAbort: AbortController | undefined;

const status = (): WorkerStatus => ({ channel: PWA_CHANNEL, version: __APP_VERSION__, core, offline });
async function broadcast() {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
        if (client.url.startsWith(self.registration.scope)) client.postMessage(status());
    }
}
const errorText = (error: unknown) => error instanceof DOMException && error.name === 'QuotaExceededError'
    ? 'Thiết bị không đủ dung lượng. Hãy giải phóng bộ nhớ rồi tải tiếp.'
    : error instanceof Error ? error.message : 'Tải chưa thành công. Hãy kiểm tra mạng và thử lại.';

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        core = { phase: 'downloading', progress: emptyProgress() };
        try {
            const progress = await downloadAssets({
                entries: coreEntries, cache: await openCache(), cacheKey, baseURL: self.registration.scope,
                onProgress: progress => { core = { phase: 'downloading', progress }; void broadcast(); },
            });
            core = { phase: 'complete', progress };
            await broadcast();
        } catch (error) {
            core = { ...core, phase: 'error', error: errorText(error) };
            await broadcast();
            throw error; // Keep the previous worker active if any required file failed.
        }
    })());
});

// The previous cache stays intact throughout download. Only a successfully
// installed release may prune obsolete revisions, using Workbox's normal lifecycle.
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        await controller.activate(event);
        await self.clients.claim();
    })());
});

async function refreshStatus() {
    const cache = await openCache();
    if (core.phase !== 'downloading') {
        const { missing, progress } = await inspectDownload({ entries: coreEntries, cache, cacheKey });
        core = { phase: missing.length ? 'idle' : 'complete', progress };
    }
    if (!offlineJob) {
        const { missing, progress } = await inspectDownload({ entries, cache, cacheKey });
        offline = { phase: missing.length ? (progress.completed ? 'paused' : 'idle') : 'complete', progress };
    }
}

async function downloadOffline() {
    offlineAbort = new AbortController();
    offline = { phase: 'downloading', progress: emptyProgress() };
    try {
        const progress = await downloadAssets({
            entries, cache: await openCache(), cacheKey, baseURL: self.registration.scope,
            signal: offlineAbort.signal,
            onProgress: progress => { offline = { phase: 'downloading', progress }; void broadcast(); },
        });
        offline = { phase: 'complete', progress };
    } catch (error) {
        offline = { ...offline, phase: offlineAbort.signal.aborted ? 'paused' : 'error', error: errorText(error) };
    } finally {
        offlineJob = undefined;
        offlineAbort = undefined;
        await broadcast();
    }
}

self.addEventListener('message', event => {
    const command = event.data?.type as WorkerCommand;
    // Accept the standard Workbox message so users of the previous release can migrate.
    if (command === 'SKIP_WAITING') {
        event.waitUntil((async () => {
            await refreshStatus();
            if (core.phase === 'complete') await self.skipWaiting();
        })());
        return;
    }
    if (event.data?.channel !== PWA_CHANNEL) return;
    if (command === 'PAUSE_OFFLINE') offlineAbort?.abort();
    if (command === 'DOWNLOAD_OFFLINE' && !offlineJob) offlineJob = downloadOffline();
    event.waitUntil((async () => {
        if (command === 'STATUS') await refreshStatus();
        event.ports[0]?.postMessage(status());
        if (offlineJob) await offlineJob;
    })());
});

registerRoute(new PrecacheRoute(controller));
registerRoute(new NavigationRoute(controller.createHandlerBoundToURL(new URL('index.html', self.registration.scope).href), {
    denylist: [/\/api\//, /\/version\.json$/],
}));
// Optional assets are in the revisioned manifest and cached on first use by
// PrecacheRoute; their integrity prevents caching a file from a different release.
registerRoute(({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'google-fonts-cache',
        plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 31536000 })],
    }));
