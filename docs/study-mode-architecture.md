# Kiến trúc Ôn Luyện

Cập nhật 01/10/2026. Kế hoạch: [study-wow-plan.md](study-wow-plan.md). Bằng chứng và giới hạn kiểm chứng: [study-wow/README.md](study-wow/README.md).

## Nội dung và phiên học

`services/study/catalog.ts` khai báo kỹ năng, lớp, chủ đề, học kì, mức M1–M3, nhãn nâng cao và nhãn phép tính. `services/generators/templates.ts` tập hợp template; `registry.ts` đăng ký chúng và giữ wrapper legacy cho luyện gõ. Các tên hàm generator cũ vẫn được export cho MathRacing.

`kit.ts` dựng câu, lựa chọn và gắn metadata; ngẫu nhiên dùng `generatorRandom`, không đổi `Math.random` toàn cục. Gợi ý riêng của template được ưu tiên, thiếu thì dùng gợi ý theo kỹ năng từ `study/hints.ts`. `value.ts` chịu trách nhiệm định dạng SGK, đọc số và so sánh giá trị. `grading.ts` là điểm chấm chung.

`session.ts` sinh các slot kỹ năng/mức, kiểm hợp lệ, chống trùng cả hình và báo `shortBy`. `picks` phải cộng đúng số câu yêu cầu; `excludeKeys` dùng khi ghép phần ôn vào daily. Ma trận phân phối theo mạch và mức đồng thời, chỉ chọn skill hỗ trợ mức đã phân. Kiểm lại **câu sinh ra** bằng `session.test.ts` để tránh fallback sang mức gần nhất làm lệch ma trận.

## Tiến độ và lưu trữ

`StudentProfile.study` chứa skills, review, days, streak, dailyDone, prefs. `readStudyProgress` làm sạch số hữu hạn, mức hợp lệ, ngày và hàng đợi. `applySession` thuần, nhận thời gian để test; không mutate dữ liệu đầu vào.

- Mastery: `m += 0.25 * (s - m)`; đúng lần đầu = 1, đúng sau thử lại = 0.5, sai = 0.
- Hai câu đúng liên tiếp **ở mức hiện tại** mới lên mức; sai hạ xuống một mức hợp lệ.
- Câu sai lưu bản gọn, hạn 1 ngày. Đúng trong review khi đã đến hạn tăng bậc 3/7/14 ngày rồi xoá; làm sớm không tăng bậc. Khoá review gốc được truyền theo id câu trong `PlaySession.reviewKeys`.
- Daily chỉ dùng câu ôn đúng lớp, không nâng cao. Phiên 6/8/10 câu tuỳ lớp; phần ôn tối đa 40%. Kỹ năng nâng cao không góp vào mastery chủ đề hay đề ma trận.
- `rewards.ts` tính sao, rồi StudyPage xử lý gacha và gọi `addTestResult(..., study)` để lưu kết quả/tiến độ cùng giao dịch ở lớp ứng dụng.
- `compact.ts` bỏ `visualSvg`, giữ `visual`; giải thích tối đa 300 ký tự, tối đa 6 bước. Giữ chi tiết 50 bài gần nhất; khi hết dung lượng giảm xuống 10 bài.

## Giao diện và route

`StudyPage.tsx` quản lý phiên, kết quả và phiếu in trong bộ nhớ; reload hoặc vào thẳng màn con không có phiên sẽ về `/study`.

| Route | Component |
|---|---|
| `/study` | StudyHome, TopicSheet, CustomDialog, MatrixDialog |
| `/study/play` | Player, AnswerArea |
| `/study/test` | Chuyển tới play khi còn phiên; nếu không về trang chủ |
| `/study/result` | ResultView |
| `/study/report` | ReportView |
| `/study/print` | PrintView |

`shared.tsx` dùng Markdown/KaTeX và dựng hình. `SolutionVisual` chỉ vẽ kết quả đặt tính sau khi đã chấm. SVG nằm trong `services/generators/svg`, hình mới cần export từ `index.ts` để nằm trong whitelist của `render.ts`.

Player chặn callback finish hai lần bằng ref, không gọi callback từ state updater. Kiểm tra dùng `Date.now`, không cộng giây bằng interval. Lựa chọn/sai/đúng bị ẩn trong test; câu sắp xếp chưa tương tác không được đánh dấu đã làm chỉ vì đã xem. Mầm non bật TTS ở mỗi phiên; tắt loa chỉ có hiệu lực trong phiên đó.

## Nghiệm thu khi sửa

Sửa generator phải chạy invariants và MathRacing. Sửa kế hoạch học phải kiểm mức của câu thực tế và lọc nâng cao. Sửa lưu trữ phải kiểm kích thước lịch sử. Sửa giao diện dùng `study-preview.html` và `scripts/study-shots.mjs`, thêm kiểm qua app thật khi đụng StudyPage/StudentContext. Không lấy ảnh sân thử thay cho bằng chứng lưu hồ sơ.
