# Bàn giao Ôn Luyện — 01/10/2026

Nhánh: `feat/study-wow`. Mốc trước nâng cấp: `study-before-wow`.

## Tiến độ lúc tiếp nhận

Claude đã commit GĐ0–GĐ3, kết thúc ở `8772a7d`. Giao diện GĐ4, báo cáo/in GĐ5 và đợt sửa nội dung lớp 3–5 còn ở working tree. Log bàn giao kết thúc ở bước chụp lại giao diện; chưa có script chụp ảnh hoặc bộ ảnh trong repository.

## Bản hoàn thiện

- Trang chủ dùng HubShell, chủ đề theo mạch, tiến độ từng kỹ năng, nhóm Nâng cao tách riêng, Ôn hôm nay và ôn câu sai.
- Player hỗ trợ lựa chọn, so sánh, nhiều đáp án, nhập số, gõ phím và sắp xếp bằng kéo thả/chạm. Có gợi ý, thử lại, lời giải, bàn phím, đọc đề và biến thể Mầm non.
- Kiểm tra không lộ kết quả từng câu; có lưới điều hướng, hỏi lại khi bỏ trống, tuỳ chọn bỏ đồng hồ, tự nộp theo thời gian thực.
- Kết quả có đúng/tổng theo kỹ năng, tiến bộ, luyện kỹ năng yếu và làm lại câu sai ở chế độ review. Ôn sớm không tăng bậc lịch ôn hoặc nhận thưởng xoá hàng đợi.
- Báo cáo 14 ngày, tiến độ theo mạch, 5 kỹ năng cần luyện, kỹ năng thành thạo, câu sai gần đây, 10 bài kiểm tra và in báo cáo.
- Phiếu bài tập chọn theo chủ đề/kỹ năng, mức độ, 10/20/30 câu; mặc định 3 kỹ năng yếu; bật/tắt đáp án; bản A4 hai cột, đáp án sang trang riêng. Đã bỏ jsPDF và màn cũ.
- Sửa ma trận để mức độ **của câu sinh ra** đúng 5:3:2, đủ mạch, đúng học kì; không chỉ đúng ở danh sách slot.
- Lọc câu nâng cao/khác lớp khỏi Ôn hôm nay; xử lý thiếu câu, chống trùng với phần ôn, làm sạch dữ liệu tiến độ và chỉ tăng mức khi trả lời đúng ở mức đang học.
- Giữ các sửa nội dung Claude để lại; bổ sung gợi ý M2–M3, chỉnh phân bố câu đếm lớp 1, sửa góc SVG, lời giải hình học, sơ đồ tổng–hiệu/chuyển động và đặt tính sau khi chấm.
- Câu AI kiểm tra lựa chọn trùng qua cùng bộ dựng câu; huỷ tác vụ AI không bị kết quả trả muộn đưa trở lại màn làm bài.

## Kiểm chứng

- Bộ test toàn repo: **108 file, 2.318 test đạt**. Sau đợt bổ sung hình/lời giải cuối, chạy lại generator, tiến độ, tạo phiên và MathRacing: **15 file, 997 test đạt** (có thêm kiểm hình SVG).
- Bất biến generator: **500 lượt/template**, seed cố định; không có skip chủ động. Hạng giá trị tối thiểu 10%, vị trí lựa chọn tối thiểu 15% cho các template áp dụng kiểm này.
- Kiểm cả câu sinh thực tế của ma trận: lớp 1–5 × HK1/HK2/cả năm × 10/20/30 câu. Mọi chủ đề toán tạo đủ 20 câu khác nhau.
- Lịch sử giả 30 bài không giữ SVG nặng và dưới 300 KB; giữ spec để dựng lại hình.
- Build ứng dụng và service worker thành công. Có cảnh báo chunk lớn và đường font được giải quyết lúc chạy; không phải lỗi build.
- TypeScript toàn repo còn **lỗi có sẵn ngoài Ôn Luyện** ở `modules/farm/src/ui/renderSnapshot.ts:26`: generic suy luận `object[]` thay cho `Obstacle[]`/`Bridge[]`. Không sửa module farm trong đợt này.
- Browser thực: Enter trên lựa chọn, sai lần 1/lần 2, điều hướng bằng mũi tên, lưới câu, hỏi trước nộp thiếu, tự nộp hết giờ, bật/tắt đáp án in. Đã tạo hồ sơ QA cục bộ và xác nhận bài kiểm tra lưu, xuất hiện trong báo cáo, không có lỗi console của luồng này.
- **45 ảnh** ở 1180×820, 768×1024, 390×844: trang chủ mới/có dữ liệu, lớp 1, Mầm non, các loại câu, gợi ý/lời giải, kết quả, báo cáo và phiếu. Cả 39 phép đo `scrollWidth ≤ innerWidth`; không có lỗi console trong lượt chụp cuối. Dữ liệu kiểm tại [checks.json](shots/checks.json).
- PDF mẫu đã xem cả 3 trang: 2 trang đề + 1 trang đáp án. Bằng chứng: [bộ ảnh](shots/), [phiếu mẫu](shots/worksheet.pdf), [mẫu đề tất cả chủ đề](samples-all.txt).

## Chạy lại

```powershell
node node_modules/vitest/vitest.mjs run --maxWorkers=2
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node scripts/study-dump.mjs all 5
node node_modules/vite/bin/vite.js --mode devpreview --port 5190 --host 127.0.0.1
node scripts/study-shots.mjs
```

Máy hiện tại có shim `npx` trỏ đến npm thiếu file, nên dùng trực tiếp executable trong `node_modules`. Nếu Vite bị chặn ghi `.vite-temp`, chạy với quyền filesystem phù hợp; không cần cài lại dependency.

`study-preview.html` chỉ render khi `import.meta.env.DEV`, dùng component sản phẩm với hồ sơ trong bộ nhớ, không ghi đè dữ liệu học sinh. Script dùng Chrome/Edge headless với user-data-dir riêng và xoá đúng thư mục tạm do nó tạo; không dùng profile Chrome cá nhân. Có thể đặt `CHROME_PATH` và `STUDY_URL`.

## Các lựa chọn triển khai

- Giữ ReportView/PrintView và Answers.tsx của Claude thay vì đổi tên/tách file chỉ để giống sơ đồ trong plan. Biểu đồ 14 ngày dùng HTML/CSS, không cần tải thêm Recharts cho màn này.
- Mẫu QA cố định dùng sân thử DEV để có thể tái hiện chính xác gợi ý/lời giải, ngoài kiểm luồng tích hợp qua app thật. Không có ảnh trước thay đổi trong log được cung cấp; mốc Git là nguồn đối chiếu trước nâng cấp.
- Tài liệu kiến trúc được lưu cùng repository ở [study-mode-architecture.md](../study-mode-architecture.md), thay vì ghi vào memory riêng của Claude trên máy khác.
- Chưa gọi API AI thật vì không có key kiểm thử; đã kiểm nhánh fallback/validation bằng code và kiểm giao diện khi không có key. Chưa nghiệm thu giọng đọc trên thiết bị vật lý.
- 01/10: Đại ca đã yêu cầu hợp nhất vào `main` và push lên `origin/main` sau khi nhận bàn giao.
