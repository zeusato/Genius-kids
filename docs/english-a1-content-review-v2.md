# Review A1 — vòng 2 — 2026-09-22

**Kết luận: đủ số lượng, chưa nghiệm thu nội dung.** Đã đọc 200 câu, 118 mục từ và trang lý thuyết hiện tại; chạy kiểm tra cấu trúc trên toàn bộ dữ liệu. Lượt này không sửa JSON, generator hoặc validator.

## Đã đạt / đã sửa

- 200 Sentence và 118 Vocab; không phát hiện trùng ID hoặc trùng en trong từng loại.
- Quota theo nhãn: 45 khẳng định / 45 phủ định / 45 câu hỏi / 20 trả lời ngắn / 45 chỉ định. Nhóm trả lời ngắn còn lỗi phân loại bên dưới.
- Độ khó 1/2/3 là 75/80/45 = 37,5%/40%/22,5%, đã gần mục tiêu; không cần ép tỷ lệ tuyệt đối bằng kiến thức ngoài bậc.
- Typecheck theo schema trong plan đạt; token tái tạo đúng en; blank index/answer, lemma/feature bắt buộc, chỉ số/span và multiset token của các alternative đã khai báo đều qua kiểm tra.
- Khoảng trắng dấu câu và role của `not` đã sửa. 20 câu đáp lời đã bỏ `pos`/`roles`, còn `fill`/`order`; có ngữ cảnh hỏi–đáp trong promptVi.
- Có 11 câu khai báo orderAlternatives, gồm hai trường hợp được chỉ ra ở vòng 1.
- Theory đã sửa mẹo “single” và định nghĩa chủ ngữ. Các IPA bị chỉ ra như smart, student, nurse đã đổi sang dạng Anh-Mỹ; chưa đối chiếu độc lập toàn bộ 118 IPA với từ điển, nên không coi đây là chứng nhận phát âm đầy đủ.
- Validator trong repo báo PASS cả ba file; không phát hiện các lỗi ngữ nghĩa/tham chiếu dưới đây.

## 1. P1 — Theory trỏ nhầm ví dụ sau khi đánh lại ID

File câu đã dựng lại từ đầu: `A1-s-0002` trước đây là `I am a student.`, nay là `You are kind.`. Generator cấp ID theo thứ tự mảng, nhưng theory còn nhiều ID cũ. Tham chiếu vẫn tồn tại nên validator không báo lỗi.

- Section 3 — Yes/No/trả lời ngắn: `0021`, `0031`–`0034` hiện lần lượt là `I am eight years old.`, `The weather is warm today.`, `I am happy today.`, `We are excited now.`, `Nam is a good pupil.`. Cả 5 đều không phải câu hỏi hoặc trả lời ngắn.
- Section 4 — This/That/These/Those: `0039`–`0042` chỉ có một câu dùng Those; ba câu còn lại không minh hoạ các từ chỉ định còn thiếu.
- Section 2 — khẳng/phủ/hỏi: bốn exampleIds hiện đều là khẳng định.

**Sửa theo ID hiện tại:** Section 2 dùng `0011,0046,0057,0091`; Section 3 dùng `0091,0136,0137,0092,0138,0139`; Section 4 dùng `0156,0157,0158,0159`. Rà các section còn lại theo nghĩa. Giữ ID ổn định từ vòng này và đồng bộ nguồn generator để chạy lại không làm mất sửa đổi.

Vị trí chính: `src/data/english/A1.theory.json:60` và exampleIds các sections 2–4.

## 2. P1 — Xếp câu vẫn thiếu nghiệm đúng

Đã kiểm tra các alternative sau có cùng multiset token, giữ nghĩa, nhưng chưa được khai báo:

| ID | Alternative còn thiếu |
|---|---|
| A1-s-0072 | After work those young workers aren't tired. |
| A1-s-0074 | Right now her kind grandmother isn't at home. |
| A1-s-0189 | Right now those five noisy dogs aren't outside. |

Grader theo plan sẽ không nhận những câu này nếu chỉ so với en/alternative đã khai báo. Thêm nghiệm đã duyệt hoặc tắt `order` ở câu chưa kiểm soát được trật tự. Đây là các lỗi đã xác nhận, không phải danh sách đầy đủ mọi nghiệm có thể có của 200 câu.

## 3. P2 — Sáu câu đầy đủ bị tính là câu trả lời ngắn

`A1-s-0150`–`0155` thuộc `be-short-answer` nhưng là `Yes, he is a doctor.`, `No, he is not a teacher.`, `Yes, she is very kind.`, `No, she is not angry.`, `Yes, they are our friends.`, `No, they are not our teachers.`

Câu đúng tiếng Anh nhưng không đo kỹ năng lược bỏ bổ ngữ. Hiện chỉ có **14 câu trả lời ngắn đúng nhóm**, không phải 20.

**Sửa giữ nguyên số lượng:** thay sáu item này bằng `No, he is not.`, `No, she is not.`, `No, it is not.`, `No, we are not.`, `No, they are not.`, `No, you are not.` với ngữ cảnh, token, blank và alt cập nhật đúng. Đây là dạng động từ không rút gọn nhưng vẫn là câu trả lời ngắn; không trùng en với 14 item hiện có. Hoặc chuyển nhóm và bù câu ngắn mới. Không đánh lại toàn bộ ID.

## 4. P2 — Còn kiến thức ngoài phạm vi A1

- `0106`–`0112`, `0181`–`0184`: Who/How/How old/What thuộc nhóm Wh-question C1 trong plan, trong khi theory A1 chỉ dạy đảo be cho Yes/No.
- `0194`: `youngest`, so sánh nhất ngoài phạm vi A1 đã chốt.
- `0200`: `Nam's friend`, sở hữu cách ở A3, hiện vẫn bật phân tích và xếp câu.
- Nhiều câu khó có cụm giới từ, định ngữ dài và từ như extremely, retired, talented. Chúng không mặc nhiên sai tiếng Anh, nhưng chưa phù hợp để kiểm tra cấu trúc mà lý thuyết A1 chưa hỗ trợ.

Thay/chuyển câu vượt bậc và bù câu đúng A1 để giữ ≥200. Nếu giữ một cụm giao tiếp quen thuộc làm ví dụ mở rộng thì không dùng nó để kiểm tra kiến thức mới chưa dạy. Không ngầm mở rộng chương trình qua dữ liệu chỉ để đạt quota.

## 5. P2 — Vai trò của always chưa nhất quán

`0130`, `0195` gán `always` là adverb/modifier và gom vào complement (`always ready`, `always on time`). Quy ước trong plan dành trạng từ tần suất cho `adverbial`; đây khác vai trò bổ nghĩa mức độ của `very` trong `very kind`.

Nếu giữ câu ở bậc phù hợp, tách `always` thành adverb/adverbial và span adverbial; complement là `ready` hoặc `on time`. Nếu thay câu do vượt phạm vi thì không giữ annotation cũ.

## 6. P2 — Bài chỉ định chưa kiểm tra đủ gần/xa

Cả **200 ô trống đều khoét động từ**, gồm toàn bộ 45 item demonstratives. Bé làm đúng bằng is/are chưa chứng minh biết chọn this/that/these/those theo gần/xa và số lượng. Bài xếp câu được cho sẵn từ chỉ định cũng chưa đo đủ phần này.

Trong nhóm demonstratives cần thêm blank khoét chính từ chỉ định, promptVi nêu rõ gần/xa và số lượng để đáp án duy nhất. Ví dụ `This is a pen.` với yêu cầu “Điền từ chỉ một vật ở gần người nói”. Catalog mastery phải chọn đúng bài đo kỹ năng, không chỉ đếm grammarPoint.

## 7. P3 — Ảnh và một số bản dịch

- `A1-v-0081` desk đã đổi emoji ghế sang laptop 💻, vẫn không phải bàn học. Dùng asset đúng hoặc bỏ image, được phép ở A1.
- School/classroom cùng emoji: bộ chọn bài nối không đưa cả hai vào cùng lượt.
- `A1-v-0097`: “Bà là bà của tôi” → “Đó là bà của tôi”.
- `A1-s-0080`: bright green nói về sắc xanh tươi, không phải chiếc bảng “sáng sủa”.

## Checklist sửa tiếp

1. Sửa liên kết theory theo nghĩa câu, giữ ID và đồng bộ generator với JSON.
2. Bổ sung alternative đã nêu hoặc tắt order; rà tương tự các trạng ngữ còn lại.
3. Thay sáu câu ngắn sai nhóm và các câu vượt A1; giữ tổng số lượng/quota đúng nội dung.
4. Sửa always, thêm bài phân biệt từ chỉ định và sửa ảnh desk.
5. Kiểm lại toàn bộ thư viện, gồm ý nghĩa của ví dụ theory; không chỉ dựa PASS của validator.

## Phiên bản dữ liệu đã review

SHA-256:

- Sentence: `3174b47349eab64cfb29fa06d6007e09da66faa65ebce105ede225d140afc1a1`
- Vocab: `b9ffe5e8ef22ba3e55c7c5ee7a859e6833d575663018f4410daef0926dc7738c`
- Theory: `36ecfdff59744836365b72f26fdb97e593f001db145f046677fb857f5b254c97`
