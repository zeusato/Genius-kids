import { emptyProgress, type DownloadProgress } from '../pwa/download';
import { PWA_CHANNEL, type DownloadState, type ReleaseInfo, type WorkerCommand, type WorkerStatus } from '../pwa/protocol';

export const UPDATE_AVAILABLE_EVENT = 'app-update-available';
const UPDATE_SUCCESS_KEY = 'update-success-version';
const BASE = new URL(import.meta.env.BASE_URL, window.location.origin).href;
export type UpdatePhase = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'current' | 'offline' | 'error' | 'applying' | 'unsupported';
export interface UpdateState {
    phase: UpdatePhase;
    currentVersion: string;
    targetVersion?: string;
    release?: ReleaseInfo;
    progress: DownloadProgress;
    error?: string;
    offline: DownloadState;
}
let state: UpdateState = {
    phase: 'idle', currentVersion: __APP_VERSION__, progress: emptyProgress(),
    offline: { phase: 'idle', progress: emptyProgress() },
};
let registration: ServiceWorkerRegistration | undefined;
let initialization: Promise<void> | undefined;
let checking: Promise<void> | undefined;
let downloading: Promise<void> | undefined;
let applyingVersion: string | undefined;
let announcedVersion: string | undefined;
let lastCheck = 0;
const listeners = new Set<() => void>();
const watched = new WeakSet<ServiceWorker>();
export const getUpdateState = () => state;
export const subscribeToUpdates = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};
function setState(patch: Partial<UpdateState>) {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
    if (['available', 'ready'].includes(state.phase) && state.targetVersion && state.targetVersion !== __APP_VERSION__ && announcedVersion !== state.targetVersion) {
        announcedVersion = state.targetVersion;
        window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
    }
}
const errorMessage = (error: unknown) => error instanceof TypeError
    ? 'Không tải được dữ liệu. Hãy kiểm tra mạng hoặc thử lại sau khi máy chủ cập nhật xong.'
    : error instanceof DOMException && error.name === 'AbortError'
        ? 'Máy chủ phản hồi quá chậm. Hãy thử lại.'
        : error instanceof Error ? error.message : 'Không kết nối được máy chủ. Hãy thử lại.';

function askWorker(worker: ServiceWorker, type: WorkerCommand): Promise<WorkerStatus> {
    return new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
            channel.port1.close();
            reject(new Error('Chưa nhận được phản hồi. Hãy thử lại sau vài giây.'));
        }, 8000);
        channel.port1.onmessage = event => {
            window.clearTimeout(timeout);
            channel.port1.close();
            if (event.data?.channel === PWA_CHANNEL) resolve(event.data);
            else reject(new Error('Phiên bản ứng dụng chưa hỗ trợ tải chủ động.'));
        };
        worker.postMessage({ channel: PWA_CHANNEL, type, clientVersion: __APP_VERSION__ }, [channel.port2]);
    });
}

function receiveStatus(message: WorkerStatus, worker: ServiceWorker) {
    if (message.channel !== PWA_CHANNEL || state.phase === 'applying') return;
    if (worker === registration?.active && message.version === __APP_VERSION__) {
        setState({ offline: message.offline });
    }
    if (worker === registration?.installing || worker === registration?.waiting) {
        if (state.targetVersion && state.release && message.version < state.targetVersion) {
            if (worker.state === 'installed') setState({ phase: 'error', error: 'Máy chủ chưa đồng bộ đủ bản mới. Hãy thử tải lại sau vài giây.' });
            return;
        }
        if (message.core.phase === 'error') {
            setState({ phase: 'error', error: message.core.error });
        } else {
            setState({
                targetVersion: message.version, progress: message.core.progress, error: undefined,
                phase: worker.state === 'installed' && worker === registration.waiting ? 'ready' : 'downloading',
            });
        }
    } else if (worker === registration?.active && message.version !== __APP_VERSION__) {
        // Another tab may have activated the update. Reload this tab only on request.
        if (!state.targetVersion || message.version >= state.targetVersion) {
            setState({ phase: 'ready', targetVersion: message.version, progress: message.core.progress, error: undefined });
        }
    } else if (worker === registration?.active && message.version === __APP_VERSION__ && !registration.installing && !registration.waiting
        && (!state.targetVersion || state.targetVersion === __APP_VERSION__) && ['idle', 'downloading', 'ready'].includes(state.phase)) {
        setState({ phase: state.release?.version === __APP_VERSION__ ? 'current' : 'idle', error: undefined });
        if (!state.release) void checkForUpdates();
    }
}

async function refreshWorker(worker?: ServiceWorker | null) {
    if (worker) receiveStatus(await askWorker(worker, 'STATUS'), worker);
}

function watchWorker(worker: ServiceWorker | null) {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    const changed = () => {
        if (worker.state === 'installing') {
            setState({ phase: 'downloading', progress: emptyProgress(), error: undefined });
        } else if (worker.state === 'installed' || worker.state === 'activated') {
            void refreshWorker(worker).catch(error => setState({ phase: 'error', error: errorMessage(error) }));
        } else if (worker.state === 'redundant' && state.phase === 'downloading') {
            setState({ phase: 'error', error: 'Tải bản mới chưa hoàn tất. Bản đang dùng vẫn được giữ lại; hãy thử tải lại.' });
        }
    };
    worker.addEventListener('statechange', changed);
    changed();
}

export function initUpdateService(): Promise<void> {
    if (initialization) return initialization;
    initialization = (async () => {
        if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
            setState({ phase: 'unsupported' });
            return;
        }
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.channel !== PWA_CHANNEL) return;
            if ([registration?.active, registration?.waiting, registration?.installing].includes(event.source as ServiceWorker)) {
                receiveStatus(event.data, event.source as ServiceWorker);
            }
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            const active = navigator.serviceWorker.controller;
            if (applyingVersion && active) {
                void askWorker(active, 'STATUS').then(message => {
                    if (message.version !== applyingVersion) throw new Error('Phiên bản kích hoạt chưa khớp. Hãy kiểm tra lại.');
                    finishUpdate(message.version);
                }).catch(error => {
                    applyingVersion = undefined;
                    setState({ phase: 'error', error: errorMessage(error) });
                });
            } else void refreshWorker(active).catch(() => {});
        });
        registration = await navigator.serviceWorker.getRegistration(BASE);
        if (!registration || registration.scope !== BASE) registration = await navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE, updateViaCache: 'none' });
        registration.addEventListener('updatefound', () => watchWorker(registration?.installing || null));
        watchWorker(registration.installing);
        if (registration.waiting) watchWorker(registration.waiting);
        else if (registration.active) void refreshWorker(registration.active).catch(() => {});
        const checkWhenVisible = () => {
            if (document.visibilityState === 'visible' && navigator.onLine && Date.now() - lastCheck > 60_000) void checkForUpdates();
        };
        document.addEventListener('visibilitychange', checkWhenVisible);
        window.addEventListener('online', () => { void checkForUpdates(); });
        window.setInterval(checkWhenVisible, 60 * 60 * 1000);
    })().catch(error => {
        initialization = undefined;
        setState({ phase: 'error', error: errorMessage(error) });
    });
    return initialization;
}

export function checkForUpdates(): Promise<void> {
    if (checking) return checking;
    checking = (async () => {
        await initUpdateService();
        if (!registration || ['applying', 'downloading'].includes(state.phase)) return;
        if (!navigator.onLine) {
            if (registration.waiting) await refreshWorker(registration.waiting);
            else setState({ phase: 'offline', error: 'Đang offline. Kết nối mạng để kiểm tra phiên bản mới.' });
            return;
        }
        setState({ phase: 'checking', error: undefined });
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15_000);
        try {
            const response = await fetch(`${BASE}version.json?t=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) throw new Error(`Không kiểm tra được phiên bản (HTTP ${response.status}).`);
            const release = await response.json() as ReleaseInfo;
            if (typeof release.version !== 'string' || typeof release.coreBytes !== 'number') throw new Error('Thông tin phiên bản chưa hợp lệ. Hãy thử lại sau khi máy chủ triển khai xong.');
            lastCheck = Date.now();
            if (registration.installing) {
                setState({ release, targetVersion: release.version });
                watchWorker(registration.installing);
                await refreshWorker(registration.installing);
            } else {
                setState({ release, targetVersion: release.version, phase: release.version === __APP_VERSION__ ? 'current' : 'available' });
                if (registration.waiting) await refreshWorker(registration.waiting);
                else if (registration.active) await refreshWorker(registration.active).catch(() => {});
            }
        } finally { window.clearTimeout(timeout); }
    })().catch(error => setState({ phase: 'error', error: errorMessage(error) })).finally(() => { checking = undefined; });
    return checking;
}

export function downloadUpdate(): Promise<void> {
    if (downloading) return downloading;
    downloading = (async () => {
        await initUpdateService();
        if (!registration || state.phase === 'applying') return;
        if (!navigator.onLine) throw new Error('Cần kết nối mạng để tải phiên bản mới.');
        if (registration.waiting) {
            await refreshWorker(registration.waiting);
            if (state.phase === 'ready') return;
        }
        setState({ phase: 'downloading', progress: emptyProgress(), error: undefined });
        await registration.update();
        if (registration.installing) watchWorker(registration.installing);
        else if (registration.waiting) await refreshWorker(registration.waiting);
        else {
            // An unchanged CDN response is not a completed download.
            setState({ phase: 'idle' });
            await checkForUpdates();
            if (state.phase === 'available') setState({ phase: 'error', error: 'Máy chủ đang phát hành bản mới. Hãy thử tải lại sau vài giây.' });
        }
    })().catch(error => setState({ phase: 'error', error: errorMessage(error) })).finally(() => { downloading = undefined; });
    return downloading;
}

function finishUpdate(version: string) {
    try { sessionStorage.setItem(UPDATE_SUCCESS_KEY, version); } catch { /* Optional toast. */ }
    window.location.reload();
}

export async function applyUpdate(): Promise<void> {
    if (!registration || state.phase === 'applying') return;
    try {
        const worker = registration.waiting || registration.active;
        if (!worker) throw new Error('Bản cập nhật chưa tải xong.');
        const message = await askWorker(worker, 'STATUS');
        if (message.core.phase !== 'complete' || message.version === __APP_VERSION__ || message.version !== state.targetVersion) {
            throw new Error('Bản cập nhật chưa sẵn sàng. Hãy kiểm tra và tải lại.');
        }
        setState({ phase: 'applying', error: undefined });
        if (worker === registration.active) { finishUpdate(message.version); return; }
        applyingVersion = message.version;
        worker.postMessage({ type: 'SKIP_WAITING' });
        window.setTimeout(() => {
            if (state.phase !== 'applying') return;
            applyingVersion = undefined;
            setState({ phase: 'error', error: 'Chưa kích hoạt được phiên bản mới. Hãy thử lại.' });
        }, 20_000);
    } catch (error) { setState({ phase: 'error', error: errorMessage(error) }); }
}

export async function refreshOfflineStatus(): Promise<void> {
    await initUpdateService();
    try { await refreshWorker(registration?.active); }
    catch (error) { setState({ offline: { ...state.offline, phase: 'error', error: errorMessage(error) } }); }
}

export async function downloadOffline(): Promise<void> {
    await initUpdateService();
    try {
        if (!navigator.onLine) throw new Error('Kết nối mạng để tải nội dung offline.');
        if (!registration?.active || registration.active.state !== 'activated') throw new Error('Ứng dụng đang chuẩn bị. Hãy thử lại sau vài giây.');
        const message = await askWorker(registration.active, 'STATUS');
        if (message.version !== __APP_VERSION__) throw new Error('Hãy áp dụng phiên bản mới trước khi tải nội dung offline.');
        void navigator.storage?.persist?.().catch(() => false);
        receiveStatus(await askWorker(registration.active, 'DOWNLOAD_OFFLINE'), registration.active);
    } catch (error) { setState({ offline: { ...state.offline, phase: 'error', error: errorMessage(error) } }); }
}

export async function pauseOffline(): Promise<void> {
    try {
        if (registration?.active) receiveStatus(await askWorker(registration.active, 'PAUSE_OFFLINE'), registration.active);
    } catch (error) { setState({ offline: { ...state.offline, phase: 'error', error: errorMessage(error) } }); }
}

export function checkUpdateSuccess(): boolean {
    try {
        const version = sessionStorage.getItem(UPDATE_SUCCESS_KEY);
        sessionStorage.removeItem(UPDATE_SUCCESS_KEY);
        return version === __APP_VERSION__;
    } catch { return false; }
}
