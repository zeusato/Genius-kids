import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyProgress } from '../pwa/download';
import { PWA_CHANNEL, type WorkerStatus } from '../pwa/protocol';

class FakeChannel {
    port1 = { onmessage: undefined as ((event: { data: unknown }) => void) | undefined, close() {} };
    port2 = { postMessage: (data: unknown) => queueMicrotask(() => this.port1.onmessage?.({ data })) };
}
class FakeWorker extends EventTarget {
    state: ServiceWorkerState = 'activated';
    message: WorkerStatus = {
        channel: PWA_CHANNEL, version: 'v1',
        core: { phase: 'complete', progress: { completed: 3, total: 3, bytes: 30, totalBytes: 30 } },
        offline: { phase: 'paused', progress: emptyProgress() },
    };
    postMessage = vi.fn((data: { type: string }, ports?: { postMessage: (data: WorkerStatus) => void }[]) => {
        if (data.type === 'STATUS') ports?.[0].postMessage(this.message);
    });
    change(state: ServiceWorkerState) { this.state = state; this.dispatchEvent(new Event('statechange')); }
}
let registration: EventTarget & {
    scope: string; active: FakeWorker; waiting: FakeWorker | null; installing: FakeWorker | null; update: ReturnType<typeof vi.fn>;
};
let serviceWorkers: EventTarget & { getRegistration: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn>; controller: FakeWorker | null };
let windowMock: EventTarget & { location: { origin: string; reload: ReturnType<typeof vi.fn> }; setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout; setInterval: typeof setInterval };
let fetchMock: ReturnType<typeof vi.fn>;
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('DEV', false);
    vi.stubEnv('BASE_URL', '/Genius-kids/');
    vi.stubGlobal('__APP_VERSION__', 'v1');
    registration = Object.assign(new EventTarget(), { scope: 'https://example.test/Genius-kids/', active: new FakeWorker(), waiting: null, installing: null, update: vi.fn(async () => {}) });
    serviceWorkers = Object.assign(new EventTarget(), { getRegistration: vi.fn(async () => registration), register: vi.fn(), controller: registration.active });
    windowMock = Object.assign(new EventTarget(), { location: { origin: 'https://example.test', reload: vi.fn() }, setTimeout, clearTimeout, setInterval });
    vi.stubGlobal('window', windowMock);
    vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' }));
    vi.stubGlobal('navigator', { serviceWorker: serviceWorkers, onLine: true });
    vi.stubGlobal('MessageChannel', FakeChannel);
    vi.stubGlobal('sessionStorage', { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn() });
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: 'v2', builtAt: '2026-09-15', coreBytes: 30, offlineBytes: 100 })));
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('manual PWA updates', () => {
    it('checks lightweight metadata without triggering asset installation; initialization is idempotent', async () => {
        const service = await import('./updateService');
        await Promise.all([service.initUpdateService(), service.initUpdateService()]);
        await service.checkForUpdates();
        expect(serviceWorkers.getRegistration).toHaveBeenCalledTimes(1);
        expect(serviceWorkers.register).not.toHaveBeenCalled();
        expect(registration.update).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/Genius-kids/version.json?t='), expect.objectContaining({ cache: 'no-store' }));
        expect(service.getUpdateState().phase).toBe('available');
    });
    it('does not mark the app current after a failed version check', async () => {
        fetchMock.mockRejectedValue(new TypeError('Network failed'));
        const service = await import('./updateService');
        await service.checkForUpdates();
        expect(service.getUpdateState()).toMatchObject({ phase: 'error', error: expect.stringContaining('kiểm tra mạng') });
    });
    it('starts checking the worker when the user downloads and waits for installed state', async () => {
        const service = await import('./updateService');
        await service.checkForUpdates();
        const installing = new FakeWorker();
        installing.state = 'installing';
        installing.message.version = 'v2';
        registration.update.mockImplementation(async () => {
            registration.installing = installing;
            registration.dispatchEvent(new Event('updatefound'));
        });
        await service.downloadUpdate();
        expect(registration.update).toHaveBeenCalledTimes(1);
        expect(service.getUpdateState().phase).toBe('downloading');
        const message = Object.assign(new Event('message'), { source: installing, data: installing.message });
        serviceWorkers.dispatchEvent(message);
        expect(service.getUpdateState().phase).toBe('downloading'); // Even if all cache writes completed.
        registration.installing = null;
        registration.waiting = installing;
        installing.change('installed');
        await flush();
        expect(service.getUpdateState().phase).toBe('ready');
        expect(windowMock.location.reload).not.toHaveBeenCalled();
    });
    it('keeps the current worker and reports a failed installation', async () => {
        const service = await import('./updateService');
        await service.checkForUpdates();
        const worker = new FakeWorker();
        worker.state = 'installing';
        registration.installing = worker;
        registration.dispatchEvent(new Event('updatefound'));
        worker.change('redundant');
        expect(service.getUpdateState().phase).toBe('error');
        expect(windowMock.location.reload).not.toHaveBeenCalled();
    });
    it('only reloads and records success after the expected worker takes control', async () => {
        const service = await import('./updateService');
        await service.checkForUpdates();
        const waiting = new FakeWorker();
        waiting.message.version = 'v2';
        waiting.state = 'installed';
        registration.waiting = waiting;
        await service.applyUpdate();
        expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
        expect(windowMock.location.reload).not.toHaveBeenCalled();
        registration.active = waiting;
        registration.waiting = null;
        waiting.state = 'activated';
        serviceWorkers.controller = waiting;
        serviceWorkers.dispatchEvent(new Event('controllerchange'));
        await flush();
        expect(sessionStorage.setItem).toHaveBeenCalledWith('update-success-version', 'v2');
        expect(windowMock.location.reload).toHaveBeenCalledTimes(1);
    });
    it('does not force reload when activation times out', async () => {
        const service = await import('./updateService');
        await service.checkForUpdates();
        registration.waiting = new FakeWorker();
        registration.waiting.message.version = 'v2';
        await service.applyUpdate();
        await vi.advanceTimersByTimeAsync(20_001);
        expect(service.getUpdateState().phase).toBe('error');
        expect(windowMock.location.reload).not.toHaveBeenCalled();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });
    it('ignores an old active worker status while a newer worker is downloading', async () => {
        const service = await import('./updateService');
        await service.checkForUpdates();
        const installing = new FakeWorker();
        installing.state = 'installing';
        registration.installing = installing;
        registration.dispatchEvent(new Event('updatefound'));
        serviceWorkers.dispatchEvent(Object.assign(new Event('message'), { source: registration.active, data: registration.active.message }));
        expect(service.getUpdateState().phase).toBe('downloading');
    });
    it('refuses to apply a stale waiting release', async () => {
        const service = await import('./updateService');
        await service.checkForUpdates();
        registration.waiting = new FakeWorker();
        registration.waiting.message.version = 'v0';
        await service.applyUpdate();
        expect(service.getUpdateState().phase).toBe('error');
        expect(registration.waiting.postMessage).not.toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    });
    it('leaves downloading with a retryable error if the CDN installs an older release than advertised', async () => {
        const service = await import('./updateService');
        await service.checkForUpdates();
        const stale = new FakeWorker();
        stale.state = 'installing';
        registration.installing = stale;
        registration.dispatchEvent(new Event('updatefound'));
        registration.installing = null;
        registration.waiting = stale;
        stale.change('installed');
        await flush();
        expect(service.getUpdateState()).toMatchObject({ phase: 'error', error: expect.stringContaining('chưa đồng bộ') });
    });
});
