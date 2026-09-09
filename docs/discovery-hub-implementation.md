# Nâng cấp sảnh khám phá và menu trò chơi

Hoàn thành ngày 09/09/2026 theo `discovery-hub-graphics-plan.md`.

## Giao diện và trải nghiệm

- Màn chọn chế độ, menu trò chơi và hai hoạt động Kỹ Sư Máy Móc dùng chung header, font Nunito, nền kem, chữ xanh, thẻ có ảnh minh họa và trạng thái focus.
- Sáu chế độ xếp 3 × 2 trên desktop; danh mục game dùng ba cột desktop, hai cột tablet, một cột thẻ ngang trên điện thoại. Sau chỉnh ảnh phủ kín, ở 1280 × 720, cả sáu thẻ chế độ kết thúc tại khoảng 718 px; footer nằm phía dưới vùng cuộn.
- Hồ sơ, số sao, cửa hàng và điều khiển âm thanh có vị trí thống nhất. Menu hồ sơ hỗ trợ Escape, click ngoài và bàn phím; màn hình hẹp vẫn xem được sao và cửa hàng trong menu này.
- Bốn ảnh Ôn Luyện, Thư Viện, Nhân Sư và Khoa Học được tạo qua Google Flow. Bìa các game tận dụng nhân vật, SVG và cảnh sẵn có, gồm Tia và dũng sĩ cưỡi ngựa. Đua Tốc Độ và Đường Đua Thần Tốc có bìa, nhãn và điểm vào riêng.
- Bốn ảnh chế độ phủ kín vùng bìa bằng một ảnh `object-fit: cover`, bỏ lớp nền mờ và mặt nạ gây đường nối hai bên. Bìa desktop cao 160 px (150 px trên màn hình thấp); canh riêng ảnh Thư Viện. Mobile tiếp tục dùng bìa ngang cạnh nội dung.
- Theme học sinh ánh xạ vào màu hub; reduced motion tắt các chuyển động trang trí. Không có animation chặn tương tác.

## Điểm vào game

- Catalog tách khỏi thành phần khởi chạy; game được lazy-load sau khi chọn. Không mount các scene game để vẽ ảnh bìa.
- Cấu hình nằm tại lobby của các game mới. Racing, các bản cũ và hai game bánh răng có bảng chuẩn bị chọn độ khó trước khi mở.
- Mầm non giữ sáu chế độ phù hợp, chỉ có Lật Thẻ và Giai Điệu Vui Nhộn trong danh mục game. Kiểm tra điều kiện lớp cũng áp dụng cho URL game trực tiếp.
- URL `play`, `edition`, `level` ghi nhận điểm vào. Khi quay lại, menu khôi phục vị trí cuộn và focus về thẻ vừa chọn; Back/Forward hỗ trợ cả menu bánh răng.
- Giữ cờ VITE_MEMORY_V2, VITE_SOUND_V2, VITE_DRAGON_V2 và callback bản cũ. Các game mới tiếp tục tự xử lý lưu tiến độ, không thêm callback thưởng cũ.

## Asset và tải trang

- 18 file WebP, gồm 9 ảnh ở hai cỡ 800 × 450 và 400 × 225: tổng **350.714 byte**. Có srcset, lazy loading và hình thay thế nếu ảnh lỗi.
- Font Nunito Latin/tiếng Việt tự phục vụ: **52.224 byte**, kèm giấy phép OFL và font-display swap.
- Ảnh hub được cache theo nhu cầu, không thêm vào precache toàn ứng dụng. Font được precache.
- Prompt và nguồn ảnh: `public/hub/art/README.md`; công cụ tạo thumbnail: `scripts/install-hub-art.mjs`.

## Kiểm tra đã thực hiện

- TypeScript `tsc --noEmit`: đạt.
- Vitest: **453/453 test, 28 file đạt**, gồm 7 test mới cho catalog, điều kiện lớp và chuyển đổi cấu hình.
- Vite production build/PWA: đạt. Vẫn có cảnh báo chunk lớn của ứng dụng; đợt này không tối ưu toàn bộ các màn học.
- `git diff --check`: đạt.
- Kiểm tra layout tại 320/390/768/1280/1440 px. Sau sửa header, tại 320 px không còn phần tử header tràn ngang; tên dài xuống dòng phù hợp. Kiểm tra hai thẻ mầm non không kéo giãn bất thường; font và ảnh tải thành công.
- Mở và quay lại các game Memory v2, Sound v2, Speed, Dragon, Sudoku; Racing mở màn bắt đầu sau bảng chuẩn bị. Memory bản cũ mức Trung bình mở 10 cặp; Lắp Bánh Răng nhận mức Trung bình. Kiểm tra menu bánh răng, đóng bảng chuẩn bị và Back/Forward khôi phục đúng thẻ/vị trí.
- Menu hồ sơ đóng bằng Escape và trả focus. Tắt hiệu ứng âm thanh ở menu game rồi về màn chế độ vẫn giữ tắt; sau kiểm tra đã khôi phục cài đặt ban đầu.

Đây là kiểm tra giao diện và điểm vào, không phải chơi hết từng game. Chưa mô phỏng lỗi mạng, ảnh hỏng, Service Worker offline hoặc dùng trình đọc màn hình; các cơ chế fallback và giảm chuyển động đã có trong mã.

## Xem và bảo trì

Chạy dev server như hiện tại, chọn học sinh rồi vào màn chế độ hoặc Trò Chơi. `hub-preview.html` là fixture chỉ dùng trong DEV với hồ sơ trong bộ nhớ, có tùy chọn lớp, theme, tên dài và đổi màn; fixture không gắn StudentProvider hay sửa hồ sơ thật, không phải entry của production build.

Các thành phần dùng chung nằm ở `src/components/hub/`; `games/GameLauncher.tsx` giữ các nhánh khởi chạy. Không thay đổi luật chơi trong đợt nâng cấp này.
