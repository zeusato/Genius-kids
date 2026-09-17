# Ca-rô và lưu tiến trình Sudoku

Ngày hoàn thiện: 17/09/2026. Thực hiện theo yêu cầu của Đại ca. Đã tích hợp trong dự án; chưa triển khai lên máy chủ.

## Tính năng đã có

**Ca-rô:** Trò chơi → Board games → Cờ Ca-rô, đường dẫn `/Genius-kids/game?play=caro`.

- Hai người cùng một thiết bị hoặc một người đấu máy, ba mức Dễ / Vừa / Khó. Chủ hồ sơ chọn X/O; X đi trước; chơi lại đổi bên. Tên chủ lấy từ hồ sơ, người khách chọn tên/avatar.
- Bàn 15 × 15 cố định hướng; thắng khi đúng 5 quân liên tiếp và không bị đối thủ chặn cả hai đầu. Sáu quân trở lên không thắng; mép bàn không tính là quân chặn. Kiểm tra độc lập cả bốn trục.
- Bìa và nền do imagegen tạo, chuyển WebP; giấy kem, X đỏ đất, O xanh cổ vịt. Bàn thật dùng HTML/SVG, ảnh bìa không bị khối chữ che. Nguồn/prompt nằm trong `caro/art-prompts.md`.
- Chuột đặt trực tiếp; cảm ứng hoặc màn hình hẹp chọn ô rồi xác nhận. Mũi tên di chuyển, Enter/Space đặt quân, Escape bỏ chọn. Zoom 1–3 lần, vuốt vùng bàn khi phóng to, nút xem toàn bàn; pinch giữ hành vi zoom trang của trình duyệt.
- Luật minh họa, đánh dấu nước cuối và hàng thắng, tắt âm, giảm chuyển động theo hệ điều hành, tạm dừng. Tùy chọn đi lại mặc định tắt; hai người xác nhận, đấu máy lùi trọn lượt người nhưng giữ nước mở đầu của máy.
- Tự lưu theo hồ sơ; tiếp tục sau khi tải lại. Lịch sử, xem lại từng nước, thống kê thắng/hòa/thua; giữ diễn biến chi tiết 50 ván gần nhất. Xem lại không ghi đè ván dở. Ghi kết quả theo ID ván để tránh cộng lặp; Ca-rô không thưởng sao/gacha.
- Máy chạy trong Worker, ưu tiên thắng/chặn thắng ngay, tìm kiếm có giới hạn thời gian. Hủy kết quả cũ khi tạm dừng, đi lại hoặc rời game; có nước dự phòng khi Worker lỗi/timeout.

**Sudoku:** giữ giao diện và cách thưởng hiện có, thêm lưu và tạm dừng.

- Tự lưu số đã nhập, số cho sẵn, lời giải, ghi chú, ô chọn, chế độ ghi chú, độ khó và thời gian theo từng hồ sơ. Có nút lưu ngay và lưu rồi thoát.
- Màn vào hiển thị ván đã lưu với độ khó/thời gian/số ô có số; chọn ván mới cần xác nhận thay bản lưu.
- Tạm dừng che bảng, khóa nhập/xóa/ghi chú/gợi ý và dừng đồng hồ. Chuyển ứng dụng sang nền cũng tạm dừng.
- Khôi phục kiểm tra dữ liệu và tính lại đánh dấu xung đột. Bản hoàn tất không được dùng lại để nhận thưởng hai lần. Lỗi ghi kết quả có nút thử lại.
- Xóa hồ sơ dọn bản lưu của cả hai game. Dữ liệu lưu trong trình duyệt trên thiết bị hiện tại, chưa đồng bộ giữa thiết bị.

## Kiểm thử

- TypeScript `tsc --noEmit`: đạt.
- Bộ test toàn dự án cuối cùng: **72 file, 1.032 test đạt**. Bộ riêng Ca-rô/Sudoku/catalog có 69 test đạt, gồm sáu ca biên mới của bot.
- Ca-rô có 30 thế chiến thuật gồm hai màu/bốn trục, thắng/chặn, chuỗi quá năm, chặn hai đầu, sát mép, hai đầu cùng đe dọa và bàn gần đầy. Kiểm tra thêm lượt, đi lại, replay, dữ liệu hỏng, kết quả lặp, hủy Worker và timeout.
- Sudoku kiểm tra lưu/đọc, tách hồ sơ, dữ liệu hỏng, lỗi dung lượng lưu, xung đột, bản lưu cũ sau hoàn tất và phần thưởng không lặp.
- Vite production và PWA build: đạt; bundle Worker được sinh dưới base path của dự án. Có cảnh báo sẵn về font public, mẫu CSS từ cấu hình Tailwind và chunk lớn; chưa xử lý tối ưu chung ngoài phạm vi này.
- Kiểm tra trên trình duyệt bằng hồ sơ QA: chơi Ca-rô đến thắng 9 nước; replay từ đầu/cuối; lịch sử vẫn giữ ván dở; đổi bên khi chơi lại; máy cầm X đi trước; đi lại giữ nước mở đầu của máy; phóng to, xác nhận đặt quân trên màn hình hẹp, điều khiển mũi tên + Enter.
- Sudoku: nhập số 7, ghi chú 1/7, tạm dừng ở 0:28 và xác nhận đồng hồ không tăng, 81 ô đều khóa. Lưu/thoát và tải lại toàn ứng dụng vẫn khôi phục 46/81 ô, ghi chú, ô chọn và thời gian đúng. Hủy chọn ván mới giữ nguyên bản lưu.
- Ca-rô được xem trực quan ở 360 × 800, 390 × 844, 768 × 1024 và 1366 × 768; bàn vuông, không tràn ngang, nút thao tác không phủ bàn. Điện thoại ngang cho phép cuộn dọc để thao tác.

## Đánh giá máy

Lệnh: `node scripts/benchmark-caro.mjs 50`. Kết quả thực tế trong [caro-benchmark.json](caro-benchmark.json). Mỗi cặp độ khó có 50 cặp ván đảo bên trên cùng tập khai cuộc/seed, tổng cộng 300 ván; không có nước sai hoặc ván chạm giới hạn 120 nước.

| Cặp | Thắng | Hòa | Thua | p95 mỗi nước |
|---|---:|---:|---:|---:|
| Vừa — Dễ | 96 | 0 | 4 | 5,51 ms |
| Khó — Dễ | 96 | 0 | 4 | 31,12 ms |
| Khó — Vừa | 88 | 0 | 12 | 30,36 ms |

Đây là benchmark hồi quy tăng tốc với ngân sách 5/10/30 ms, không phải Elo hay đo sức mạnh ở ngân sách chơi thật 100/350/900 ms. Chưa đo độ trễ input trên thiết bị di động tham chiếu.

## Giới hạn bằng chứng

Kiểm tra viewport được thực hiện trên trình duyệt desktop; chưa nghiệm thu vuốt/pinch trên điện thoại cảm ứng thật, trình đọc màn hình hoặc toàn bộ ván chỉ dùng bàn phím. Offline đã kiểm tra cấu trúc build/PWA, chưa thử ngắt mạng trên bản production. Chơi hai người hiện là cùng thiết bị, không có phòng online.
