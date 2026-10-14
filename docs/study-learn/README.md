# Bàn giao Học bài — cập nhật 04/10/2026

Đã hoàn tất GĐ6–10 và lượt rà soát cuối theo yêu cầu mới **“kiểm tra lại phần cuối, hoàn thiện để xuất bản”**. `PUBLISHED_GRADES` đã bật MN và Lớp 1–5. Build production cục bộ thành công, luồng học/lưu/offline đã kiểm trên app thật. **Chưa push hoặc deploy**; bản trên website chưa được thay đổi bởi lượt này.

## Nội dung đã có

| Lớp | Số bài | Trạng thái |
|---|---:|---|
| Mầm non | 6 + cầu nối hoạt động có sẵn | Đã mở production, tối đa 4 trang |
| Lớp 1 | 32 | Soạn mới, tự đọc to, câu ngắn |
| Lớp 2 | 32 | Soạn mới |
| Lớp 3 | 39 | Kế thừa và chạy lại kiểm chuẩn |
| Lớp 4 | 42 | Soạn mới, chia hai chữ số và đo góc |
| Lớp 5 | 37 | Kế thừa và chạy lại kiểm chuẩn |
| Tổng | **188** | **106 bài mới trong lượt tiếp nối** |

[Dàn bài từng kỹ năng](../study-learn-plan.md#15-dàn-bài-lớp-4-lớp-1-lớp-2--bản-nháp-hoàn-tất) ghi dạng bài, mức Em thử, hình/thao tác và ghi nhớ. [Mẫu template](samples/) là đầu vào đối chiếu khi biên soạn; [mẫu rà soát 20 bài](content-review.md) ghi seed, bài được chọn và kết quả.

GĐ6 gồm chip trạng thái trên thẻ chủ đề, trạng thái/link học trong hộp chọn kỹ năng, nút học lại từ kết quả/báo cáo, gợi ý bài mới kèm thời lượng, sổ tay tìm kiếm không dấu và in. Đã nối lại phần Claude để dở, kiểm tra route và lưu hồ sơ thật.

Các sửa sau rà soát: chặn callback lưu cũ khi đổi hồ sơ; đọc tiếp đúng trang; xử lý lỗi tải/lưu; chặn truy cập trực tiếp bài nháp trong production; không gợi ý bài nâng cao khi đang ẩn; sửa hình chữ nhật Lớp 1; bổ sung trước/sau/ở giữa cho bài vị trí mầm non; hiển thị tích/trừ khi chia đầy đủ; kiểm số dư thập phân; ngăn bảng hàng cắt mất chữ số; sửa tương phản nút và nội dung bản in sổ tay.

## Kiểm chứng

- Toàn repo ngày 04/10: **119 file, 3715 test đạt**, gồm generator invariants và MathRacing. Kiểm chuẩn 188 bài gồm cấu trúc, độ dài, phép tính/ký hiệu, hình, widget, mức template, Em thử và độ phủ catalog.
- Build Vite production thành công, tạo service worker với 1767 mục. [Ghi nhận build/test/typecheck](release/validation.json).
- Luồng **production/offline**: service worker tải sẵn đủ 6 quyển; mở bài chưa từng đọc và sổ tay khi ngắt mạng; mầm non nối hoạt động thật; hết dung lượng không ghi sao ảo; lưu lại kết quả, học lại, học → luyện, reload giữ tiến độ; 4 cỡ màn không tràn ngang. Không có ngoại lệ JavaScript. [Kết quả](release/checks.json), [ảnh production 320](release/rules-320.png).
- Luồng Chromium dùng `StudentProvider`, `StudyPage` thật trong hồ sơ tạm: đúng sau gợi ý, hoàn thành nhận đúng 1 sao, học lại không thưởng, reload giữ tiến độ, đổi hồ sơ chặn lần lưu cũ, học → luyện 10 câu, tìm không dấu và mở bài từ sổ tay. [Kết quả](integration-checks.json).
- Bộ ảnh nền ngày 03/10 (khi còn nhãn nháp): 28 màn × 4 cỡ **1180 / 768 / 390 / 320**, kiểm tràn ngang và lỗi console; thêm trạng thái trả lời và bản in. [Đo kích thước](shots/checks.json), [sổ tay PDF](shots/rules.pdf), [phiếu luyện PDF](shots/worksheet.pdf). Ảnh production mới nằm trong `release/`.
- `tsc --noEmit` còn lỗi nền có từ trước ở `modules/farm/src/ui/renderSnapshot.ts:26`: `object[]` không gán được cho `Obstacle[]`. Không có lỗi TypeScript mới trong phần Học bài.

Ảnh tiêu biểu: [trang chủ đề 320](shots/topic-320.png), [bài Lớp 1 320](shots/lesson-g1-320.png), [đo góc 390](shots/lesson-g4-390.png), [bảng hàng 1180](shots/lesson-place-1180.png), [sổ tay 320](shots/rules-320.png), [bản in sổ tay](shots/rules-print-1180.png).

## Xem và chạy lại

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5190 --strictPort
```

Mở `http://127.0.0.1:5190/Genius-kids/`, chọn hồ sơ/lớp rồi vào Ôn Luyện → chủ đề → Học bài. Cả sáu lớp đã mở nên không còn nhãn Bản nháp. Duyệt nhanh một bài qua `/Genius-kids/study-preview.html?case=lesson-know&lesson=g4.div` hoặc chọn `case=topic`, `rules`, `lesson-g1`, `lesson-g2`, `lesson-g4`, `lesson-g5`.

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node scripts/study-learn-check.mjs
node scripts/study-shots.mjs --learn
```

Hai script trình duyệt cần Chromium/Chrome và Vite đang chạy. Script ảnh hỗ trợ `CHROME_PATH`, `STUDY_URL`; script tích hợp dùng localhost cổng 5190. Cả hai tạo hồ sơ Chromium riêng, không dùng hồ sơ trình duyệt thật. `case=integration` chỉ là fixture DEV, tạo hai hồ sơ thử khi localStorage trống; dùng script trong hồ sơ tạm để chạy nó. Các case preview thông thường lưu thử trong bộ nhớ.

Kiểm bản xuất bản (server preview chạy ở một terminal riêng):

```powershell
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5191 --strictPort
# Terminal khác:
node scripts/study-release-check.mjs
```

Script production mở app bình thường, chọn hồ sơ qua giao diện và dùng service worker thật. Hồ sơ Chromium biệt lập; giả lập mất mạng và lỗi dung lượng không đụng dữ liệu của người dùng.

## Sửa trong lượt chuẩn bị xuất bản

- Đóng cả bốn mục template ở phần 13: chia M1 có phần thập phân; chia M2 có nhánh thương chứa 0; đề chia phần gạo rõ nghĩa; làm chung quy đồng theo mẫu chung nhỏ nhất và rút gọn.
- `saveProfilesStrict` dùng riêng cho giao dịch Học bài: báo lỗi nếu cả ghi thường và ghi sau nén đều thất bại. Nút Lưu lại kết quả giữ kết quả ba câu; chỉ cập nhật sao khi ghi thành công.
- Dòng kỹ năng mầm non nối hoạt động có nút Học và nhãn đúng, không báo bài đang soạn.
- Bật đủ sáu lớp, kiểm bản build production và reload offline.

## Giới hạn và bước xuất bản

Kiểm nội dung là tự rà sau biên soạn cùng bộ kiểm chuẩn tự động; chưa có lượt duyệt sư phạm của người thứ hai. Chưa nghe thử TTS trên thiết bị thật hoặc nghiệm thu cảm ứng Android. Build còn cảnh báo chung về chunk lớn, dynamic/static import của updateService, đường font xử lý lúc chạy và một candidate CSS từ regex trong cấu hình; không ngăn build. Font HubNunito và bố cục đã hiện đúng trong ảnh production. Lỗi TypeScript nền farm vẫn là ngoại lệ đã cho phép trong plan, không thuộc thay đổi Học bài.

Thay đổi chuẩn bị xuất bản nằm trên nhánh `feat/study-learn`. Theo quy trình repo, chủ dự án đưa lên `main` để GitHub Actions build/deploy; lượt này chưa kích hoạt bước đó. Cấu trúc và cách lưu xem [tài liệu kiến trúc](../study-mode-architecture.md).
