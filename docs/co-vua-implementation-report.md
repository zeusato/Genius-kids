# Cờ Vua — báo cáo nâng cấp bản độc lập

Cập nhật **16/09/2026**. Đã triển khai nâng cấp theo review, **chưa ghép vào ứng dụng chính**.

## Kết quả chính

- Đổi lobby, bố cục gameplay và bảng thông tin sang phòng cờ sáng: gỗ, giấy ngà, xanh trầm; font/controls cùng quy ước Cờ Tướng.
- Bộ quân Staunton mới: hình học gộp theo loại, instancing, Mã/Tượng/Xe/Hậu/Vua có chi tiết nhận diện; bàn có cạnh vát, vân gỗ, tọa độ và ánh sáng. Cảnh có bình lá, sách; chế độ nhẹ tắt cảnh phụ và bóng.
- Camera tự fit desktop/portrait, góc nghiêng/từ trên, đổi hướng. Click phần đầu quân 3D chọn đúng quân. 2D dùng SVG tự vẽ và điều khiển bàn phím.
- Chọn Trắng/Đen, lịch sử, quân đã bắt, chuyền máy, xác nhận xin thua/thỏa thuận hòa, giảm chuyển động, âm thanh. Nước đi và nhập thành có animation; lựa chọn phong cấp trước commit.
- Sửa các lỗi P1: timeout làm hỏng search position; search bỏ qua hòa; EP key sai; bản lưu giả/hỏng được chấp nhận; applyMove nhận nước sai; owner xin thua sai màu; kết quả đánh dấu thành công trước ghi; worker/modal/background và fallback chặn UI.
- Standalone có build/PWA/font/cover/worker riêng. Thông báo sẵn sàng offline, cập nhật thủ công, lưu ván trước khi tải lại.

## Kiểm chứng đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| Vitest riêng Cờ Vua | **72/72 đạt**, 5 file, lần cuối khoảng 8,6 giây |
| Perft | Khai cuộc 1–4; Kiwipete 1–4 (4.085.603); các thế 3/4/5 khớp |
| Tactics | Mate-in-1, bắt Hậu/thoát chiếu/giữ quân; ba thế tàn cuộc mate-in-2, kiểm tra mọi phản hồi |
| Regression/controller/storage | Unwind, zero budget, hòa, EP ghim, forged save, resign owner, stale/duplicate/cancel/timeout, fail/retry, no stars |
| TypeScript standalone strict | Đạt với `games/CoVua/tsconfig.json` |
| Build production riêng | Đạt; 18 precache entries, **1.284,72 KiB** tổng tài nguyên precache |
| JS chính / 3D / worker | Khoảng 243,6 / 893,8 / 13,7 kB thô; main gzip 78,1 kB, 3D gzip 246,1 kB |
| Portrait 390×844 | Đủ 64 ô, không cuộn ngang hoặc controls phủ bàn |
| Cảnh khai cuộc 3D | Renderer counter DEV: **17 draw calls, 86.892 tam giác**; đạt budget 80 / 90k |
| Browser 3D | Chọn trực tiếp đầu Vua e1, chọn Tốt e2 rồi đi e4; worker phản hồi |
| Browser 2D | e2–e4, máy g8–f6; ArrowRight từ b1 sang c1, Enter/Esc hoạt động |
| Browser nước đặc biệt | a7–a8=N kết thúc hòa thiếu quân; nhập thành e1–g1 có Xe tại f1 và chuyền máy |
| Context loss | Chủ động mất WebGL → tự chuyển 2D; lịch sử e1–g1 được giữ |
| Manual update | Bấm cập nhật ngay sau e2–e4; tải lại và tiếp tục đúng draft một nước |
| Offline production | **Tắt server 4322**, tải lại lobby/cover/font, tiếp tục draft, mở 3D, đi g1–f3; worker trả f6–e4 khi server vẫn tắt |

Đã bật lại server 4322 sau kiểm tra offline. Build còn cảnh báo chunk 3D lớn hơn 500 kB; chunk đã lazy-load và precache riêng. Không đổi giới hạn cảnh báo để che số liệu.

Kiwipete depth 4 duyệt hơn bốn triệu lá, chạy khoảng 6–8 giây ở máy này; test được đặt timeout riêng 20 giây. Không phải lỗi kết quả perft.

Strict config chỉ kiểm module standalone. `profile-adapter.ts` và test profile được kiểm bởi Vitest; adapter chưa nối host và không nằm trong strict standalone vì import dịch vụ toàn dự án. Không tuyên bố typecheck/test/build toàn dự án đã được nghiệm thu trong đợt này.

## Benchmark nhanh — giới hạn kết luận

Hai run cùng seed 20260915, năm khai cuộc cố định, đổi màu theo cặp:

| Đối thủ | Điều kiện | W / D / L / unfinished | Nước sai |
| --- | --- | --- | ---: |
| Random | 5 cặp, Hard 1.500 node/nước, cap 160 ply | 10 / 0 / 0 / 0 | 0 |
| Greedy | 5 cặp, Hard 3.000 node/nước, cap 180 ply | 10 / 0 / 0 / 0 | 0 |

Mỗi run còn đo deadline thật ở năm vị trí: Dễ p95 khoảng 11 ms, Vừa 400 ms, Khó 1.200 ms. Đây là **5 mẫu mỗi mức trên máy desktop này**, không đại diện latency thiết bị di động.

Chỉ có năm cặp hoàn tất mỗi run nên không báo CI. Không dùng kết quả này để tuyên bố mạnh hơn người mới hoặc đã nghiệm thu toàn bộ phân tầng độ khó. Runner đã tách unfinished khỏi draw, thêm đối thủ depth4 và bootstrap theo cặp; tournament quy mô lớn còn là cổng phát hành.

Raw:

- [Random smoke](../games/CoVua/reports/benchmark-smoke.json)
- [Greedy smoke](../games/CoVua/reports/benchmark-greedy.json)

Hai JSON `docs/co-vua-benchmark-*-30-120-7.json` là dữ liệu prototype cũ; cách tính thống kê cũ không được dùng làm bằng chứng cho bản nâng cấp.

## Hình ảnh để duyệt

- [Gameplay desktop](../games/CoVua/reports/screenshots/desktop-gameplay.png)
- [Gameplay 390×844](../games/CoVua/reports/screenshots/mobile-gameplay.png)

Đây là ảnh chụp bản production thật. Ảnh bìa Flow không được dùng thay nghiệm thu gameplay.

## Chạy và xem

```powershell
node node_modules/vite/bin/vite.js --config games/CoVua/vite.config.ts
node node_modules/vitest/vitest.mjs run games/CoVua
node node_modules/typescript/bin/tsc --project games/CoVua/tsconfig.json --pretty false
node node_modules/vite/bin/vite.js build --config games/CoVua/vite.config.ts
node node_modules/vite/bin/vite.js preview --config games/CoVua/vite.config.ts --host 127.0.0.1 --port 4322 --strictPort
```

- DEV: http://127.0.0.1:4321/ (fixture tools chỉ hiện ở DEV).
- Production độc lập: http://127.0.0.1:4322/.

## Chưa ghép / cần nghiệm thu tiếp

1. Chủ sản phẩm duyệt hình ảnh; thử cảm ứng, FPS/pin/nhiệt và accessibility trên thiết bị thật.
2. Tournament lớn, puzzle đa dạng và đối chứng engine độc lập; không lấy vài ván random làm bằng chứng sức mạnh.
3. Khi được yêu cầu ghép: completion action dùng profile mới nhất và ghi thật, schema GameRecord, hook xóa owner, launcher/catalog, base path và PWA của host. Kiểm thử toàn dự án sau ghép.
4. Không có luật chiếu-dai/đuổi-bắt Cờ Tướng trong Cờ Vua. Tự hòa 3 lần/50 nước là quy ước ứng dụng; không nhận diện toàn bộ thế cờ chết phức tạp.

Chi tiết quyết định và acceptance gates: [plan cập nhật](co-vua-implementation-plan.md).
