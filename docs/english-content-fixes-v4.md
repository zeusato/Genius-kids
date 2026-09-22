# Bàn giao sửa content v4

Ngày hoàn tất: **23/09/2026**. Đã xử lý R01–R13 của [review v4](D:/Dev/Genius-kids/docs/english-content-review-v4.md), gồm lỗi còn sót A1–B4 và phần C1–C3/K. Giữ nguyên ID và số lượng; không mở thêm bậc trong runtime.

## Kết quả kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Validator thật của importer/build | **33 file, 0 lỗi**; trước sửa là 237 lỗi |
| Bộ test English | **7 file, 120 test pass**, gồm 22 ca hồi quy v4 |
| Tái sinh trong bộ nhớ | **32/32 file khớp live** qua 13 generator; theory A1 là file tĩnh |
| Build production | **Pass**, có cảnh báo font, CSS minify, import/chunk size trong output build |
| Passage C3 | **40 nội dung khác nhau**, đều 60–90 từ; 35 đoạn mới dài 65–73 từ |
| Vocab C3 | **105/105 mục có đoạn nguồn**, lưu bằng tag `passage:C3-p-…` |
| C1/C2 | Không còn token nhiều từ hoặc prompt chỉ định một đáp án trực tiếp trong nhóm đã rà |
| Roles đang bật | Không còn thiếu token hoặc nhiều mục tiêu cùng vai trò trong cùng mệnh đề theo audit |

Bằng chứng sau sửa: [english-content-fixes-v4.audit.json](D:/Dev/Genius-kids/docs/english-content-fixes-v4.audit.json). Snapshot trước sửa được giữ riêng trong `english-content-review-v4.audit.json`.

## Những gì đã sửa

| Mục | Kết quả |
|---|---|
| R01 | Xóa 8 nghiệm tách sai `right now`; grader nhận cả cụm đưa lên đầu và từ chối `Now … right`. Sửa quy tắc cũ, ledger và chữ hoa trong các nghiệm được nêu. |
| R02 | Đồng bộ 66 prompt phủ định với việc chấp nhận dạng đầy đủ/rút gọn; sửa nguồn tạo prompt và test cũ đang yêu cầu mâu thuẫn. |
| R03 | Tắt roles ở 37 câu B1 và 35 câu C1 có mục tiêu trùng trong cùng mệnh đề; giữ các bài khác. Không đổi grader để chấp nhận lựa chọn thiếu rõ ràng. |
| R04 | Sửa cụm động từ có `up/not`, trọn chủ ngữ ở C1-s-0194, local role giới từ, linking be, last/next. Tắt roles thêm 6 câu C1 ngoài whitelist/khó biểu diễn; tổng 41 câu C1 không bật roles. |
| R05 | Tách 13 token nhiều từ C2, cập nhật chỉ số và blank một từ; tắt POS cho 13 câu dùng cụm giới từ phức tạp. Sửa conjunction before/until, not, New Year's Day và bản dịch. |
| R06 | C1 điền theo nghĩa câu hỏi tiếng Việt. C2 có 194 prompt chọn trong nhóm 4 từ và 13 prompt hoàn thành một thành phần của cụm giới từ; thứ tự lựa chọn thay đổi. Có alt phù hợp ngữ cảnh, không nhận `inside` trong cụm thời gian. |
| R07 | Viết lại C3-p-0006–0040, bỏ vòng lặp 5 mẫu và phần đuôi chung; thay toàn bộ glossary placeholder. MCQ có bằng chứng cụ thể trong đoạn, TF đúng định dạng, short hỏi chi tiết riêng. Rà 5 đoạn đầu, sửa số lọ/mỗi học sinh ở p0002 và bổ sung alt p0003/p0004. |
| R08 | Sửa `reached school`, tidy/neat, likes/enjoys và các cặp đồng nghĩa được nêu; thay ví dụ đưa trạng ngữ lên đầu kém tự nhiên. Viết lại chỉ dẫn biến đổi câu, thêm các cách rút gọn hợp lệ khác. Vẫn đủ 200 rewrite và tỷ lệ 35/35/35/35/30/30. |
| R09 | Chuẩn hóa ba theory; sửa ngoại lệ câu hỏi chủ ngữ, between/during, ví dụ và ID tham chiếu. C3 có 3 section, phân biệt biến đổi khẳng định/phủ định với giữ nghĩa; không dùng passage/rewrite ID làm sentence ID. |
| R10 | Sửa POS/ví dụ/headword/bản dịch vocab được nêu; nối toàn bộ vocab C3 với các đoạn mới. Ví dụ since dùng cụm danh từ và quá khứ đơn, không cần present perfect. |
| R11 | K phrase qua schema; sửa ví dụ thiếu mạo từ/cách nói gượng, ví dụ xoài/dâu/dưa hấu vẫn chứa đúng headword. Đồng bộ câu phrase và audioHint; bóng đá khớp hình ⚽. Giữ Hello!/Goodbye! như ngoại lệ lời chào ngắn. |
| R12 | Thay các conditional B4, modal/passive/past continuous ngoài phạm vi được nêu bằng cấu trúc đã học; giữ ID. C1 bổ sung 37 câu với chủ ngữ mở rộng thật và rà lại câu cơ bản. Difficulty C1 **80/77/43**, C2 **80/79/48**; là đánh giá biên tập, chưa phải độ khó đo từ học sinh. |
| R13 | Gắn lớp sửa cuối vào 13 generator; giữ các nghiệm C1/C2 đã duyệt; loại hai annotation B4 hết hiệu lực khỏi ledger cũ. Thêm test phản ví dụ qua `grade()` thật và kiểm tra toàn bộ 32 output tái sinh. |

Số lượng sau sửa: **1.807 câu; 1.197 vocab; 10 theory; 40 passage; 200 rewrite; 55 phrase K**. A1–B4 và C1 vẫn 200 câu/bậc; C2 giữ 207 câu.

## Nguồn sửa và cách duy trì

- [english-c3-passages-reviewed.mjs](D:/Dev/Genius-kids/scripts/english-c3-passages-reviewed.mjs): nguồn biên tập riêng cho 35 đoạn mới, bản dịch, câu hỏi và glossary.
- [english-content-review-v4.json](D:/Dev/Genius-kids/scripts/english-content-review-v4.json): các trường đã sửa theo file/ID; không phải bản sao toàn bộ corpus.
- [english-content-review-v4.mjs](D:/Dev/Genius-kids/scripts/english-content-review-v4.mjs): lớp sửa cuối dùng chung; bảo vệ câu nguồn thay đổi bằng kiểm tra `expectedEn` trước khi áp dụng.
- [fix-english-content-v4.mjs](D:/Dev/Genius-kids/scripts/fix-english-content-v4.mjs): quy trình sửa có kiểm tra schema và phát hiện file bị sửa đồng thời trước khi ghi. Đây là script biên tập cho tập ID hiện tại, không phải bộ sửa tiếng Anh tự động cho mọi nội dung mới.
- [content-fixes-v4.test.mjs](D:/Dev/Genius-kids/src/english/content-fixes-v4.test.mjs): test chấm đúng/sai, whitelist, token, C3/K và tái sinh.

Generator áp dụng các ledger trước rồi lớp v4 cuối. Khi thay nội dung những ID đã duyệt, cập nhật nguồn sửa tương ứng và chạy kiểm tra; không chạy lại script biên tập cũ để ghi đè nội dung mới chưa đối chiếu. Sửa theory mới cũng cần cập nhật lớp v4 vì các theory C1–C3 được chuẩn hóa tại đó.

Các lệnh kiểm tra:

```powershell
node scripts/english-content.mjs validate
node node_modules/vitest/vitest.mjs run src/english
node scripts/audit-english-content-v4.mjs --after-fixes
node node_modules/vite/bin/vite.js build
```

## Giới hạn kiểm chứng

Các lỗi trong checklist đã được xử lý và có hồi quy phù hợp. Runtime hiện vẫn chỉ công bố A1; chưa tuyên bố C1–C3/K đã chạy đủ luồng UI. Với short answer C3, kiểm tra hiện tại là cấu trúc và danh sách đáp án, vì chưa có grader C3 trong runtime. Audio/IPA toàn bộ corpus chưa được nghe hoặc kiểm chứng riêng. Các giới hạn này không bị che bằng việc test hoặc validator xanh.
