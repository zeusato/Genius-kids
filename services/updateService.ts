/**
 * Service quản lý việc kiểm tra và cập nhật phiên bản ứng dụng PWA.
 *
 * Sử dụng luồng chuẩn của vite-plugin-pwa (workbox) thay vì tự hash index.html:
 * - Service worker tự giữ một precache-manifest với revision của từng tài nguyên.
 * - Khi có bản build mới, workbox chỉ tải về ĐÚNG các tài nguyên đã thay đổi (diff update).
 * - `onNeedRefresh` chỉ phát đúng một lần khi đã có service worker mới ở trạng thái "waiting"
 *   → tránh việc báo cập nhật lặp lại.
 * - Việc kiểm tra cập nhật dùng `registration.update()` (kiểm tra qua service worker),
 *   được bọc try/catch và chỉ chạy khi online → không còn spam lỗi "Failed to fetch" ra console.
 */

import { registerSW } from 'virtual:pwa-register';

// Custom event để thông báo có update sẵn sàng (service worker mới đang chờ)
export const UPDATE_AVAILABLE_EVENT = 'app-update-available';
// Custom event để thông báo đã đăng ký/kiểm tra xong (để UI hiển thị badge "Newest Version")
export const UPDATE_CHECK_COMPLETE_EVENT = 'app-update-check-complete';

const UPDATE_SUCCESS_KEY = 'update-success';

// Kiểm tra cập nhật định kỳ mỗi 60 phút (ngoài ra còn kiểm tra khi mở app,
// khi tab được focus trở lại, và khi có kết nối mạng).
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

// Hàm do registerSW trả về: updateSW(true) sẽ skipWaiting + reload trang.
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;

/**
 * Khởi tạo update service: đăng ký service worker và thiết lập kiểm tra cập nhật.
 */
export async function initUpdateService(): Promise<void> {
    console.log('[UpdateService] Initializing...');

    if (!('serviceWorker' in navigator)) {
        console.log('[UpdateService] Service worker không được hỗ trợ, bỏ qua');
        return;
    }

    updateSW = registerSW({
        immediate: true,

        // Có service worker mới đã cài xong và đang chờ kích hoạt → đã có bản cập nhật.
        onNeedRefresh() {
            console.log('[UpdateService] Update available (new service worker waiting)');
            window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
        },

        // Lần cài đầu tiên: đã precache xong, sẵn sàng dùng offline. Không cần báo cập nhật.
        onOfflineReady() {
            console.log('[UpdateService] App ready to work offline');
        },

        // Đăng ký service worker thành công.
        onRegisteredSW(swUrl, registration) {
            console.log('[UpdateService] Service worker registered:', swUrl);

            // Báo đã kiểm tra xong phiên bản (để hiển thị badge trên Home).
            window.dispatchEvent(new CustomEvent(UPDATE_CHECK_COMPLETE_EVENT, {
                detail: { upToDate: !registration?.waiting },
            }));

            if (!registration) return;

            // Hàm kiểm tra cập nhật an toàn: chỉ chạy khi online, nuốt mọi lỗi mạng
            // để không spam console khi mất kết nối / đổi mạng.
            const safeUpdate = () => {
                if (!navigator.onLine) return;
                registration.update().catch(() => { /* bỏ qua lỗi mạng tạm thời */ });
            };

            // Kiểm tra khi tab được focus trở lại.
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') safeUpdate();
            });

            // Kiểm tra khi có kết nối mạng trở lại.
            window.addEventListener('online', safeUpdate);

            // Kiểm tra định kỳ.
            window.setInterval(safeUpdate, UPDATE_CHECK_INTERVAL);
        },

        onRegisterError(error) {
            console.error('[UpdateService] Service worker registration failed:', error);
        },
    });

    console.log('[UpdateService] Initialized successfully');
}

/**
 * Áp dụng update: kích hoạt service worker mới (skipWaiting) và reload trang.
 * Workbox sẽ tự reload khi service worker mới nắm quyền (controllerchange).
 * @param onProgress Callback báo cáo tiến độ (0-100)
 */
export async function applyUpdate(onProgress?: (percent: number, step: string) => void): Promise<void> {
    console.log('[UpdateService] Applying update...');

    onProgress?.(30, 'Đang kích hoạt phiên bản mới...');

    // Đánh dấu update thành công để lần mở sau hiển thị thông báo.
    try {
        localStorage.setItem(UPDATE_SUCCESS_KEY, 'true');
    } catch {
        // localStorage có thể bị chặn (chế độ riêng tư) — không sao, chỉ là không hiện toast.
    }

    onProgress?.(70, 'Đang tải các tệp cập nhật...');

    if (updateSW) {
        // updateSW(true): gửi SKIP_WAITING cho service worker mới rồi reload khi nó nắm quyền.
        updateSW(true).catch(err => {
            console.error('[UpdateService] updateSW failed, forcing reload:', err);
            window.location.reload();
        });

        // Lưới an toàn: nếu vì lý do nào đó không có service worker waiting để kích hoạt
        // (controllerchange không xảy ra), tự reload sau 4 giây.
        setTimeout(() => {
            window.location.reload();
        }, 4000);
    } else {
        // Không có service worker (ví dụ môi trường dev) → reload đơn thuần.
        window.location.reload();
    }

    onProgress?.(100, 'Hoàn tất! Đang khởi động lại...');
}

/**
 * Kiểm tra xem lần mở app này có phải sau khi update thành công không.
 * Nếu có, xóa cờ và trả về true.
 */
export function checkUpdateSuccess(): boolean {
    try {
        const isSuccess = localStorage.getItem(UPDATE_SUCCESS_KEY) === 'true';
        if (isSuccess) {
            localStorage.removeItem(UPDATE_SUCCESS_KEY);
            return true;
        }
    } catch {
        // bỏ qua nếu localStorage không khả dụng
    }
    return false;
}
