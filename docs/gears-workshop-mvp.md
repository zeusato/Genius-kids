# Kỹ Sư Máy Móc — bản chơi thử Xưởng Sáng Chế

Ngày 10/09/2026. Đã triển khai 6 nhiệm vụ mẫu, mỗi nhiệm vụ có 3 mức khó. Bản này dùng để đánh giá vòng chơi trước khi mở rộng chiến dịch 24 bài và xưởng tự do trong kế hoạch gốc.

## Chạy bản thử

- Chạy Vite tại cổng 3000, mở `/Genius-kids/gears-preview.html`.
- Trang preview dùng hồ sơ trong bộ nhớ: tải lại trang sẽ làm mới tiến độ thử, không ảnh hưởng hồ sơ thật.
- Trong ứng dụng, vào **Trò chơi → Kỹ Sư Máy Móc → Lắp Bánh Răng / Đoán Chiều Quay**. Hai đường vào dùng chung xưởng; nhánh Đoán ưu tiên bài tàu.
- Liên kết `edition=classic` và nút **Mở bản cũ** vẫn mở hoạt động cũ.
- Preview chỉ khởi tạo trong chế độ phát triển, không đưa vào service-worker cache.

## Nội dung đang chơi được

| Máy | Việc cần làm | Khác biệt theo độ khó |
| --- | --- | --- |
| Quạt mây | Lắp chuỗi bánh răng, theo dõi đổi chiều | Tăng số trục cần nối và thêm cỡ bánh gây nhiễu |
| Bơm mầm xanh | Nối chuyển động qua khe nước | Bớt bánh có sẵn, đổi yêu cầu chiều, siết ngân sách |
| Tàu tí hon | Dự đoán rồi chạy máy | Chuỗi dài hơn, phải dự đoán thêm bánh giữa |
| Cầu cầu vồng | Tháo các đường truyền gây kẹt | Một vòng lỗi → thêm đai xung đột → thêm một vòng lỗi |
| Vườn gió | Vận hành đồng thời hai đầu ra | Tự lắp thêm nhánh, đổi đai, dùng đúng số linh kiện |
| Đồng hồ sao | Chọn bánh đầu ra để đạt chiều và tốc độ | ×1 → ×2 → hai đầu ra ×2 và ×1 |

Cả sáu bài mở sẵn trong bản thử để thử được nhiều kiểu chơi. Ba bài dùng dây đai có nút đổi yêu cầu chiều; đây là hai biến thể đã kiểm chứng, chưa phải kho đề vô hạn.

## Luật và tương tác

- Chọn linh kiện rồi chạm trục, hoặc kéo linh kiện tới trục. Vị trí cố định không bị thay đổi.
- Bánh ăn khớp đảo chiều; đai thẳng giữ chiều, đai chéo đảo chiều; tỉ lệ tốc độ dựa trên số răng.
- Thay bánh đầu ra mới đổi tỉ lệ tốc độ toàn tuyến; không giả định bánh trung gian làm đổi tỉ lệ khi hai đầu giữ nguyên.
- Kiểm tra kho, số linh kiện, chồng lấn, cổng puli, độ dài và dây trùng trước khi chấp nhận thao tác. Thao tác sai không mất linh kiện.
- **Chạy thử** khóa chỉnh sửa và hiển thị chuyển động; **Dừng để sửa** mở lại đúng thiết kế đang có. Một đồng hồ vẽ chung giữ các bánh đồng bộ.
- Thắng cần đạt mọi đầu ra, chiều, tốc độ nếu có, ngân sách và không kẹt. Chạy thử không bị trừ sao.
- 1 sao cho máy đạt yêu cầu, 1 sao khi dùng không quá số linh kiện chuẩn, 1 sao cho dự đoán đúng các bánh được hỏi. Bài chế tạo hỏi bánh trung gian để tránh chép chiều đầu ra đã có trên phiếu.
- Có hoàn tác/làm lại, khởi động lại cùng bài, ba tầng gợi ý, đọc nhiệm vụ tiếng Việt, xem chậm và giảm chuyển động.
- Dây ngắn có nút chọn riêng, không bị vùng bấm bánh răng che. Màn hình nhỏ cho cuộn riêng bàn lắp, mục tiêu luôn có ở trên bàn.

## Lưu dữ liệu và giới hạn

- Dùng lại `engine/graph.ts` và `engine/simulate.ts`; bổ sung luật nhiệm vụ và giao diện trong `workshop/`.
- Bản thiết kế đang làm lưu theo hồ sơ. Kết quả được kiểm chứng lại từ bố cục và nhiệm vụ chuẩn trước khi thưởng.
- Mỗi máy tối đa 3 sao trong hồ sơ, tổng 18 sao. Chơi lại hoặc đổi độ khó không cộng lặp; nâng thành tích chỉ nhận phần chênh lệch.
- Ghi dữ liệu lỗi thì giữ bản thiết kế và cho thử lưu lại. Không cập nhật số sao trong bộ nhớ trước khi ghi hồ sơ thành công.
- Hình robot, sáu cỗ máy và bánh răng được vẽ bằng SVG; không có phụ thuộc vào ảnh sinh từ dịch vụ ngoài.
- Chưa có chiến dịch 24 bài, màn đặt trục tự do, hệ bánh đồng trục nhiều tầng hoặc generator đề mở rộng. Chưa có dữ liệu chơi thử với trẻ để xác nhận độ hấp dẫn/thời lượng.

## Kiểm chứng

- 84 kiểm thử qua: engine bánh răng hiện có, lời giải mọi bài/độ khó/biến thể, ràng buộc linh kiện, kẹt máy, hai đầu ra, tỉ số tốc độ, dự đoán, lưu sao và đường vào từ hub.
- Đã chơi thử qua giao diện: quạt, bơm nối sai rồi sửa đai, tàu dự đoán, cầu mức khó, vườn thiếu một nhánh rồi hoàn thiện, đồng hồ sai tốc độ rồi thay bánh.
- Đã kiểm tra hoàn tác/làm lại, trở về xưởng và tiếp tục thiết kế, hướng dẫn trên viewport 390×844; trang không tràn ngang, bàn lắp cuộn trong vùng riêng.
- Lệnh kiểm thử: `node node_modules/vitest/vitest.mjs run games/GearsGame src/components/hub/catalog.test.ts --maxWorkers=2`.
- Lệnh kiểm tra kiểu: `node node_modules/typescript/bin/tsc --noEmit --pretty false`.
- Lệnh đóng gói: `node node_modules/vite/bin/vite.js build --logLevel warn`.
