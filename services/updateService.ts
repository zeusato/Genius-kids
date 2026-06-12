/**
 * Service quản lý việc kiểm tra và cập nhật phiên bản ứng dụng PWA
 * Dùng cơ chế chuẩn của vite-plugin-pwa / Workbox (registerType: 'prompt'):
 * - Service worker mới được phát hiện qua registration.update() định kỳ
 * - Workbox tự tải ngầm CHỈ những file thay đổi so với cache hiện tại (diff update)
 * - onNeedRefresh chỉ bắn ra khi bản mới đã tải xong toàn bộ, nằm chờ kích hoạt
 * - applyUpdate gửi SKIP_WAITING + reload => cập nhật gần như tức thì
 */

import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL = 4 * 60 * 1000; // 4 phút

// Custom event để thông báo có update
export const UPDATE_AVAILABLE_EVENT = 'app-update-available';
// Custom event để thông báo đã check xong (dù có hay không có update)
export const UPDATE_CHECK_COMPLETE_EVENT = 'app-update-check-complete';

const UPDATE_SUCCESS_KEY = 'update-success';

// Key của cơ chế cũ (so hash index.html) - dọn dẹp cho client đã cài bản trước
const LEGACY_KEYS = ['app-version-hash', 'app-last-check'];

// Hàm do registerSW trả về: gửi SKIP_WAITING cho SW đang chờ và reload khi SW mới nắm quyền
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;

// Đã có bản mới tải xong nằm chờ kích hoạt
let updateReady = false;

function dispatchCheckComplete(upToDate: boolean): void {
    window.dispatchEvent(new CustomEvent(UPDATE_CHECK_COMPLETE_EVENT, { detail: { upToDate } }));
}

function dispatchUpdateAvailable(): void {
    window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
}

/**
 * Áp dụng update: bản mới đã nằm sẵn trong cache, chỉ cần kích hoạt SW mới và reload
 * @param onProgress Callback báo cáo tiến độ (0-100)
 */
export async function applyUpdate(onProgress?: (percent: number, step: string) => void): Promise<void> {
    console.log('[UpdateService] Applying update...');
    onProgress?.(40, 'Đang kích hoạt phiên bản mới...');

    // Đánh dấu update thành công để lần mở sau hiển thị thông báo
    localStorage.setItem(UPDATE_SUCCESS_KEY, 'true');

    onProgress?.(100, 'Hoàn tất! Đang khởi động lại...');

    // Đợi một chút để UI kịp hiển thị 100%
    await new Promise(resolve => setTimeout(resolve, 500));

    // Lưới an toàn: nếu vì lý do gì đó SW không kích hoạt được thì vẫn reload
    // (reload thành công thì timer chết theo trang, không chạy lần hai)
    window.setTimeout(() => window.location.reload(), 5000);

    try {
        if (updateServiceWorker) {
            // Gửi SKIP_WAITING; trang tự reload khi SW mới nhận quyền điều khiển
            await updateServiceWorker(true);
        } else {
            window.location.reload();
        }
    } catch (error) {
        console.error('[UpdateService] Error applying update:', error);
        window.location.reload();
    }
}

/**
 * Kiểm tra xem lần mở app này có phải sau khi update thành công không
 * Nếu có, xóa cờ và trả về true
 */
export function checkUpdateSuccess(): boolean {
    const isSuccess = localStorage.getItem(UPDATE_SUCCESS_KEY) === 'true';
    if (isSuccess) {
        localStorage.removeItem(UPDATE_SUCCESS_KEY);
        return true;
    }
    return false;
}

/**
 * Khởi tạo update service
 * - Đăng ký service worker (Workbox)
 * - Check update ngay khi load + định kỳ + khi có mạng trở lại
 */
export async function initUpdateService(): Promise<void> {
    console.log('[UpdateService] Initializing...');

    // Dọn key của cơ chế update cũ
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));

    updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh() {
            // Bản mới đã tải xong về cache, chỉ chờ người dùng đồng ý kích hoạt
            console.log('[UpdateService] Update downloaded and ready to activate');
            updateReady = true;
            dispatchCheckComplete(false);
            dispatchUpdateAvailable();
        },
        onOfflineReady() {
            // Lần cài đầu tiên: precache xong toàn bộ => chắc chắn là bản mới nhất
            console.log('[UpdateService] App ready to work offline');
            dispatchCheckComplete(true);
        },
        onRegisteredSW(_swUrl, registration) {
            console.log('[UpdateService] Service worker registered');
            if (!registration) return;

            const check = async () => {
                // Đã có bản chờ kích hoạt thì không cần check nữa
                if (updateReady || !navigator.onLine || registration.installing) return;
                try {
                    await registration.update();
                    // Check xong mà không có SW mới đang cài/chờ => đang ở bản mới nhất
                    if (!registration.installing && !registration.waiting) {
                        dispatchCheckComplete(true);
                    }
                } catch (error) {
                    console.warn('[UpdateService] Update check failed:', error);
                }
            };

            // Check ngay khi load
            check();

            // Check định kỳ
            console.log(`[UpdateService] Starting periodic check every ${UPDATE_CHECK_INTERVAL / 60000} minutes`);
            window.setInterval(check, UPDATE_CHECK_INTERVAL);

            // Check khi có kết nối mạng trở lại
            window.addEventListener('online', () => {
                console.log('[UpdateService] Network online, checking for updates...');
                check();
            });
        },
        onRegisterError(error) {
            console.error('[UpdateService] Service worker registration failed:', error);
        }
    });

    console.log('[UpdateService] Initialized successfully');
}
