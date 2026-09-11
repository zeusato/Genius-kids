# Chuẩn hóa menu Khoa học

Ngày 11/09/2026.

## Giao diện

- Menu dùng chung `HubShell`, `HubIntro`, `HubCard` và font/màu của sảnh Khám phá, Trò chơi. Hồ sơ, số sao, cửa hàng, nhạc nền và âm thanh nằm cùng vị trí.
- Sáu chủ đề xếp ba cột trên desktop, hai cột trên tablet, một cột thẻ ngang trên điện thoại. Cả thẻ là nút có tên truy cập và hỗ trợ bàn phím.
- Sáu bìa riêng được tạo trong Google Flow (Nano Banana 2), xuất thành 12 WebP responsive 800 × 450 và 400 × 225, tổng 162.768 byte. Prompt và source ID nằm tại `public/hub/art/science-sources.json`.
- Dùng lại srcset, lazy loading, fallback ảnh và reduced motion của hub. Cache ảnh theo nhu cầu được tăng từ 24 lên 40 mục để chứa đủ 30 file bìa của cả hub; không thêm ảnh vào precache.

## Điều hướng và lớp

- Catalog tập trung tại `src/components/hub/catalog.ts`, giữ nguyên sáu đường dẫn và thứ tự chủ đề.
- Mầm non thấy Hệ Mặt Trời, Xưởng Hành Tinh và Tế Bào; lớp 1–5 thấy đủ sáu chủ đề, như trước.
- Khi quay lại từ chủ đề, menu khôi phục vị trí cuộn và focus về thẻ đã chọn. Trạng thái nằm trong bộ nhớ, tách theo học sinh và được xóa khi rời menu qua header.
- `ScienceMenuScreen` tách phần hiển thị khỏi điều hướng và StudentProvider. Fixture DEV: `/Genius-kids/hub-preview.html?screen=science`; các lựa chọn lớp, theme và tên trong fixture chỉ ở bộ nhớ.

## Kiểm tra

- TypeScript `tsc --noEmit`: đạt. Vitest catalog: 10/10 test đạt, gồm điều kiện mầm non và đường dẫn cho lớp 1–5.
- Kiểm tra trình duyệt tại 1280, 768, 390 và 320 px: đúng ba/hai/một cột, không tràn ngang, đủ sáu ảnh tải thành công.
- Đổi lớp sang mầm non hiện đúng ba thẻ; theme Ocean áp dụng đúng. Menu hồ sơ trên điện thoại mở được và Escape đóng, trả focus.
- Trong ứng dụng thật: vào Khoa học từ sảnh, mở đủ sáu chủ đề, quay lại menu bằng nút của chủ đề hoặc Browser Back. Kiểm tra focus về Cây Tiến Hóa và Hệ Mặt Trời; vị trí cuộn được phục hồi. Nút Về khám phá trở lại đúng sảnh.
- Console của menu fixture và phiên kiểm tra ứng dụng không có lỗi. `git diff --check`: đạt.
- Vite production build/PWA: đạt; còn cảnh báo có sẵn về chunk lớn, import tĩnh/động và URL font được giữ để tải lúc chạy.

Phạm vi kiểm tra là menu và điểm vào; không chơi hết nội dung khoa học, chưa mô phỏng Service Worker offline hay trình đọc màn hình. Luật chơi và nội dung bên trong các chủ đề không thay đổi.
