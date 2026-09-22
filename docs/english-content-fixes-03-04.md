# Hoàn thành mục 03–04: annotation B2–B4

Ngày 22/09/2026. Phạm vi: 599 câu trong B2/B3/B4, trừ `B4-s-0027` thuộc mục 01 do Claude sửa. Không đổi câu tiếng Anh, bản dịch, blank, alternative, ID, vocab hoặc theory. Không sửa nội dung C1 trở đi.

**Cập nhật sau mục 05–06:** đã tách `am not`, cập nhật ledger và bật lại POS/roles cho `B2-s-0061`–`B2-s-0070`. B2 hiện có 186 câu bật roles, 199 câu bật pos. Các thống kê còn lại bên dưới ghi nhận thời điểm hoàn thành mục 03–04. Xem [bàn giao mục 05–06](D:/Dev/Genius-kids/docs/english-content-fixes-05-06.md).

## Kết quả

- Sửa `roleSpans` thành cả cụm danh từ, cụm giới từ, nhóm động từ; bao gồm determiner, tính từ, `not`, và `to` trong `be going to`.
- Tách bổ ngữ khỏi thời gian ở B3; sửa bổ ngữ sau `become`, bổ sung `late/lonely/cold/warm/free` ở B4.
- Sửa local role `prep`/`prep-object`, `to` nguyên mẫu thành particle, `last/next` bổ nghĩa danh từ thành adjective/modifier, và feature quá khứ của động từ nối `was/were`.
- Bỏ `roles` khi câu có nhiều cụm cùng vai trò mà UI không xác định mục tiêu, hoặc cấu trúc phức chưa được mô hình hóa chắc chắn. Không gộp nhiều trạng ngữ độc lập thành một đáp án giả.
- Tạm bỏ thêm `pos` ở các cấu trúc chưa duyệt chắc: `B2-s-0044`, `B3-s-0129`, `B4-s-0050/0072/0126/0128`, và 10 câu `am not` chưa tách token. Các dạng khác giữ theo whitelist hiện có.

| Bậc | Số câu giữ nguyên | Câu còn bật roles | Câu còn bật pos |
|---|---:|---:|---:|
| B2 | 200 | 176 | 189 |
| B3 | 200 | 177 | 199 |
| B4 | 200 | 170 | 196 |

Số B4 bao gồm `B4-s-0027` hiện tại do Claude sửa. Việc bỏ một dạng bài không xóa câu khỏi kho 200 câu.

## Generator và chỉnh sửa tiếp theo

- `scripts/english-annotations-b2-b4.json` lưu bản annotation biên tập cho từng ID, chuỗi token đã duyệt, token patch và lý do tắt dạng bài. Đây là quyết định cho corpus hiện tại, không phải bộ phân tích ngữ pháp tổng quát.
- `scripts/english-reviewed-annotations.mjs` áp dụng bản duyệt trước khi ba generator thêm câu vào đầu ra. Helper clone dữ liệu, chỉ sửa annotation/whitelist, không bật lại dạng bài đã bị bỏ ở nguồn.
- Thay câu hoặc tách token phải sửa cả entry tương ứng trong ledger. Helper sẽ báo lỗi khi chuỗi token lệch, tránh dùng index cũ để chấm câu mới. Nếu chỉ đổi bản dịch/prompt/hint/alternative thì không cần đổi ledger.
- Khi đổi POS/role/feature ở generator, kiểm tra cả token patch tương ứng trong ledger để bản duyệt cũ không ghi đè quyết định mới.
- **Mục 05 đã hoàn thành ở lượt tiếp theo:** `B2-s-0061`–`B2-s-0070` đã tách `am`/`not`, cập nhật ledger, blank/span/index và bật lại POS/roles sau khi duyệt.
- `B4-s-0027` không có entry và helper giữ nguyên hoàn toàn để tránh chồng phạm vi mục 01.

## Kiểm tra

Lệnh:

```text
node node_modules/vitest/vitest.mjs run src/english/annotations-b2-b4.test.mjs src/english/english.test.ts
```

Kết quả: **2 file, 46 tests đạt**. Bao gồm gọi grader với cụm đúng và cụm thiếu từ; tách complement/time; phủ định; POS/feature; mọi câu còn bật roles trong phạm vi phủ đủ token nội dung, không span chồng nhau, không giới từ đứng một mình và không nhiều mục tiêu cùng vai trò; helper không đổi dữ liệu ngoài phạm vi, áp dụng lặp không đổi, từ chối token sequence cũ. Chạy cả ba generator trong sandbox bộ nhớ, chặn ghi file, đối chiếu tokens/spans/whitelist với JSON hiện tại.

Validator riêng cả ba file sentences: **đạt, 0 lỗi**. `node scripts/english-content.mjs validate` toàn kho vẫn chưa đạt do các file mới: `C1.theory.json`, `C2.theory.json`, `C3.theory.json`, `C3.passages.json` (schema, đáp án TF, wordCount và đoạn trùng). Đây là kết quả kiểm tra tại thời điểm này, không phải review đầy đủ C1–C3; Gemini vẫn đang làm.

Không đồng nghĩa nghiệm thu toàn kho: các mục 07–14 của fix-list tiếp tục xử lý riêng; mục 05–06 đã có báo cáo riêng.

Tham khảo cách dùng adjective của [next](https://dictionary.cambridge.org/us/grammar/british-grammar/next) và [last](https://dictionary.cambridge.org/us/dictionary/essential-british-english/last?q=last_1).
