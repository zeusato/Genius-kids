/**
 * Service quản lý việc kiểm tra và cập nhật phiên bản ứng dụng PWA
 * - Kiểm tra hash của index.html từ server
 * - Chạy định kỳ mỗi 3-5 phút
 * - Tự động kiểm tra khi có kết nối mạng
 * - Clear cache và reload khi có bản cập nhật
 */

const UPDATE_CHECK_INTERVAL = 4 * 60 * 1000; // 4 phút
const LOCAL_HASH_KEY = 'app-version-hash';
const LAST_CHECK_KEY = 'app-last-check';

// Custom event để thông báo có update
export const UPDATE_AVAILABLE_EVENT = 'app-update-available';
// Custom event để thông báo đã check xong (dù có hay không có update)
export const UPDATE_CHECK_COMPLETE_EVENT = 'app-update-check-complete';

/**
 * Tính SHA-256 hash từ string content
 */
async function calculateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Fetch index.html từ server và tính hash
 */
async function fetchRemoteHash(): Promise<string | null> {
    try {
        // Kiểm tra kết nối mạng
        if (!navigator.onLine) {
            console.log('[UpdateService] Offline, skip check');
            return null;
        }

        // Fetch index.html với cache-busting
        const timestamp = Date.now();
        const basePath = (import.meta as any).env?.BASE_URL || '/';
        const url = `${window.location.origin}${basePath}index.html?t=${timestamp}`;

        const response = await fetch(url, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            console.warn('[UpdateService] Failed to fetch index.html:', response.status);
            return null;
        }

        const content = await response.text();
        const hash = await calculateHash(content);

        console.log('[UpdateService] Remote hash:', hash);
        return hash;
    } catch (error) {
        console.error('[UpdateService] Error fetching remote hash:', error);
        return null;
    }
}

/**
 * Lấy hash đã lưu trong localStorage
 */
function getLocalHash(): string | null {
    return localStorage.getItem(LOCAL_HASH_KEY);
}

/**
 * Lưu hash vào localStorage
 */
function setLocalHash(hash: string): void {
    localStorage.setItem(LOCAL_HASH_KEY, hash);
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
}

/**
 * Kiểm tra xem có bản cập nhật mới hay không
 * @returns true nếu có update, false nếu không có hoặc lỗi
 */
export async function checkForUpdates(): Promise<boolean> {
    console.log('[UpdateService] Checking for updates...');

    const remoteHash = await fetchRemoteHash();
    if (!remoteHash) {
        return false;
    }

    const localHash = getLocalHash();

    // Lần đầu tiên chạy app, lưu hash và không cần update
    if (!localHash) {
        console.log('[UpdateService] First run, saving hash');
        setLocalHash(remoteHash);
        // Dispatch event để thông báo đã check xong
        window.dispatchEvent(new CustomEvent(UPDATE_CHECK_COMPLETE_EVENT, { detail: { upToDate: true } }));
        return false;
    }

    // So sánh hash
    if (remoteHash !== localHash) {
        console.log('[UpdateService] Update available!');
        console.log('[UpdateService] Local:', localHash);
        console.log('[UpdateService] Remote:', remoteHash);
        // Dispatch event để thông báo đã check xong
        window.dispatchEvent(new CustomEvent(UPDATE_CHECK_COMPLETE_EVENT, { detail: { upToDate: false } }));
        return true;
    }

    console.log('[UpdateService] App is up to date');
    // Dispatch event để thông báo đã check xong
    window.dispatchEvent(new CustomEvent(UPDATE_CHECK_COMPLETE_EVENT, { detail: { upToDate: true } }));
    return false;
}

/**
 * Áp dụng update: clear cache và reload trang
 */
export async function applyUpdate(): Promise<void> {
    console.log('[UpdateService] Applying update...');

    try {
        // Clear tất cả cache của service worker
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('[UpdateService] Cleared all caches');
        }

        // Unregister service worker cũ và đăng ký lại
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
            console.log('[UpdateService] Unregistered service workers');
        }

        // Fetch hash mới và lưu trước khi reload
        const newHash = await fetchRemoteHash();
        if (newHash) {
            setLocalHash(newHash);
        }

        // Reload trang để load code mới
        window.location.reload();
    } catch (error) {
        console.error('[UpdateService] Error applying update:', error);
        // Vẫn reload dù có lỗi
        window.location.reload();
    }
}

/**
 * Bắt đầu kiểm tra định kỳ
 */
let checkInterval: number | null = null;

export function startPeriodicCheck(): void {
    if (checkInterval) {
        console.log('[UpdateService] Periodic check already running');
        return;
    }

    console.log(`[UpdateService] Starting periodic check every ${UPDATE_CHECK_INTERVAL / 60000} minutes`);

    checkInterval = window.setInterval(async () => {
        const hasUpdate = await checkForUpdates();
        if (hasUpdate) {
            // Dispatch custom event để UI hiển thị notification
            window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
        }
    }, UPDATE_CHECK_INTERVAL);
}

/**
 * Dừng kiểm tra định kỳ
 */
export function stopPeriodicCheck(): void {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('[UpdateService] Stopped periodic check');
    }
}

/**
 * Khởi tạo update service
 * - Check ngay khi load
 * - Bắt đầu periodic check
 * - Listen network online event
 */
export async function initUpdateService(): Promise<void> {
    console.log('[UpdateService] Initializing...');

    // Check ngay khi load
    const hasUpdate = await checkForUpdates();
    if (hasUpdate) {
        window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
    }

    // Bắt đầu periodic check
    startPeriodicCheck();

    // Listen khi có kết nối mạng trở lại
    window.addEventListener('online', async () => {
        console.log('[UpdateService] Network online, checking for updates...');
        const hasUpdate = await checkForUpdates();
        if (hasUpdate) {
            window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
        }
    });

    console.log('[UpdateService] Initialized successfully');
}
