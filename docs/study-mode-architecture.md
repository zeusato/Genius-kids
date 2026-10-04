# Kiến trúc Ôn Luyện

Cập nhật 01/10/2026. Kế hoạch: [study-wow-plan.md](study-wow-plan.md). Bằng chứng và giới hạn kiểm chứng: [study-wow/README.md](study-wow/README.md).

Phần Học bài cập nhật 04/10/2026 theo [study-learn-plan.md](study-learn-plan.md); [bàn giao và kiểm chứng](study-learn/README.md). Đã bật sáu lớp cho bản production theo yêu cầu hoàn thiện để xuất bản; chưa push/deploy.

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
| `/study/topic/:topicId` | TopicPage: chọn học hoặc luyện, danh sách bài và tiến độ |
| `/study/learn/:skillId?page=…` | LessonScreen / LessonReader: bài học từng trang |
| `/study/rules` | RulesBook: ghi nhớ theo lớp/chủ đề, tìm không dấu và in |

`shared.tsx` dùng Markdown/KaTeX và dựng hình. `SolutionVisual` chỉ vẽ kết quả đặt tính sau khi đã chấm. SVG nằm trong `services/generators/svg`, hình mới cần export từ `index.ts` để nằm trong whitelist của `render.ts`.

Player chặn callback finish hai lần bằng ref, không gọi callback từ state updater. Kiểm tra dùng `Date.now`, không cộng giây bằng interval. Lựa chọn/sai/đúng bị ẩn trong test; câu sắp xếp chưa tương tác không được đánh dấu đã làm chỉ vì đã xem. Mầm non bật TTS ở mỗi phiên; tắt loa chỉ có hiệu lực trong phiên đó.

## Học bài: nội dung, tiến độ và cầu nối

`services/study/lessons/manifest.ts` chứa chỉ mục nhẹ và `PUBLISHED_GRADES` (hiện gồm MN, 1–5). Production chỉ mở lớp trong danh sách; DEV mở thêm lớp nháp và gắn nhãn. Route bài học cũng kiểm `hasLesson`, không chỉ ẩn nút. `load.ts` tải lười một quyển theo lớp; sáu chunk được service worker tải trong gói core, đã kiểm mở lần đầu khi offline. Nội dung Lớp 1, 2, 4 chia thành nhóm file dưới `content/g1/`, `g2/`, `g4/`; ví dụ dùng số cố định đã biên soạn. Mầm non dẫn sang hoạt động có sẵn theo `preschool.ts`, cộng 6 bài ngắn độc lập. Các dòng kỹ năng nối hoạt động có nút Học riêng và không báo đang soạn.

`pages.ts` tạo id trang ổn định, tối đa 20 trang. Bài mầm non bỏ trang mở đầu để giữ tối đa 4 trang; phiên bản 6 bài được tăng lên 2 để đặt lại bitmask cũ. Lớp 1 và mầm non có `autoRead`. `blocks.tsx` dựng hình, công thức, ví dụ từng bước, chỗ dễ nhầm; widgets hỗ trợ đặt tính, bảng hàng, đổi đơn vị, sơ đồ đoạn thẳng và khám phá tham số. Chia hai chữ số nói rõ bước ước lượng rồi nhân kiểm tra; bảng hàng từ chối kết quả không đủ cột để biểu diễn.

`StudentProfile.learn` độc lập với `study`. Mỗi bài lưu phiên bản, bitmask trang đã xem, trang đọc dở, số câu đúng tốt nhất, ngày đạt và dấu nhận sao. `applyLesson` là phép biến đổi thuần; `persistLesson` ghi trước khi context cập nhật state. `saveLesson` dùng `saveProfilesStrict`: khi lần ghi thường và lần nén lịch sử đều thất bại, lỗi truyền về giao dịch để không báo nhận sao ảo. Reader có nút Lưu lại kết quả, giữ ba câu đã làm. `saveLesson` kiểm chủ hồ sơ bằng ref hiện tại, kể cả callback cleanup từ bài cũ sau khi đổi hồ sơ. Reader remount theo hồ sơ/kỹ năng, khôi phục trang đọc dở và báo lỗi lưu có nút thử lại.

`LessonTry` sinh 3 câu từ template đang có. Đã xem hết các trang trước Em thử và đạt ít nhất 2/3 câu (kể cả đúng sau gợi ý) thì nhận 1 sao duy nhất cho bài; đổi phiên bản hoặc học lại không nhận thêm. Học bài không thêm lịch sử kiểm tra, không sửa mastery, hàng đợi ôn, chuỗi ngày hay quay gacha.

Thẻ chủ đề và TopicSheet hiện trạng thái học; kết quả và báo cáo dẫn về bài của kỹ năng còn yếu. “Bài mới hôm nay” ưu tiên kỹ năng trong kế hoạch ôn, kèm thời lượng ước tính từ nội dung. RulesBook lấy các block `rule` trong phần `know` của bài, lọc nâng cao theo thiết lập, tìm cả tên/chủ đề/công thức và nối về bài gốc. Nút luyện trong Reader mở phiên luyện 10 câu theo cơ chế hiện có.

## Nghiệm thu khi sửa

Sửa generator phải chạy invariants và MathRacing. Sửa kế hoạch học phải kiểm mức của câu thực tế và lọc nâng cao. Sửa lưu trữ phải kiểm kích thước lịch sử. Sửa giao diện dùng `study-preview.html` và `scripts/study-shots.mjs`, thêm kiểm qua app thật khi đụng StudyPage/StudentContext. Không lấy ảnh sân thử thay cho bằng chứng lưu hồ sơ.
