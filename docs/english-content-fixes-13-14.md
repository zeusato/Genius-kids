# Bàn giao mục 13–14 — A1–B4

> Review tiếp theo tìm được lỗi còn sót trong order/roles dù bộ test cũ xanh. Xem [review v4](D:/Dev/Genius-kids/docs/english-content-review-v4.md); kết quả tests dưới đây là phạm vi kiểm tra tại snapshot, không phải chứng nhận toàn bộ content.

Ngày 22/09/2026. Phạm vi: hoàn thiện mục 13, kiểm tra tích hợp mục 14; giữ các sửa của Claude ở 01–02, 07–10. Không sửa nội dung C1–C3/K đang được Gemini sinh, không mở thêm bậc trong runtime.

## 13 — Nội dung đã hoàn thiện

| Phạm vi / ID | Thay đổi |
|---|---|
| B2-s-0191–0200 | 5 cặp thói quen / hành động đang diễn ra: play tennis, read comics, eat noodles, study English, drink milk. Có tag `contrast`, ngữ cảnh tiếng Việt và thời gian rõ; prompt không chỉ định đáp án bằng tên thì. |
| B3-s-0025–0030, 0033–0038 | 4 nhóm Was/Were + trả lời có/không; 12 câu. Câu trả lời ghi rõ câu hỏi gốc, khớp đại từ; `Were you …?` trong ví dụ hỏi một người → `I was/wasn't`. |
| B4-s-0133–0144 | 6 cặp phủ định / nghi vấn với be going to; 12 câu. Giữ not/to trong cụm động từ, đảo be trước chủ ngữ khi hỏi. |
| 108 câu B2–B4 có tag `expanded-subject` | Thay đại từ bằng cụm chủ ngữ có bổ nghĩa, chứa danh từ gây nhiễu về số: `The brother of those two girls …`, `The children near the small pond …`. Viết lại câu và bản dịch, cập nhật token/span/blank/alternative. B2 khoét be để luyện tìm danh từ chính khi chia động từ. |
| 57 câu ngắn còn lại trong ledger | Đánh giá lại thành mức 1: một mệnh đề ngắn, một phép biến đổi, không có cụm chủ ngữ lồng nhau. Không dùng việc đổi nhãn để tạo nhóm khó. |
| Theory B2/B3/B4 | Liên kết ví dụ đối chiếu mới; bổ sung hỏi–đáp quá khứ be và công thức phủ định/nghi vấn going to. |

Tổng cộng **199 ID câu** được ghi trong [curriculum ledger](D:/Dev/Genius-kids/scripts/english-curriculum-review.json): 34 câu bổ sung độ phủ bằng cách thay câu cũ, 108 câu tăng độ phức tạp, 57 câu đánh giá lại mức cơ bản. Mỗi bậc vẫn đúng 200 câu, giữ nguyên hệ ID. Danh sách đầy đủ và lý do từng ID nằm trong ledger.

Difficulty B2/B3/B4 đều **80/75/45**, tức **40%/37,5%/22,5%**. Phân bố nằm gần cả mục tiêu 40/40/20 của checklist và 40/35/25 của plan. Nhãn là đánh giá biên tập, chưa phải độ khó đo từ dữ liệu học sinh. Câu mức 3 khó hơn ở đọc hiểu cụm, xếp câu và chọn trọn vai trò; không khẳng định mọi ô điền trong một câu đều khó như nhau.

Nhóm contrast vẫn dùng cơ chế khoét một token hiện có: luyện hình thái và nghĩa qua các cặp câu, chưa phải bài tự viết toàn bộ cấu trúc simple/continuous. Tám câu trả lời ngắn mới ở B3 chỉ bật POS/fill; bỏ roles/order vì câu tỉnh lược cần ngữ cảnh. Bốn câu hỏi gốc vẫn có order/roles.

### Từ vựng

| ID | Headword / POS | Dạng biến đổi và ví dụ |
|---|---|---|
| A3-v-0076 | parent, noun | parents; `A parent is at the school gate.` |
| A3-v-0101 | shoe, noun | shoes; `This shoe is new.` |
| B1-v-0080 | vegetable, noun | vegetables; `He eats fresh vegetables every day.` |
| B2-v-0084 | dish, noun | dishes; `She is washing a dish.` |
| B3-v-0099 | noodle, noun | noodles; ghi rõ thường dùng số nhiều; `He ate noodles for breakfast yesterday.` |
| B4-v-0071 | rain, verb | rains/rained/raining; giữ ví dụ `It will rain tomorrow.` |
| B4-v-0073 | snow, verb | snows/snowed/snowing; giữ ví dụ `It will snow in winter.` |

Đã đồng bộ nghĩa, IPA khi đổi headword, ví dụ và nguồn generator. Đối chiếu dạng từ/IPA với Cambridge: [parent](https://dictionary.cambridge.org/us/pronunciation/english/parent), [shoe](https://dictionary.cambridge.org/us/pronunciation/english/shoe), [dish](https://dictionary.cambridge.org/us/dictionary/english/dish), [noodle](https://dictionary.cambridge.org/us/dictionary/english/noodle); rain/snow có cách dùng động từ trong [word list của Cambridge English](https://www.cambridgeenglish.org/de/Images/396159-yle-movers-word-list-picture-book-2018.pdf). Không phải chứng nhận toàn bộ IPA của kho.

## 14 — Kết quả kiểm tra

```text
node node_modules/vitest/vitest.mjs run src/english
node scripts/english-content-handoff.mjs
node scripts/english-content.mjs validate
```

- **6 file test, 98/98 tests đạt.** Kiểm tra cả thay đổi mới lẫn hồi quy các mục 03–12.
- **21/21 file A1–B4** đạt schema, đủ số lượng, không trùng ID/câu trong cùng bậc, theory references tồn tại. Đã đọc lại các nhóm ví dụ theo section để kiểm tra chúng còn minh họa đúng mục sau khi thay câu.
- **14/14 ca tái hiện** của audit cũ đều còn bật dạng bài và được grader thật chấp nhận. Các ca đối chứng sai đều bị từ chối: đảo vô nghĩa, thiếu từ trong cụm, thiếu phủ định. Tests mới kiểm tra thêm sai hợp ngôi, nhầm dạng đơn/tiếp diễn, thiếu `to/not`, chọn thiếu phần bổ nghĩa của chủ ngữ.
- **20/20 file đầu ra generator khớp nội dung đang có**, so sánh toàn bộ trường bằng deep equality, bỏ qua thứ tự key JSON. A1 theory là file biên tập riêng, không được generator A1 sinh; đã validate riêng.
- Chín script sinh dữ liệu chạy trong harness bộ nhớ, chặn mọi lệnh ghi của generator. B1/B2 có script nền sinh vocab và script cuối sinh sentences/theory; harness so sánh kết quả cuối theo đúng thứ tự này. Không chạy script nền riêng lên dữ liệu đang được các agent sửa.
- Phát hiện bước sinh lại trước đây bỏ mất thay đổi `orderAlternatives` ở **182 câu**. Đã lưu đúng các nghiệm hiện có vào [order ledger](D:/Dev/Genius-kids/scripts/english-reviewed-order.json) và nối helper bảo toàn vào bảy generator cuối. Không sinh thêm hoán vị từ ledger này; nếu token thay đổi thì helper báo cần review lại.
- Curriculum helper cũng kiểm tra chuỗi token gốc/đích, giữ alternative tương thích và không bật lại order đã bị bỏ. Hai ledger và theory/prompt helper có kiểm tra chạy lặp không làm thay đổi kết quả.

Test 07–08 chỉ cập nhật số lượng phủ định theo dữ liệu mới: B2/B3/B4 có **29/21/20** blank rút gọn thuộc sáu cặp cần kiểm tra. Mỗi blank vẫn được gọi grader cho dạng đầy đủ, rút gọn và đối chứng thiếu phủ định. Không thay logic sửa của Claude.

| Bậc | Câu | Từ vựng |
|---|---:|---:|
| A1 | 200 | 118 |
| A2 | 200 | 105 |
| A3 | 200 | 105 |
| B1 | 200 | 111 |
| B2 | 200 | 106 |
| B3 | 200 | 106 |
| B4 | 200 | 105 |
| Tổng | **1.400** | **756** |

Snapshot gồm hash từng file, kết quả schema, ca grader và diff generator: [english-content-fixes-13-14.audit.json](D:/Dev/Genius-kids/docs/english-content-fixes-13-14.audit.json). Snapshot ổn định trong thời gian đọc; chạy lại audit nếu Gemini/Claude tiếp tục thay dữ liệu.

### Việc bàn giao cho Gemini ở ngoài phạm vi

Lệnh chuẩn `node scripts/english-content.mjs validate` **chưa đạt toàn kho**, trả exit 1 với **237 lỗi kiểm định** tại snapshot:

| File | Số lỗi | Việc cần xử lý |
|---|---:|---|
| C1.theory.json | 26 | Đúng schema theory: `label/example`, `heading/body`; các field topic/exampleIds cấp gốc đang không được schema chấp nhận. |
| C2.theory.json | 32 | Chuẩn hóa tên field formula/section; bỏ hoặc chuyển các field topic/id không được schema chấp nhận. |
| C3.theory.json | 19 | Chuẩn hóa field formula/section tương tự. |
| C3.passages.json | 105 | Đính chính khi review v4: **40 lỗi TF chữ hoa + 35 lỗi độ dài 97–102 từ + 30 lỗi trùng đoạn**. Không phải cả 105 lỗi đều do TF. Xem checklist v4 để sửa nội dung, không chỉ đổi True/False. |
| K.phrases.json | 55 | Field `topic` hiện không thuộc schema phrases. |

Không lấy kết quả từ script `validate-english-data.mjs` cũ để thay thế validator runtime: script cũ không kiểm tra đủ các ràng buộc này. Các báo cáo 07–08 trước đó ghi toàn kho đạt là kết quả của validator khác hoặc snapshot trước; không dùng làm kết luận hiện tại.

Đã hoàn thành kiểm tra/bàn giao mục 14 cho A1–B4. C1–C3/K vẫn cần review riêng sau khi Gemini sửa; việc đủ số lượng hoặc schema hợp lệ không tự mở bậc. Chưa kiểm tra toàn bộ audio/TTS và mọi đáp án đồng nghĩa; các tests không thay cho thẩm định ngôn ngữ toàn kho.
