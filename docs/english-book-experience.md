# English Garden — trải nghiệm quyển sách

Ngày: 23/09/2026. Thay thế thiết kế trang lý thuyết dài và trang chủ dạng game bằng một không gian đọc, ôn luyện và học từ vựng.

## Thiết kế

- Khung riêng của tiếng Anh: bìa sách, mục lục, ôn luyện, từ vựng, AI ra đề. Thanh điều hướng giữ trên màn hình; điện thoại hiển thị đủ năm lối vào.
- Bìa có tên người học và dấu trang để đọc tiếp. Mục lục trình bày theo ba chặng kiến thức và nhánh K; tên như “Thì hiện tại tiếp diễn” được ưu tiên, tên gợi hứng là thông tin phụ.
- Mỗi chương chia thành mở đầu, từng công thức, từng mục giải thích, các trang ví dụ (tối đa hai ví dụ), từng chỗ dễ nhầm và trang ghi nhớ. K chia chữ cái thành nhóm, giao tiếp thành bốn cụm/trang.
- Công thức cả ở trang riêng lẫn bên trong phần giải thích được trình bày bằng khối chữ lớn/đậm, tách các thành phần bằng màu; ghi chú đặt dưới công thức. `KnowledgeText.tsx` chỉ định dạng lại các mẫu trong nội dung đã duyệt, không dùng AI suy ra luật mới.
- Hỏi–đáp trong công thức và ví dụ được chia thành các dòng có nhãn “Câu hỏi”, “Trả lời đồng ý (Yes)”, “Trả lời phủ định (No)” hoặc “Câu trả lời”. Mỗi cặp hội thoại có nhóm riêng; không ghép câu trả lời của câu hỏi tiếp theo vào câu trước. Các công thức nối bằng `|` và ví dụ xuống dòng cũng được tách riêng.
- URL giữ vị trí `?page=...`; nút trước/sau, danh sách trang và bộ chọn chương là những cách điều hướng tương đương. Có tiêu đề và thông tin tiến độ cho từng chương, đánh dấu đã đọc rõ ràng; không coi đọc xong là thành thạo.
- Bàn ôn luyện truy cập trực tiếp, gồm luyện tập, ôn đến hạn, kiểm tra và AI; giữ bài đang làm và lịch sử kết quả.
- Trạng thái ngoại tuyến, tệp bài đã lưu và ghi chú giọng đọc nằm gọn ở chân trang, sau nội dung học; không chiếm khoảng trống phía trên bài.
- Từ điển: tìm cả từ/nghĩa/ví dụ, lọc loại từ, nghe từ/câu, xem biến thể động từ/danh từ và lưu từ.
- Thẻ ghi nhớ: chọn bộ từ trong chương, bộ đã lưu hoặc bộ cần ôn; đổi hướng Anh–Việt/Việt–Anh; tự nhớ trước khi lật, rồi tự đánh giá. Có thể tạo bài luyện nghĩa/đánh vần từ bộ từ đã lưu (cần ít nhất năm nguồn phù hợp).
- AI: chọn kiến thức, dạng nội dung, 3/5 mục, độ khó, bối cảnh; tạo bản nháp, đọc toàn bộ câu hỏi/đáp án/phân tích, duyệt, mở bài luyện năm câu. Bài này ưu tiên AI đã duyệt của đúng hồ sơ/chủ đề/dạng; thiếu thì bổ sung seed. Bài kiểm tra và placement tiếp tục loại AI.

Các quyết định chia nhỏ thông tin tham khảo [Progressive Disclosure của NN/g](https://www.nngroup.com/articles/progressive-disclosure/); thẻ nhớ có bước tự trả lời và xem phản hồi tham khảo [Retrieval Practice](https://www.retrievalpractice.org/summary). Đây là lựa chọn thiết kế cho module, không phải tuyên bố đã đo hiệu quả học tập của giao diện.

## Code và dữ liệu

- `BookExperience.tsx`: khung, bìa, mục lục, trang đọc, bàn ôn luyện.
- `book.ts`: ánh xạ nội dung đã duyệt thành trang, không sửa corpus.
- `LessonParts.tsx`: âm thanh, phân tích câu và widget đổi đại từ dùng chung với bài tập.
- `dialogue.ts`, `KnowledgeText.tsx`: nhận diện ký hiệu hỏi–đáp đã có trong dữ liệu trước khi tô màu công thức; giữ nguyên lựa chọn động từ như `Am / Is / Are` và `do/does`.
- `VocabularyLab.tsx`: tra từ, bộ từ và thẻ nhớ; bài luyện dùng engine/lưu phiên hiện có.
- `library.ts`, `useLibrary.ts`: IndexedDB `genius-english-library-v1`, khóa `[studentId,id]`; dấu trang, trang đã đọc có phiên bản nội dung, và trạng thái từng từ độc lập. Xóa hồ sơ dọn cả kho này. Không thay đổi điểm, sao hay mastery khi tự đánh dấu.
- `ParentContent.tsx`, `ai.ts`, `aiPractice.ts`: luồng soạn → duyệt → tạo phiên luyện. Dùng Gemini client và cài đặt hiện có; không gửi hồ sơ/lịch sử học vào prompt. Giới hạn, cách ly, hủy và chống lẫn hồ sơ giữ nguyên.
- `book.css`: kiểu chữ, màu giấy, gáy sách, bố cục co giãn; không cần thư viện lật sách hay canvas để đọc nội dung.

## Font tiếng Việt

Tiêu đề dùng Noto Serif có subset Latin và Vietnamese, cả normal/italic, đóng gói local WOFF2 kèm OFL. Nội dung dùng Nunito có subset tiếng Việt đã có trong dự án. Không dùng Georgia cho tiêu đề tiếng Việt: tránh chữ có dấu rơi sang font dự phòng gây lệch nét và khoảng cách. Bốn file Noto Serif tổng khoảng 118 KB, được PWA gom vào nhóm core theo quy tắc WOFF2 hiện có.

## Kiểm chứng

- **167 test pass / 11 file**: English, quy tắc tải PWA và hub catalog. Bổ sung kiểm tra phân trang giữ đủ nội dung, cô lập/xóa dữ liệu đọc theo hồ sơ, AI ưu tiên mục đã duyệt, không dùng mục chưa duyệt, request Gemini theo tùy chọn và hủy trước khi lưu.
- Production build thành công; cả bốn font Noto Serif dùng đúng base path `/Genius-kids/` và có trong precache của service worker.
- Kiểm tra trên trình duyệt: mục lục có tên kiến thức, dấu trang B2 quay lại đúng trang công thức, đánh dấu đã đọc, lưu năm từ, học trọn năm thẻ và hoàn thành phiên luyện nghĩa **5/5, +1 sao**, kết quả đã lưu.
- Kiểm tra chữ thường/chữ nghiêng tiếng Việt trên mục lục sau sửa font; phần công thức Yes/No A1; trang đọc ở 390 px và giao diện AI ở 320 px không tràn ngang.
- Bản sửa hỏi–đáp: 10 test đạt (`dialogue.test.ts`, `book.test.ts`), gồm các ký hiệu A1/A3/B1/B2/B3, hai câu hỏi riêng trong cùng ví dụ và trường hợp không phải hội thoại. Kiểm tra trực tiếp A1 trên desktop/390 px và ghép đúng từng cặp hỏi–đáp B1 trên trình duyệt.
- API Gemini được kiểm tra bằng phản hồi mô phỏng trong test; không gọi dịch vụ thật hoặc dùng khóa của người dùng để thử.
- TypeScript toàn dự án còn lỗi sẵn có `modules/farm/src/ui/renderSnapshot.ts:26` (`object[]` không khớp `Obstacle[]`).

Lệnh kiểm tra: `node node_modules/vitest/vitest.mjs run src/english pwa/download.test.ts src/components/hub/catalog.test.ts`; `node node_modules/vite/bin/vite.js build`; `node node_modules/typescript/bin/tsc --noEmit --pretty false`.
