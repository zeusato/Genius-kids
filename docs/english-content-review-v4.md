# Review content tiếng Anh v4 — kiểm tra sau sửa và phần C1–C3/K

**Cập nhật 23/09/2026: đã sửa R01–R13.** Validator còn 0 lỗi, 120 test English pass, 32 file tái sinh khớp live. Kết quả và giới hạn kiểm chứng tại [bàn giao v4](D:/Dev/Genius-kids/docs/english-content-fixes-v4.md).

Phần dưới giữ các phát hiện của snapshot review ngày 22/09/2026 để đối chiếu trước/sau. Các số lỗi và câu ví dụ “hiện tại” trong phần lịch sử này mô tả dữ liệu **trước sửa**; trạng thái hoàn thành nằm trong bàn giao v4.

## Phạm vi, bằng chứng và kết quả

- Kiểm tra 33 file JSON, 1.807 câu, 1.197 mục từ vựng, 10 trang lý thuyết; thêm 40 passage, 200 rewrite và 55 phrase K.
- Đọc nội dung C1/C2, 200 rewrite, các passage riêng biệt và nhóm lặp, từ vựng C1–C3/K, phrase K. Rà lại các nhóm sửa A1–B4 bằng hồi quy, annotation, nghiệm xếp câu và gọi grader thật. Không tuyên bố đã biên tập lại từng câu A1–B4 từ đầu hoặc kiểm chứng audio/IPA toàn bộ.
- `node node_modules/vitest/vitest.mjs run src/english`: **6 file, 98 test pass**. Các test hiện tại chưa phủ những phản ví dụ dưới đây.
- `node scripts/english-content.mjs validate`: **exit 1, 237 lỗi kiểm định**. Lỗi kiểm định không đồng nghĩa 237 câu sai; một file có thể chứa nhiều loại lỗi.
- `node scripts/english-content-handoff.mjs`: 20 file A1–B4 do generator sinh khớp dữ liệu hiện tại; theory A1 là file tĩnh. Khớp generator chỉ chứng minh tái tạo được, không chứng minh nội dung đúng.
- Bằng chứng và danh sách ID: [audit v4](D:/Dev/Genius-kids/docs/english-content-review-v4.audit.json). Chạy lại bằng [audit-english-content-v4.mjs](D:/Dev/Genius-kids/scripts/audit-english-content-v4.mjs). Script chỉ đọc content và ghi báo cáo; `exit 0` của script không phải chứng nhận đạt.
- Audit ghi SHA-256 và kiểm tra file không đổi trong lượt chạy. Nếu Gemini/Claude sửa sau thời điểm audit, đọc lại file hiện tại trước khi áp dụng checklist.

| Phạm vi | Câu | Vocab | Dữ liệu khác | Kết quả kiểm định |
|---|---:|---:|---|---|
| A1–B4 | 1.400 | 756 | 7 theory | 21 file đạt cấu trúc; còn lỗi R01–R03, R12 |
| C1 | 200 | 105 | 1 theory | Theory: 26 lỗi |
| C2 | 207 | 105 | 1 theory | Theory: 32 lỗi |
| C3 | — | 105 | 40 passage, 200 rewrite, 1 theory | Theory: 19; passage: 105 lỗi |
| K | — | 126 | 55 phrase | Phrase: 55 lỗi do trường `topic` |

105 lỗi passage gồm **40 đáp án TF sai cách viết hoa, 35 đoạn quá dài, 30 đoạn trùng nội dung**. Báo cáo bàn giao 13–14 trước đó quy cả 105 lỗi về TF là chưa chính xác; đã đính chính.

### Tình trạng checklist v3

| Mục cũ | Kết quả rà lại |
|---|---|
| 01–06 | Các ca sửa và hồi quy hiện tại đạt; vẫn cần rà phạm vi giáo trình theo R12 |
| 07 | **Mở lại**: chấp nhận 8 nghiệm tách sai `right now`, gồm 7 câu A1–B4 và 1 C1; R01 |
| 08 | **Mở lại**: 66 prompt yêu cầu dạng rút gọn nhưng nhận dạng đầy đủ; R02 |
| 09–10 | Các sửa lemma/feature/cụm động từ đã qua hồi quy; phát hiện thêm bài roles B1 không rõ mục tiêu, R03 |
| 11–13 | Các sửa lý thuyết, biên tập và độ phủ đã qua hồi quy; không có nghĩa mọi nội dung trong bậc đều được duyệt |
| 14 | Kiểm tra tích hợp đã chạy; **chưa thể chốt nghiệm thu** vì các phát hiện mới |

## Cách giao sửa

Giữ nguyên ID, sửa cả dữ liệu và nguồn sinh/ledger tương ứng. Mỗi lần thay câu phải đồng bộ EN/VI, tokens, indices, roleSpans, blanks, alternatives, exerciseTypes và theory tham chiếu. Không chạy toàn bộ generator ghi đè dữ liệu đang được người khác sửa. Đánh dấu từng mục sau khi có kết quả kiểm tra cụ thể.

Ưu tiên R01–R06 cho bài câu; R07 trước R10 đối với C3; R09/R11 để đóng lỗi cấu trúc; cuối cùng R12–R13. Không mở bậc mới chỉ vì validator xanh.

## R01 — P1: Nghiệm xếp câu tách sai `right now` — mở lại mục 07

- [x] Xóa 8 nghiệm sai, bổ sung nghiệm đưa **cả cụm** `Right now` lên đầu khi tự nhiên; sửa quy tắc sinh và ledger lưu nghiệm.

ID: `A1-s-0074`, `A1-s-0189`, `B2-s-0177`, `B2-s-0181`, `B2-s-0185`, `B2-s-0190`, `B4-s-0164`, `C1-s-0164`.

Ví dụ `She is swimming right now.` đang nhận `Now she is swimming right.`. **Grader thật nhận cả 8 nghiệm sai**. Nghiệm đúng `Right now she is swimming.` bị từ chối; toàn nhóm chỉ hai câu A1 nhận nghiệm đúng đưa cả cụm lên đầu.

Nguồn lỗi: quy tắc chuyển trạng từ cuối câu trong `scripts/apply-fix-07-08.mjs` nhận riêng `now` trước khi bảo vệ cụm `right now`; kiểm tra cả `scripts/test-order-alts.mjs`. Bảy nghiệm A1–B4 còn nằm trong `scripts/english-reviewed-order.json`, nên sửa JSON câu đơn lẻ chưa đủ.

**Xong khi:** gọi `grade()` từ chối cả 8 nghiệm sai, nhận các nghiệm đúng đã duyệt; generator không phục hồi lỗi. Test phải kiểm tra ngữ pháp của nghiệm cụ thể, không chỉ việc dùng đủ bộ token. Biên tập thêm chữ hoa giữa câu trong alternatives B1-s-0190–0193 (`Sometimes She/...`) và `mr. Brown` ở B3-s-0120.

## R02 — P2: Prompt rút gọn mâu thuẫn đáp án — mở lại mục 08

- [x] Sửa **66 câu**: B2 có 29, B3 có 17, B4 có 20. Danh sách đầy đủ ở `levels.*.contractedOnlyPromptWithFullAlt` trong audit.

`B2-s-0071` yêu cầu “dạng phủ định viết tắt” nhưng grader nhận `is not`. Chọn một hợp đồng rõ ràng: ưu tiên prompt yêu cầu dạng phủ định và chấp nhận cả hai dạng theo mục 08 cũ; nếu thật sự luyện rút gọn, prompt phải nói rõ và không nhận dạng đầy đủ.

**Xong khi:** prompt, answer, alt và tests thống nhất. Sửa test cũ đang chấp nhận tổ hợp mâu thuẫn này; không tự động thêm full form vào mọi bài yêu cầu rút gọn.

## R03 — P1: Bài chọn vai trò không phân biệt được mục tiêu

- [x] Xử lý **37 câu B1 và 35 câu C1** có nhiều span cùng vai trò trong cùng mệnh đề. Danh sách: `levels.B1.repeatedRoleTargets`, `levels.C1.repeatedRoleTargets`.

`B1-s-0030`: `He swims in the pool on Saturday.` có hai trạng ngữ `in the pool` và `on Saturday`. Bài yêu cầu chọn trạng ngữ không chỉ rõ cụm nào; grader nhắm span đầu và từ chối cả span thứ hai lẫn tổ hợp hai span.

Tương tự `C1-s-0038`: `Where`/`yesterday`; `C1-s-0104`: `you`/`that present`; `C1-s-0106`: `you`/`science`. UI có phân biệt mệnh đề khi cần, nhưng điều đó không giải quyết nhiều cụm cùng vai trò **trong cùng mệnh đề**.

**Đích sửa theo schema hiện có:** bỏ `roles` cho các trường hợp không có mục tiêu duy nhất. Nếu muốn hỗ trợ dạng bài này, cần thiết kế hợp đồng câu hỏi/đáp án riêng; không gộp các cụm độc lập thành một span chỉ để làm grader xanh.

**Xong khi:** mọi bài roles được bật có yêu cầu đủ rõ để người học chọn đáp án; kiểm tra phản ví dụ với grader thật, gồm cả hai trạng ngữ và hai tân ngữ.

## R04 — P1: Annotation và whitelist roles C1

- [x] Rà 11 câu có token chưa được bao phủ: `0004, 0010, 0062, 0068, 0125, 0129, 0152, 0171, 0187, 0194, 0195` của C1-s. Chi tiết token nằm trong `levels.C1.roleGaps`.
- [x] Sửa cụm động từ thiếu thành phần: `0068` → `do get up`; `0125` → `did not call`; `0129` → `will not come`; `0195` → `do wake up`. Grader hiện từ chối các lựa chọn đầy đủ này.
- [x] `0194`: chủ ngữ cần bao gồm `the girl wearing pink shoes`; hiện chỉ có `the girl`. Hoặc thay câu đơn giản hơn phù hợp phạm vi.
- [x] `0152` là existential `there`: tắt roles theo whitelist của plan. Với các cấu trúc infinitive/giới từ cuối câu ở `0004/0010/0062/0171/0187`, phân tích có chủ đích hoặc tắt roles; không tự vá span bằng cách gom mọi token còn thiếu.
- [x] Sửa **40 token giới từ** có local role `adverbial` thay vì `prep`, và rà local role của danh từ đi sau. Cả cụm có thể là trạng ngữ, nhưng nhãn token vẫn phải theo hợp đồng plan. Danh sách: `prepLocalRoleCandidates`.
- [x] `0053, 0054, 0105, 0127, 0149, 0155`: linking `be` quá khứ đang mang `aux-past`; đổi thành feature quá khứ của động từ chính theo schema.
- [x] `0054, 0112, 0131, 0155, 0160, 0190`: `last/next` trước danh từ không được gán adverb chỉ vì cả cụm chỉ thời gian; dùng cách phân tích adjective/determiner đã thống nhất trong plan.

**Xong khi:** không còn câu bật roles với thành phần bị bỏ sót hoặc mục tiêu mơ hồ; các cụm đầy đủ đúng được grader nhận. `C1-s-0183` có `parked` trong bị động nhưng gán feature quá khứ: xử lý cùng R12, không giả lập participle bằng nhãn quá khứ.

## R05 — P1: Token/POS và biên tập C2

- [x] Tách **13 token nhiều từ**: `0038–0044` có `in front of`; `0045–0047, 0050` có `next to`; `0134–0135` có `out of`. Hợp đồng hiện tại là một từ mỗi token. Cập nhật toàn bộ chỉ số liên quan và giữ blank một token; chọn mục tiêu khoét phù hợp thay vì âm thầm đổi schema.
- [x] `C2-s-0126`: `until it closed`, `until` là conjunction. `C2-s-0149`: `before you walk...`, `before` là conjunction. Không gán preposition chỉ theo danh sách từ.
- [x] `0015, 0043, 0093, 0122, 0172, 0173, 0196`: `not` đang là particle; thống nhất adverb theo hợp đồng hiện tại.
- [x] `C2-s-0100`: `New Year Day` → `New Year's Day`; đồng bộ token/blank/span nếu có.
- [x] `C2-s-0185`: `...or teacher will be angry` → `...or the teacher will be angry`.
- [x] `C2-s-0030`: `damp fallen leaves` dịch thành “lá rụng ẩm”, không phải “tán lá khô ẩm ướt”; `0162` sửa “đóng gói cặp sách” thành cách nói tự nhiên về xếp đồ vào cặp.

C2 đã tắt roles cho 207 câu; đây không phải lỗi cần bật lại. Với POS của các thành phần trong cụm giới từ phức tạp, chọn whitelist bài phù hợp nếu schema hiện tại không biểu diễn rõ.

**Xong khi:** không còn token nhiều từ, bài POS không dạy sai loại từ, chỉ số/alternatives vẫn hợp lệ. Tham khảo [Cambridge: until](https://dictionary.cambridge.org/dictionary/english/until), [before](https://dictionary.cambridge.org/dictionary/english/before?q=before_1), [New Year's Day](https://dictionary.cambridge.org/us/dictionary/english/new-year-s-day).

## R06 — P1: 374 prompt C1/C2 chép sẵn đáp án

- [x] Viết lại **182/200 prompt C1 và 192/207 prompt C2** chứa nguyên đáp án. Danh sách `levels.C1.promptCopiesAnswer` / `levels.C2.promptCopiesAnswer`.

Ví dụ `C1-s-0002`, `C1-s-0016`: “Điền What…”; `C2-s-0005`: “Điền in.” Bài kiểm tra biến thành chép lại từ được cho sẵn. Chuyển sang yêu cầu theo nghĩa/ngữ cảnh; gợi ý đáp án trực tiếp chỉ xuất hiện ở bước hint nếu sản phẩm có hỗ trợ.

Không chỉ xóa từ tiếng Anh trong prompt: cần kiểm tra câu có nhiều đáp án đúng. `C2-s-0045` mô tả vị trí bên cạnh bàn, nhưng grader nhận `next to` và từ chối `beside`. Sau khi tách token ở R05, thiết kế lại blank và ngữ cảnh/alt tương ứng. `what/which` cũng cần ngữ cảnh đủ phân biệt hoặc chấp nhận lựa chọn hợp lý.

**Xong khi:** người học phải suy nghĩ mới trả lời được, nhưng không bị chấm sai vì một cách diễn đạt đúng khác. Bộ lọc này chỉ áp dụng cho C1/C2 trong audit; không dùng số 0 ở bậc khác để kết luận đã kiểm tra toàn bộ prompt.

## R07 — P1: Viết lại 35 passage C3, không chỉ sửa JSON

- [x] Giữ ID, viết lại `C3-p-0006–0040` thành **35 đoạn khác nhau thực sự**. Hiện 40 hàng chỉ có **10 nội dung tiếng Anh riêng biệt**.

Năm mẫu dolphin/cooking/sports/autumn/clock được lặp mỗi mẫu 7 lần: `0006/0011/.../0036`, `0007/0012/.../0037`, `0008/0013/.../0038`, `0009/0014/.../0039`, `0010/0015/.../0040`. Cả 35 đoạn dài **97–102 từ**, vượt 60–90; cùng gắn phần đuôi “Every student in our group...” bất kể chuyện ban đầu nói về ai.

- [x] Viết câu hỏi gắn với từng đoạn: 35 MCQ hỏi “nhân vật hoặc sự kiện chính” nhưng đáp án có thể là `nine o'clock`, địa điểm hoặc `ago`; 35 short question cùng hỏi nơi ghi suy nghĩ và cùng trả lời `study notebooks`; TF chung chung quy cảm xúc cho mọi người dù đoạn không chứng minh.
- [x] Thay **140 glossary placeholder** như “thuộc chủ đề sea/home/sports...” bằng nghĩa tiếng Việt thực của từng từ trong ngữ cảnh.
- [x] Dịch đầy đủ, tự nhiên. Mẫu `0006` bỏ câu không quên chuyến đi; `0007` bỏ niềm tự hào nấu ăn; `0008` bỏ đội thắng cúp; `0009` bỏ cốm/đèn ông sao; `0010` bỏ chim/du khách. Các bản lặp kế thừa lỗi tương ứng.
- [x] Chuẩn hóa **40 TF answer thành chuỗi `"true"`/`"false"`**, không phải boolean. Plan trước đây ghi `True/False`, trái validator: đây là lỗi hợp đồng trong plan, đã sửa plan trong lượt review này. Không quy toàn bộ lỗi này cho Gemini.
- [x] Rà 5 đoạn đầu dù không phải viết lại toàn bộ: `C3-p-0003` cần nhận cụm đúng từ đoạn `inside a cozy tree hollow`; `0004` cần xử lý câu trả lời `everyone is reading quietly and attentively`. Hiện answer/alt thiếu hai cách trả lời này theo phép so khớp chuẩn hóa.

Nguồn cần sửa: vòng lặp 5 theme và đuôi chung trong `scripts/build-c3-full.mjs`; trường `shortA` riêng của theme chưa được dùng đúng. Không tạo 35 biến thể chỉ đổi tên/tựa đề.

**Xong khi:** 40 đoạn riêng biệt, mỗi đoạn 60–90 từ, 3–5 câu hỏi có ít nhất một MCQ 4 lựa chọn, một TF, một short; 3–6 glossary dịch đúng; bản dịch đủ ý. Kiểm tra các câu hỏi có đáp án suy ra được từ đúng đoạn. Kiểm tra short ở đây là đối chiếu dữ liệu answer/alt; **chưa có grader C3 trong runtime để tuyên bố đã test UI/chấm thật**.

## R08 — P1/P2: Rewrite C3 sai ngữ pháp, lệch nghĩa và lộ đáp án

- [x] **P1 — `C3-r-0155`**: `They arrived at six.` → `They reached at six.` sai vì `reach` với nghĩa đến nơi cần tân ngữ chỉ đích đến. Có thể đổi cả cặp thành `They arrived at school at six.` → `They reached school at six.`. Cập nhật các alt liên quan. [Cambridge: reach](https://dictionary.cambridge.org/dictionary/english/reach).
- [x] `0151`: tidy → clean không bảo toàn nghĩa ngăn nắp; dùng `neat` trong ngữ cảnh phù hợp. `0160`: loves → likes làm giảm mức độ. `0142/0150/0154`: rà lại mức độ và nghĩa cụ thể của easy/simple, interesting/fascinating, strong/powerful; chọn câu có từ thay thế rõ ràng hơn. [Cambridge: tidy](https://dictionary.cambridge.org/us/dictionary/english/tidy).
- [x] `0178` (`Early they arrived...`), `0182` (`On time we finished...`): đổi sang ví dụ đảo vị trí trạng ngữ tự nhiên hơn cho trẻ. `0187`: đưa `Happily` ra đầu dễ chuyển nghĩa sang “may thay”; rà mục tiêu bảo toàn nghĩa. Không gọi mọi câu trạng ngữ đầu câu là sai ngữ pháp.
- [x] `0085` chép nguyên câu đích trong prompt; nhóm contraction `0106–0140` thường cho cả dạng nguồn lẫn đích. Chỉ yêu cầu rút gọn cấu trúc cần luyện, tránh đọc sẵn kết quả. Việc cho từ đồng nghĩa bắt buộc ở nhóm synonym vẫn phù hợp plan.

**Xong khi:** 200 rewrite vẫn đủ 6 dạng (35/35/35/35/30/30), đáp án đúng và alt hợp lệ. Chỉ bắt buộc giữ nghĩa với dạng bài có mục tiêu đó; affirmative ↔ negative có chủ đích thay đổi ý khẳng định, không được mô tả là giữ nguyên nghĩa.

## R09 — P1: Ba theory sai schema và có giải thích sai

- [x] C1/C2/C3: chuyển formula `name/examples` về `label/example`; section `title/content` về `heading/body`; bỏ trường không hỗ trợ theo schema thực tế trong `src/english/validation.mjs`.
- [x] Sau khi sửa tên trường, sửa tiếp `id`: đang là `theory-C1`/`theory-C2`/`theory-C3`, schema yêu cầu ID bậc tương ứng. Audit `normalizedTheoryRemainingErrors` chỉ ra lỗi bị che bởi lỗi cấu trúc ban đầu.
- [x] C3 bỏ 11 `exampleIds` trỏ passage/rewrite. Plan §8.13 quy định C3 không có Sentence nên dùng ví dụ trực tiếp trong body/formula; không đổi validator để giả vờ các ID này là sentence.
- [x] C1: bỏ khẳng định Wh-question “luôn” đảo ngữ. Tách câu hỏi chủ ngữ (`Who broke...?`) khỏi câu hỏi tân ngữ/trạng ngữ có do/did/will và câu có be; không áp dụng công thức base verb sau be cho mọi trường hợp. [British Council: question forms](https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/question-forms?authuser=0&page=9).
- [x] C2: `between` không chỉ được dùng với đúng hai đối tượng; `during` không luôn có nghĩa diễn ra toàn bộ khoảng thời gian. Sửa ví dụ section thời gian đang trỏ `C2-s-0071` (vị trí hồ), section conjunction trỏ `0146` (đi lên đồi); bổ sung ví dụ `because` đúng từ nhóm `0197–0207`. [BBC: between/among](https://downloads.bbc.co.uk/worldservice/learningenglish/grammarchallenge/pdfs/gc_46_between_among.pdf), [Cambridge: during](https://dictionary.cambridge.org/grammar/british-grammar/during).
- [x] C3: bỏ lời hứa cả 6 dạng rewrite đều giữ nghĩa. Sửa commonMistakes đang biến `Will you not come?` thành `Will you come?` nhưng lại giải thích không được tự đổi phủ định. Thêm section để đạt 3–6 section theo plan, có thể dành riêng cho phân biệt mục tiêu từng phép biến đổi.

**Xong khi:** cả ba file qua validator, tham chiếu hợp lệ, giải thích và ví dụ thống nhất. Không chỉ đổi key để đóng mục.

## R10 — P2: Từ vựng C1–C3 và liên kết passage

- [x] C1-v-0087 `early`, C1-v-0101 `fast`: ghi adjective nhưng ví dụ dùng như adverb (`wake up early`, `run fast`). Đồng bộ POS và ví dụ. [Cambridge: early](https://dictionary.cambridge.org/grammar/british-grammar/early), [adverb types](https://dictionary.cambridge.org/us/grammar/british-grammar/adverbs-types).
- [x] C1-v-0029/0050/0051: ví dụ không chứa headword country/park/library; thay câu minh họa có dùng từ. C1-v-0042 `parent`: làm rõ cha hoặc mẹ ở số ít, không dạy số ít tương đương cả “bố mẹ”.
- [x] C2-v-0082 `My birthday is in this month.` → `My birthday is this month.` theo cách dùng thời gian cơ bản. C2-v-0025 có present perfect, xử lý R12. [Cambridge: at/on/in time](https://dictionary.cambridge.org/grammar/british-grammar/at-on-in-time).
- [x] C3-v-0078 `inside its mother pouch` → `inside its mother's pouch`; C3-v-0080 `acorns` là hạt sồi, không phải hạt dẻ; C3-v-0027 dùng `opposite meanings` cho hai từ; C3-v-0101 rà dấu sở hữu trong tên Teachers' Day.
- [x] Sau khi hoàn thành R07, nối lại vocab C3 với passage. **82/105 headword hoặc biến thể dạng chuỗi đã khai báo không khớp bất kỳ passage hiện tại nào**; danh sách `vocabWithoutPassageMatch`. Ví dụ riverbank/waterfall/compass/sculpture. Plan yêu cầu từ rút từ các đoạn được cung cấp.

**Xong khi:** ví dụ thực sự minh họa headword/POS, VI đúng nghĩa ngữ cảnh, từ C3 có đoạn nguồn cụ thể. Kết quả tìm từ tự động không thay thế kiểm tra biến thể từ và nghĩa bằng biên tập.

## R11 — P1/P2: K phrase sai schema và câu mẫu thiếu tự nhiên

- [x] Bỏ/chuyển `topic` ở cả 55 phrase theo schema hỗ trợ. Giữ thông tin phân nhóm bằng trường hợp lệ, không xóa mất phân loại nếu cần cho sản phẩm.
- [x] Sửa các ví dụ sau trong K.vocab, giữ độ dài 2–5 từ và đồng bộ VI:

| ID K-v | Hiện tại | Gợi ý sửa |
|---|---|---|
| 0035 | Nine red apples on tree. | I see nine apples. |
| 0056 | A butterfly on flower. | The butterfly flies. |
| 0072 | I eat sweet banana. | I eat a banana. |
| 0086 | Rabbits love orange carrot. | Rabbits love carrots. |
| 0102 | Choo choo goes train. | The train goes choo-choo. |
| 0110 | Babies sleep so sweet. | Babies sleep peacefully. |
| 0117 | Draw with yellow pencil. | Use a yellow pencil. |
| 0119 | Please knock on door. | Please knock on the door. |
| 0125 | Pitter patter goes rain. | The rain goes pitter-patter. |

- [x] Rà tiếp các ví dụ food `0083–0085` về mạo từ/số đếm và việc ví dụ có phải câu tự nhiên không. Phrase ngắn có thể là cụm từ; đừng áp quy tắc câu đầy đủ một cách máy móc cho mọi phrase.
- [x] K-ph-0048 `A red ball.` đang dùng hình ⚽ không đỏ: thay ảnh hoặc thay câu cho khớp. K-ph-0033 sửa bản dịch “nước tươi mát” theo ngữ cảnh `fresh water`. K-ph-0047 cân nhắc `Smile brightly.` thay `Smile bright!` làm mẫu chuẩn.
- [x] K-ph-0027 `This is my baby.` không hợp vai người nói là trẻ nhỏ; đổi câu như `This is a baby.` nếu đó là chủ đích tranh. Hai lời chào một từ `Hello!`/`Goodbye!` có thể giữ như ngoại lệ rõ ràng, không kéo dài câu gượng ép chỉ để đủ hai từ.

Điểm đã đạt: 126 vocab, 55 phrase, đủ 26 chữ A–Z; ví dụ vocab đều nằm trong 2–5 từ theo cách đếm hiện tại, có trường image. Đủ độ dài không đồng nghĩa câu đúng; có image không đồng nghĩa ảnh diễn tả đúng. `X/xylophone` có thể dùng học tên chữ, không lấy đó làm ví dụ âm /ks/.

**Xong khi:** phrase qua validator, ví dụ đọc tự nhiên, tranh–EN–VI cùng nghĩa và phù hợp tuổi K.

## R12 — P2: Phạm vi giáo trình và độ khó

- [x] B4-s-0050 `...if it rains`, B4-s-0072 `...if she is not hungry`: vẫn chứa conditional mà plan B4 loại trừ. Mục sửa cũ mới tắt roles, chưa xử lý lệch phạm vi. Thay câu bằng kiến thức đã học hoặc sửa giáo trình có chủ đích trước.
- [x] C1-s-0183 có bị động `is parked`; C2-s-0087/0096 có `born` nhưng gán feature quá khứ, C2-s-0186 có past continuous, C2-v-0025 có present perfect. Không dạy cấu trúc ngoài phạm vi bằng annotation giả.
- [x] Rà modal can/could/should/would chưa được dạy trong lộ trình hiện tại: ví dụ C1-s-0060/0109/0150/0165, C2-s-0056/0172/0177/0178/0185/0201; C3-r-0063 có past continuous và các rewrite modal cũng cần quyết định nhất quán. Câu tiếng Anh có thể đúng nhưng chưa hợp bậc.
- [x] C1 difficulty đang **58/129/13**, lệch mục tiêu 40%/35%/25%; C2 **47/112/48** thiên về mức giữa. Rà độ khó thực tế theo dạng bài, thêm độ đa dạng nếu cần, không đổi nhãn hàng loạt để đủ tỷ lệ.

**Xong khi:** tất cả cấu trúc có chỗ dạy trước khi kiểm tra; ngoại lệ nếu có phải được ghi rõ trong plan/theory. Những chủ điểm đã có ở bậc trước, như tương lai will, không bị loại chỉ vì tên bậc hiện tại không nhắc lại.

## R13 — P1: Đồng bộ nguồn sinh và kiểm tra bàn giao cuối

- [x] C1 generator lệch live ở **42 `orderAlternatives`**, C2 lệch **19**. Danh sách `generatorDiff` trong audit. Lưu các nghiệm đã duyệt vào nguồn sinh/ledger trước khi chạy lại; không lấy việc generator đang sinh ra gì làm chuẩn đúng mặc định.
- [x] C3/K generator hiện khớp dữ liệu, gồm cả lỗi. Sửa nguồn sinh cùng JSON; C3 phải bỏ cách tạo hàng loạt passage lặp.
- [x] Thêm hồi quy có ý nghĩa cho nghiệm `right now`, prompt rút gọn, mục tiêu roles và annotation cụm đầy đủ. Không khóa lại các đáp án sai chỉ vì chúng đang có trong file.
- [x] Chạy validator thật toàn bộ, test English, kiểm tra generator trong bộ nhớ và audit mới. Phân loại từng candidate của audit bằng biên tập; danh sách heuristic không phải tất cả đều là lỗi tự động.
- [x] Đọc lại các câu mới thay, EN/VI và theory liên quan; không nghiệm thu chỉ dựa vào số lượng hoặc schema. C3 cần lượt duyệt riêng sau khi viết lại 35 passage.

**Điều kiện đóng bàn giao:** validator 0 lỗi; test phù hợp pass; các phản ví dụ đã sửa; không mất sửa của người khác khi tái sinh; từng R01–R12 có ghi nhận kết quả và phạm vi còn giới hạn. Không tự công bố/mở khóa thêm bậc trong bước review này.

## Thay đổi trong lượt review này

Trong lượt review ban đầu đã thêm audit/checklist, mở lại 07–08, đính chính báo cáo 13–14 và sửa hợp đồng TF trong plan. Sau đó đại ca yêu cầu sửa trực tiếp; content và generator đã được cập nhật theo [bàn giao v4](D:/Dev/Genius-kids/docs/english-content-fixes-v4.md).
