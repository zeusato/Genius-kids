# Đảo số — kế hoạch và nghiệm thu

Phạm vi được Đại ca giao: tự thiết kế, triển khai toàn bộ phần Số đếm; không chờ duyệt plan. Ngày 16/09/2026.

## Sản phẩm

- Giữ năm URL learn/count/pick/add/compare và điều hướng PreschoolShell.
- Khám phá 1–10: mười kịch bản riêng — kéo mây, tưới hoa, chọc bóng, đếm lá, cho cá ăn, gõ trứng, nối sao, xây tháp, tô bướm và phóng tên lửa. Đếm đủ giữ thành quả, chỉ bấm Tập tô số mới sang khung nét; sau tập tô nhận sticker. Có đường bàn phím được ghi là có trợ giúp. Chi tiết: [nghiệm thu mười kịch bản](qa/counting/learning-stories.md).
- Vườn thu hoạch: chuyển từng vật vào giỏ rồi tìm số lượng; chung dãy 1–10, sáu câu/phiên, không chia phạm vi nhỏ.
- Bến thuyền âm thanh: nghe số rồi chọn thuyền mang số đó. Chỉ mở chấm sau audio thành công; có nghe thử, nghe lại và retry. Audio số tiếng Việt dùng MP3 local sẵn có.
- Tiệm bánh phép cộng: hai khay hiện riêng, bé gộp rồi đếm tổng; phép cộng không vượt 10, có khay trống. Sáu câu/phiên.
- Sân chơi so sánh: đủ số lượng/nhiều ít, số lớn nhỏ, dài ngắn, cao thấp, to nhỏ và bằng nhau ngay trong phiên mới. Đổi chiều yêu cầu giữa các phiên; không giấu loại bài sau mức độ. Sáu câu/phiên.
- Menu minh họa hành động, tiến độ theo kỹ năng và số, ôn nội dung cần luyện, chọn riêng số. Theo cập nhật của Đại ca: bỏ bộ chọn 1–3/1–5/1–10; các phiên mới dùng chung 1–10. Phiên cũ đang dở vẫn giữ nguyên để chơi tiếp. 1–20 hoặc số tròn chục đến 100 là hướng mở rộng sau.
- Tông đồ chơi gỗ/giấy, màu kem/sage, các cảnh SVG riêng; tái dùng minh họa vật WebP đã có, không dùng emoji làm tài nguyên chính. Khám phá đổi bố cục/chủ đề theo số.

## Điều kiện bắt buộc

1. Tự đọc hướng dẫn; demo hình đủ để trẻ chưa biết đọc hiểu bước thao tác. Nhạc nền tạm tắt và giữ preference.
2. Audio kết thúc/lỗi/hủy phân biệt; không chấm khi chưa nghe; không cắt phản hồi bằng timer cố định. Đổi trang/ẩn tab hủy audio, trở lại cần tiếp tục rõ ràng.
3. Sai hai lần có trợ giúp thực sự; có trợ giúp không tính độc lập. Không phạt sao cũ.
4. Phiên có owner/session/round ID; checkpoint sau mỗi hành động; resume sau reload; lưu lỗi giữ payload và cho retry; thưởng một lần, kết quả quà không đổi khi retry.
5. Tiến độ mỗi kỹ năng/số; thành thạo cần ba lần độc lập ở ít nhất hai phiên; lựa chọn ưu tiên nội dung cần ôn, không khóa số.
6. Chuột/touch/keyboard; vùng bấm >=44px; không phụ thuộc kéo; tập tô hỗ trợ pointer capture/cancel. 320/390/768/1366, landscape, reduced motion.
7. Test model tất cả mức/số qua nhiều seed, checkpoint/dedupe/save failure/owner, audio error/cancel, tracing; kiểm thử trình duyệt năm luồng và hồi quy menu khác; TypeScript và production build.
8. Ghi QA thực tế, không đánh PASS những phần chưa chạy. Không deploy hoặc xóa thay đổi khác.

## Thứ tự thực hiện

1. Model/data, lưu checkpoint/progress/reward và audio có kết quả rõ ràng.
2. Cảnh/đồ vật/menu và demo hướng dẫn; cả năm hoạt động.
3. Tích hợp hồ sơ, âm nhạc, tracing và resume/retry.
4. Test logic và lỗi; QA browser desktop/mobile; sửa lỗi phát hiện.
5. Build/PWA, cập nhật QA và bàn giao preview.

Trạng thái: đã triển khai cả năm hoạt động và nghiệm thu các luồng chính. Chi tiết kiểm thử, ảnh thực tế và giới hạn bằng chứng: [QA report](qa/counting/qa-report.md).
