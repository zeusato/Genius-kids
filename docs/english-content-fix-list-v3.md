# Danh sách sửa content tiếng Anh v3 — giao Claude

**Tài liệu lịch sử sửa A1–B4.** Kết quả mới nhất đã được cập nhật trong bàn giao v4 bên dưới; các mô tả lỗi gốc được giữ để đối chiếu.

> **Cập nhật 23/09/2026:** đã xử lý tiếp 07–08, roles B1 và R01–R13 của review v4. Validator 0 lỗi, 120 test pass. Xem [bàn giao v4](D:/Dev/Genius-kids/docs/english-content-fixes-v4.md); các phát hiện bên dưới được giữ làm lịch sử trước/sau.

## Phạm vi và cách phối hợp

- Review ngày 22/09/2026, gồm **1.400 câu, 756 mục từ vựng, 7 trang lý thuyết A1–B4**. B3/B4 xuất hiện trong lúc review và đã được bổ sung vào phạm vi.
- Gemini tiếp tục sinh nội dung mới. Claude sửa các file A1–B4 và generator tương ứng trong danh sách này; không ghi đè file bậc khác vừa xuất hiện, không chạy lại toàn bộ generator một cách mù quáng.
- Giữ nguyên ID hiện có. Nếu thay câu, cập nhật đồng bộ `en`, `vi`, `tokens`, `roleSpans`, `blanks`, `exerciseTypes`, `orderAlternatives`, tham chiếu theory và các metadata liên quan.
- Trước mỗi nhóm sửa, đọc lại file hiện tại. Bản đối chiếu và SHA-256 nằm trong [english-content-review-v3.audit.json](D:/Dev/Genius-kids/docs/english-content-review-v3.audit.json). Tất cả 21 file trong phạm vi không đổi giữa lần đọc và lần ghi audit. Nếu hash đã đổi sau đó, đối chiếu thay đổi mới; không phục hồi nguyên file từ snapshot cũ.
- Không thay UI, grader, tiến trình hay mở khóa bậc mới để che lỗi content. App hiện mới công bố A1; lỗi B2–B4 được xác nhận bằng dữ liệu và gọi trực tiếp hàm chấm, không phải tuyên bố rằng các bậc này đã chạy trong UI.
- Tài liệu này thay thế phần kết luận đã cũ trong review A1 v2. Những lỗi đã sửa được ghi riêng ở cuối.

| Bậc | Câu | Từ vựng | Kiểm tra cấu trúc JSON hiện tại | Kết luận nội dung |
|---|---:|---:|---|---|
| A1 | 200 | 118 | Đạt | Đã sửa các lỗi chính v2; còn nghiệm xếp câu và biên tập |
| A2 | 200 | 105 | Đạt | Sửa whitelist roles, bản dịch, lý thuyết, nghiệm xếp câu |
| A3 | 200 | 105 | Đạt | Sửa whitelist roles, lemma, nghiệm xếp câu |
| B1 | 200 | 111 | Đạt | Sửa cụm động từ, lemma/feature, lý thuyết, nghiệm xếp câu |
| B2 | 200 | 106 | Không đạt: theory | Sửa hệ thống annotation, prompt, token, đáp án và lý thuyết |
| B3 | 200 | 106 | Không đạt: theory | Sửa hệ thống annotation, prompt, đáp án và bổ sung phạm vi |
| B4 | 200 | 105 | Không đạt: theory | Có câu sai ngữ pháp; sửa hệ thống annotation, prompt và đáp án |

“Đạt cấu trúc” không có nghĩa là đã duyệt ngữ pháp hay cách chấm. Audit có các danh sách ID đầy đủ theo bộ lọc và các ca tái hiện bằng `grade()` trong `src/english/engine.ts`.

## 01 — P1: Sửa câu B4 bị lặp will và đáp án sai

- [x] Sửa `B4-s-0027` trong `B4.sentences.json` và lời gọi generator tạo câu đó.

Hiện tại: `The weather will will be sunny tomorrow.` Token `will` thứ hai còn có `lemma: "aux-future"`, `feature: "base"`; blank trả lời `will` trong khi prompt nói dùng `be`. Nhóm động từ là `will will`, bỏ mất `be` và bổ ngữ `sunny`.

Đích sửa: `The weather will be sunny tomorrow.` Token lần lượt: `The / weather / will / be / sunny / tomorrow / .`. Chủ ngữ `[0,1]`, động từ `[2,3]`, bổ ngữ `[4]`, trạng ngữ `[5]`. Nếu khoét `be`, blank index `3`, answer `be`, prompt ví dụ `Chia động từ be sau will.`. Thêm nghiệm xếp câu `Tomorrow the weather will be sunny.`.

**Xong khi:** câu đọc đúng, prompt/answer cùng mục tiêu, lemma là dạng từ thật, mọi chỉ số cập nhật đúng; generator không tái tạo lỗi.

**Đã sửa (Claude, 22/09):**
- `B4.sentences.json` → `B4-s-0027` = `The weather will be sunny tomorrow.` (bỏ `will` lặp). Tokens `The / weather / will / be / sunny / tomorrow / .`; blank index `3` = `be`, `promptVi` = "Chia động từ be sau will."; roleSpans subject `[0,1]`, verb `[2,3]`, complement `[4]`, adverbial `[5]`; thêm `orderAlternatives` = ["Tomorrow the weather will be sunny."].
- Generator `scripts/build-b4-full.mjs`: lời gọi `addWillAff` (dòng ~416) truyền động từ chính `be` thay cho `will`/`aux-future` (nguồn gây lặp `will`); thêm nhánh `complement` vào helper `addWillAff` để span bổ ngữ không bị rơi.
- Kiểm chứng: bắt `fs.writeFileSync` để chạy generator trong bộ nhớ (không đụng đĩa) → B4-s-0027 sinh ra khớp JSON (không tính `orderAlternatives`, vốn thuộc §07). Gọi `grade()` thật: fill `be` ✓ / `will` ✗; order chuẩn ✓ + nghiệm "Tomorrow…" ✓ + sai trật tự ✗; roles complement `[4]` ✓.

## 02 — P1: Đưa theory B2/B3/B4 về đúng schema

- [x] Sửa cả ba file `B2.theory.json`, `B3.theory.json`, `B4.theory.json` và generator tương ứng.

Sai chung:

| Hiện tại | Đích theo `TheoryPage` |
|---|---|
| `id: "theory-B2"`… | `id: "B2"`… trùng `level` |
| `topic` ở root | Bỏ: schema theory không có field này |
| `formulas[].name` | `formulas[].label` |
| `formulas[].examples: string[]` | `formulas[].example: string` |
| `sections[].title` | `sections[].heading` |
| `sections[].content` | `sections[].body` |
| `exampleIds` ở root | Chuyển vào từng section phù hợp về nghĩa |

Không chỉ đổi tên `examples` nhưng giữ kiểu array. Không rải tất cả ID vào mọi section. Ví dụ quy tắc gấp đôi phụ âm phải trỏ tới câu có động từ tương ứng.

**Xong khi:** `node scripts/english-content.mjs validate` không còn lỗi của ba file này; kiểm tra riêng `id === level` vì validator có thể dừng kiểm tra ngữ nghĩa khi schema còn lỗi.

**Đã sửa (Claude, 22/09):** `B2/B3/B4.theory.json` đưa về đúng `TheoryPage`: `id` = level (bỏ tiền tố `theory-`), bỏ `topic` gốc, `formulas[].name→label` và `examples[]→example` (giữ ví dụ đầu), `sections[].title→heading` và `content→body`, phân bổ `exampleIds` gốc vào từng section theo nghĩa — section "gấp đôi phụ âm" trỏ tới câu có động từ nhân đôi (B2: `B2-s-0151/0152/0157` running/swimming/sitting; B3 mục regular `-ed`: `B3-s-0055` stopped). Generator tương ứng (`generate-b2-content.mjs`, `build-b3-full.mjs`, `build-b4-full.mjs`) thêm bước chuẩn hoá `theoryRaw → theory` + `SECTION_EXAMPLE_IDS`; đã xác minh (chạy trong bộ nhớ) sinh ra **khớp hệt** JSON. `validate` **không còn lỗi cho B2/B3/B4.theory.json** và `id===level`.

> Ngoài phạm vi (§14): `C1.theory.json` và `C2.theory.json` (Gemini sinh sau snapshot A1–B4) vẫn còn lỗi schema tương tự — **không sửa** để tránh đụng file đang được ghi. Nếu muốn, mở mục riêng cho C1/C2.

## 03 — P1: Sửa cách xây cả cụm `roleSpans` ở B2/B3/B4

- [x] Rà toàn bộ câu đang bật `roles`; sửa helper áp dụng annotation đã duyệt trong cả ba generator, kiểm tra lại dữ liệu và đầu ra generator. Hoàn thành 22/09/2026; xem [kết quả mục 03–04](D:/Dev/Genius-kids/docs/english-content-fixes-03-04.md). Các số lỗi bên dưới là snapshot trước sửa.

| Bậc | Câu bật roles nhưng có token nội dung không nằm trong span | Câu có span chỉ gồm một giới từ |
|---|---:|---:|
| B2 | 98 | 32 |
| B3 | 126 | 71 |
| B4 | 119 | 53 |

Hai cột có thể trùng ID, không cộng thành số câu lỗi duy nhất. Đây là bộ lọc phát hiện biểu hiện lỗi, **không phải toàn bộ lỗi annotation**. Danh sách đầy đủ trong audit: `levels.<level>.roleGaps` và `singlePrepositionSpans`.

Ví dụ đã xác nhận:

| ID | Dữ liệu đang chấm | Cụm cần được nhận |
|---|---|---|
| `B2-s-0001` | object = `book` | `a book` — indices `[3,4]` |
| `B2-s-0006` | object = `room` | `my room` |
| `B2-s-0151` | hai adverbial = `in`, `park` | một cụm `in the park` — `[3,4,5]` |
| `B3-s-0109` | hai object = `me`, `present` | riêng `me` và trọn cụm `a present`; xem lưu ý câu hai tân ngữ bên dưới |
| `B4-s-0116` | verb = `am going buy` | `am going to buy` — `[1,2,3,4]` |
| `B4-s-0153` | verb = `do like` | `do not like` — `[1,2,3]` |

Nguyên nhân thấy trực tiếp trong `scripts/generate-b2-content.mjs`: helper duyệt từng token `object`/`adverbial` rồi tạo span một phần tử. Cách này bỏ mạo từ, tính từ, từ sở hữu và tách cụm giới từ. B3/B4 có cùng biểu hiện. Không chuyển máy móc mỗi `Token.role` thành một `RoleSpan`.

Yêu cầu sửa:

- Cụm danh từ phải chứa mạo từ, determiner, tính từ và danh từ liên quan.
- Cụm giới từ phải gom cả giới từ và bổ ngữ của nó. Token local dùng `prep`/`prep-object` theo quy ước của plan; vai trò cả cụm xác định riêng.
- Nhóm động từ gồm trợ động từ, `not`, động từ chính và particle thuộc cụm. `be going to + V` phải có `to`.
- Sửa thêm `B4-s-0167`, `0180`, `0189`, `0198`: `not` đang bị rơi khỏi nhóm động từ.
- Một câu có nhiều cụm cùng vai trò như `B3-s-0109` không thể được đưa vào bài hỏi chung “chọn tân ngữ” rồi chấm đúng duy nhất một cụm. Với UI hiện tại, bỏ `roles` ở câu kiểu này nếu không thể đặt mục tiêu rõ bằng hợp đồng hiện có. Tương tự các câu có nhiều trạng ngữ độc lập.
- Không bật lại `roles` cho câu phức mà chưa mô hình hóa chắc chắn. Bỏ whitelist của dạng bài đó, vẫn giữ câu cho các dạng phù hợp.

**Xong khi:** chọn trọn các cụm trong bảng phải được chấm đúng; không còn kiểu đáp án trơ `in`/`at` cho một cụm trạng ngữ; mỗi câu bật roles có đáp án rõ và đã duyệt từng cụm.

## 04 — P1: Sửa vai trò và từ loại sai về nghĩa, không chỉ gom span

- [x] Kiểm tra các ca dưới đây và ca cùng mẫu trong B2–B4; sửa annotation hoặc bỏ whitelist không chắc chắn. Hoàn thành 22/09/2026; xem [kết quả và lưu ý khi sửa token tiếp](D:/Dev/Genius-kids/docs/english-content-fixes-03-04.md). Các lỗi bên dưới mô tả snapshot trước sửa.

| ID / nhóm | Lỗi | Cách sửa |
|---|---|---|
| `B3-s-0001`, `0002`, `0010` | Thời gian bị gom vào complement: `happy yesterday`, `at home last night`, `ten years old last year` | Tách phần mô tả/vị trí và trạng ngữ thời gian |
| `B4-s-0011`, `0098` | Sau `become`, danh từ chỉ danh tính bị gọi là object | Dùng complement cho trọn cụm `a doctor` / `a famous artist` |
| `B4-s-0047`, `0061`, `0079`, `0095`, `0111` | Bổ ngữ `late`, `lonely`, `cold`, `warm`, `free` không có span | Thêm complement tương ứng |
| `B3-s-0111`, `0137` | `to visit` / `to catch`: `to` bị gán preposition | `to` nguyên mẫu là particle; phân tích cụm đúng hoặc bỏ roles |
| `B3-s-0129` | `We heard a bird singing.` bỏ `a` và `singing` khỏi mô hình vai trò | Thay bằng câu quá khứ đơn giản hơn hoặc bỏ roles; không ép cấu trúc tri giác vào S–V–O thiếu thành phần |
| `B4-s-0050`, `0072` | `if`, chủ ngữ và động từ mệnh đề điều kiện đều thành các adverbial một token, cùng `c1` | Ưu tiên thay bằng câu tương lai đơn giản phù hợp bậc; nếu giữ thì mô hình hóa mệnh đề riêng, chưa chắc thì bỏ roles |
| `B4-s-0126`, `0128` | Bổ ngữ kết quả `pink` và cụm nguyên mẫu `to play guitar` bị bỏ/tách sai | Giản lược câu hoặc duyệt annotation phù hợp trước khi bật roles |

Rà POS của `last` trong `last night/year`, `next` trong `next week` theo cách dùng bổ nghĩa danh từ, không tự động lấy vai trò trạng ngữ của cả cụm để gán mọi từ thành adverb. Trong B3, `was/were` đứng độc lập làm động từ nối cần feature `past`, không phải `aux-past`; tương tự phủ định dùng `past-neg` khi token là `wasn't/weren't`.

**Xong khi:** các câu còn bật POS/roles dạy đúng từ loại và đúng vai trò, không chỉ vượt validator.

## 05 — P1: Tách token `am not` ở B2

- [x] Sửa `B2-s-0061` đến `B2-s-0070`, cập nhật blank/span/ledger và generator; bật lại POS/roles sau kiểm tra. Hoàn thành 22/09/2026; xem [kết quả mục 05–06](D:/Dev/Genius-kids/docs/english-content-fixes-05-06.md). Mô tả dưới đây là lỗi trước sửa.

Cả 10 câu đang chứa token `"am not"` với `pos: "verb"`, trái quy tắc một token/một từ trong plan §6.1. Tách thành:

```json
[
  { "text": "I", "pos": "pronoun", "role": "subject" },
  { "text": "am", "pos": "verb", "role": "verb", "lemma": "be", "feature": "present-1sg" },
  { "text": "not", "pos": "adverb", "role": "adverbial" },
  { "text": "sleeping", "pos": "verb", "role": "verb", "lemma": "sleep", "feature": "ing" },
  { "text": ".", "pos": "punct", "role": "punct" }
]
```

Nhóm verb là `[1,2,3]`. Nếu khoét `am`, answer chỉ `am`; `not` vẫn hiện. Nếu khoét V-ing, cập nhật index sau khi chèn token. Không gán `-neg` cho `am` đứng riêng trước `not`.

**Xong khi:** không còn token chứa khoảng trắng trong nhóm này; mọi blank/span/alternative vẫn hợp lệ.

## 06 — P1: Bỏ đáp án và lời giải khỏi `promptVi`

- [x] Rà và chuẩn hóa prompt của 600 câu B2–B4, sửa thêm 70 câu A2; đồng bộ cả bốn generator. Hoàn thành 22/09/2026; xem [kết quả mục 05–06](D:/Dev/Genius-kids/docs/english-content-fixes-05-06.md). Ví dụ lỗi dưới đây thuộc snapshot trước sửa.

`promptVi` luôn hiện khi làm bài; `hint` mới là phần gợi ý. Viết câu hỏi như lời giải khiến điểm kiểm tra không đo được kiến thức.

| ID / phạm vi | Hiện tại | Đề thay thế gợi ý |
|---|---|---|
| `B2-s-0176` | `Chủ ngữ he đi với to be is.` | `Điền dạng hiện tại phù hợp của be.` |
| `B2-s-0177` | Ghi sẵn `swimming` | `Chia swim ở hiện tại tiếp diễn.` |
| `B2-s-0191` | `come → coming` | `Chia come để diễn tả hành động đang xảy ra.` |
| `B3-s-0001` | Ghi sẵn `was` | `Điền dạng quá khứ phù hợp của be.` |
| `B3-s-0041` | `Chia watch ở thì quá khứ đơn: watched.` | `Chia watch ở quá khứ đơn, câu khẳng định.` |
| `B3-s-0091` | `Dạng quá khứ bất quy tắc của go là went.` | `Chia go ở quá khứ đơn, câu khẳng định.` |
| `B4-s-0001` | `Điền trợ động từ tương lai will.` | `Điền trợ động từ tạo câu khẳng định ở tương lai đơn.` |
| `A2-s-0147`, `0148` | Yêu cầu chép đúng từ `There` | Khoét `be`/thành phần khác để kiểm tra cấu trúc hoặc diễn đạt yêu cầu không đưa đáp án |
| `A2-s-0198` | `Điền mạo từ the.` | Nêu ngữ cảnh xác định nhóm táo, không cho sẵn từ cần điền |

**140 câu đầu B3 đều có sẵn đáp án trong prompt**, kể cả những câu vừa giải quy tắc vừa đưa kết quả. Rà tiếp 60 câu còn lại và cả B4, không chỉ sửa hàng minh họa. Prompt vẫn phải có lemma, thì, thể hoặc nghĩa cần thiết để đáp án xác định; không xóa luôn ngữ cảnh để “tránh lộ đáp án”. Chuyển lời giải/quy tắc thao tác như “gấp đôi n” vào `hint` nếu đó là kỹ năng đang kiểm tra.

`B4-s-0189` còn yêu cầu `will not` trong khi chỉ khoét token `will` và `not` đã hiện; sửa prompt khớp đúng phần khoét.

**Xong khi:** người học phải tự chọn/chia dạng từ; prompt không tự trả lời câu hỏi.

## 07 — P1: Bổ sung nghiệm xếp câu hợp lệ

**Đã sửa lại 23/09/2026:** 8 alternative tách sai right now đã bị loại; test xác nhận nghiệm sai bị từ chối và cả cụm đúng được nhận. Xem R01 trong bàn giao v4.

- [x] Rà các câu có `order` ở cả A1–B4 (và C1–C2). Hoàn tất sửa bổ sung 23/09/2026; xem [bàn giao v4](D:/Dev/Genius-kids/docs/english-content-fixes-v4.md).

Các đáp án sau dùng **đúng cùng bộ token**, giữ nghĩa, nhưng gọi trực tiếp grader hiện tại đều trả `false`:

| ID | Đáp án đúng đang bị từ chối |
|---|---|
| `A1-s-0031` | `The weather today is warm.` |
| `A1-s-0038` | `The cute little puppy is very playful.` |
| `A2-s-0016` | `In the lake there is an island.` |
| `A3-s-0171` | `Whose is this book?` |
| `B1-s-0023` | `In the morning she drinks warm milk.` |
| `B1-s-0189` | `Sometimes I read comics.`; cũng cần nhận `I read comics sometimes.` |
| `B2-s-0176` | `Now he is running.` |
| `B3-s-0001` | `Yesterday I was happy.` |
| `B4-s-0002` | `Tomorrow he will visit his grandparents.` |

B2/B3/B4 hiện đều bật order cho 200 câu nhưng **không có câu nào có `orderAlternatives`**. A1/A2/A3/B1 lần lượt có 14/20/32/31 câu có alternatives, vẫn chưa đủ.

Rà nhóm thời gian đầu/cuối câu, `often/usually/sometimes`, biến thể Whose và trật tự tính từ tự nhiên. Không sinh mọi hoán vị từ bằng thuật toán: chỉ thêm câu đúng ngữ pháp, cùng nghĩa, cùng token. Nếu câu có quá nhiều nghiệm không kiểm soát được, bỏ `order` khỏi whitelist của riêng câu đó và bảo đảm còn đủ nguồn bài.

Tham khảo vị trí trạng từ: [Cambridge — Adverbs and adverb phrases: position](https://dictionary.cambridge.org/uk/grammar/british-grammar/adverbs-and-adverb-phrases), [Cambridge — Often](https://dictionary.cambridge.org/us/grammar/british-grammar/often). Các ví dụ trong bảng là ca review tự xây, không phải trích dẫn từ nguồn.

**Xong khi:** ca tái hiện trong audit được nhận khi dạng order vẫn bật; câu sai trật tự thật sự vẫn bị từ chối. Không sửa grader thành chấp nhận mọi câu có cùng túi từ.

## 08 — P1: Cho phép dạng phủ định đầy đủ ở bài điền từ

**Đã sửa lại 23/09/2026:** 66 prompt B2–B4 đã cho phép dạng phủ định nói chung, thống nhất với việc nhận cả dạng đầy đủ/rút gọn. Xem R02 trong bàn giao v4.

- [x] Bổ sung `blanks[].alt` cho các prompt không bắt buộc rút gọn. Hoàn tất sửa bổ sung 23/09/2026; xem [bàn giao v4](D:/Dev/Genius-kids/docs/english-content-fixes-v4.md).

Audit liệt kê đầy đủ `negativeBlankWithoutAlt`: **B2 có 12, B3 có 29, B4 có 20 câu** cần rà. Ví dụ `B2-s-0071`, ô trống trong `He ___ sleeping.` chỉ nhận `isn't`; `is not` là đáp án đúng nhưng grader trả false.

Ánh xạ cần dùng theo câu: `isn't → is not`, `aren't → are not`, `wasn't → was not`, `weren't → were not`, `didn't → did not`, `won't → will not`. Không thêm dạng viết lại cả chủ ngữ vào một ô trống động từ. Nếu bài chủ ý yêu cầu rút gọn, giữ đáp án rút gọn nhưng phải nói rõ trong `promptVi`.

**Xong khi:** các dạng đầy đủ thay đúng một token được nhận ở prompt không hạn chế rút gọn; đáp án thiếu phủ định vẫn sai.

## 09 — P2: Bỏ roles khỏi cấu trúc there tồn tại theo plan

- [x] Bỏ `roles` khỏi `exerciseTypes` của **90 câu A2 và 8 câu A3** có token `role: "expletive"`.

Plan §6.1 quy định giai đoạn đầu không sinh câu hỏi vai trò với `there is/are`. Đây là quy ước phạm vi đã chọn cho sản phẩm; không phải kết luận rằng chỉ có một trường phái phân tích ngữ pháp đúng. Danh sách ID đầy đủ: `thereWithRoles` trong audit. Ví dụ `A2-s-0016`, `A2-s-0141`, `A3-s-0075`.

Giữ câu cho POS/fill/order nếu từng dạng đã duyệt. Không đổi `there` thành danh từ hoặc chủ ngữ ngữ nghĩa để lách giới hạn.

**Đã sửa (Claude, 22/09):** tính trực tiếp trên dữ liệu hiện tại (token `role:"expletive"` + `exerciseTypes` chứa `roles`): đúng **90 câu A2 + 8 câu A3**. Đã bỏ `roles` khỏi `exerciseTypes` cho tất cả (giữ nguyên `roleSpans`, giữ POS/fill/order; không câu nào rỗng `exerciseTypes`). Không đổi `there` thành chủ ngữ. Generator: thêm bước chuẩn hoá trước khi ghi ở `scripts/build-a2-data.mjs` và `scripts/build-a3-data.mjs` (câu có token expletive → loại `roles`). Kiểm chứng: chạy generator trong bộ nhớ (không đụng đĩa) → 0 câu expletive còn `roles`; `validate` không phát sinh lỗi mới cho A2/A3; grader không còn hỏi vai trò cho các câu này.

## 10 — P2: Sửa B1 phrasal verbs và lemma/feature

- [x] Sửa 8 câu B1 đang rơi particle `up` khỏi nhóm động từ: `0036`, `0050`, `0101`, `0130`, `0150`, `0170`, `0171`, `0197` (đều mang tiền tố `B1-s-`).

Ví dụ `She wakes up early.` phải nhận cụm `wakes up`, không chỉ `wakes`; câu hỏi phải gom cả auxiliary và particle theo chỉ số không nhất thiết liên tiếp.

- [x] Sửa `A3-s-0168`: `children's` có lemma `children` → `child`. Rà thêm các token plural đang dùng lemma plural như `parents`, `grandparents`, `children` ở A3/B1; giữ `feature: "pl"`, sửa lemma về `parent`, `grandparent`, `child`.
- [x] Sửa trợ động từ câu trả lời ngắn B1 `0132`, `0135`, `0139`, `0152`, `0155`: `do/does` là auxiliary, dùng `aux-present-other` / `aux-present-3sg`, không dùng feature động từ chính. Bổ sung câu hỏi gốc vào prompt nếu bản dịch trả lời cần ngữ cảnh cụ thể như “tôi thích”, “cô ấy có nói”.

**Xong khi:** cả cụm động từ được chấm đúng; lemma/feature không mâu thuẫn với cách dùng và quy ước schema.

**Đã sửa (Claude, 22/09):**
- **10.1 — phrasal verb (`B1.sentences.json`):** 8 câu (`0036/0050/0101/0130/0150/0170/0171/0197`) — thêm chỉ số token particle `up` vào `roleSpans` vai trò `verb` (gồm cả auxiliary + động từ chính + particle, chỉ số không nhất thiết liên tiếp; vd `0150` → `[0,2,3]`). Rà toàn bộ B1: đúng 8 câu có token `pos:"particle"` (interjection "Yes" là `pos:"interjection"`, không đụng). Grader thật: chọn trọn cụm ✓, chọn thiếu ✗.
- **10.2 — lemma số nhiều (A3 & B1):** giữ `feature:"pl"`, sửa lemma về số ít — `parents→parent`, `grandparents→grandparent`, `children→child` (gồm `A3-s-0168` `children's`). Sửa 5 token A3 + 8 token B1; còn 0 lemma số nhiều.
- **10.3 — trợ động từ short-answer (`B1.sentences.json`):** 5 câu (`0132/0135/0139/0152/0155`) `do/does` → `aux-present-other`/`aux-present-3sg` (bản phủ định `0133/0136/0140/0153/0156` đã đúng `aux-*-neg` từ trước, không đụng).
- **Generator:** thêm bước chuẩn hoá trước khi ghi ở `scripts/generate-b1-sentences.mjs` (particle vào cụm động từ · lemma số nhiều · aux short-answer) và `scripts/build-a3-data.mjs` (lemma số nhiều). Kiểm chứng chạy trong bộ nhớ (không đụng đĩa): tất cả rule đạt. `validate` không phát sinh lỗi mới; `src/english/english.test.ts` 27/27 pass.
- **Không chạy generator ghi đĩa** để tránh đè các sửa tay mục 03–08 của session khác (§14). JSON đã sửa tay là bản chuẩn.

## 11 — P1/P2: Sửa lý thuyết dạy quy tắc sai hoặc quá tuyệt đối

Hoàn thành 22/09/2026; xem [kết quả mục 11–12](D:/Dev/Genius-kids/docs/english-content-fixes-11-12.md). Các mô tả lỗi bên dưới là snapshot trước sửa.

- [x] **B2, section dấu hiệu thời gian:** bỏ khẳng định cứ có now/today/Look!/Listen! thì “luôn” dùng tiếp diễn. Phản ví dụ tự xây: `I know the answer now.`, `Today is Monday.`. Dạy theo nghĩa hành động/trạng thái; thêm đối chiếu thói quen với hành động đang xảy ra. [British Council — Present continuous](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-continuous) xác nhận động từ trạng thái thường dùng simple, không phải continuous.
- [x] **B4, mục phân biệt bốn thì/tips:** đổi các “từ khóa thần thánh”, “chọn ngay” thành gợi ý xét ngữ cảnh. Đừng tạo quy tắc sai chỉ để dễ ghi nhớ.
- [x] **B2/B3:** `you` có thể số ít hoặc số nhiều, vẫn đi với `are/were`; đừng mô tả toàn bộ nhóm `we/you/they` là chủ ngữ số nhiều. Cùng vấn đề ở tips B3.
- [x] **B2/B3, quy tắc gấp đôi:** nêu ngoại lệ phụ âm cuối `w/x/y`, và giới hạn quy tắc cơ bản; không nói “chỉ” từ một âm tiết mới gấp đôi. Chính B3 vocab có `begin → beginning`. Dùng quy tắc dựa vào nguyên âm, phụ âm cuối và trọng âm khi mở rộng.
- [x] **A2, số nhiều:** không coi mọi đuôi phụ âm + o đều thêm es. Nêu trường hợp như `piano → pianos`, `photo → photos`; phân biệt với `tomato → tomatoes`. [Cambridge University Press — bảng số nhiều](https://assets.cambridge.org/97811086/50540/excerpt/9781108650540_excerpt.pdf).
- [x] **A2, a/an:** quyết định theo âm đầu của từ theo sau, không phải chỉ chữ cái đầu danh từ. Giữ ví dụ `an honest boy`, `a university teacher`, `a red apple`. Bỏ cách diễn đạt đồng nhất chữ U-E-O-A-I với toàn bộ hệ âm nguyên âm.
- [x] **B1, bảng thêm s:** sửa `plays, reads, eats, drinks, runs, clean, cooks` thành `... cleans ...`.
- [x] **B1, section câu hỏi:** sắp lại exampleIds thành nhóm câu hỏi + trả lời khớp đại từ/ngữ cảnh; hiện `Yes, I do. / No, I don't.` đứng cạnh `Do they play badminton?`, còn câu trả lời `he` đứng cạnh câu hỏi `she`. Có thể dùng `0131–0133` và `0151–0153`.

**Xong khi:** theory đúng schema và đúng kiến thức; ví dụ cụ thể phản ánh quy tắc thay vì phủ định nó.

## 12 — P2/P3: Sửa dịch và câu mẫu thiếu tự nhiên

Hoàn thành 22/09/2026; đã cập nhật annotation, blank, alternative, ledger và generator khi đổi câu. Xem [bàn giao mục 11–12](D:/Dev/Genius-kids/docs/english-content-fixes-11-12.md).

- [x] A2: sửa nhóm `0111–0121`, nhất là `Có hai những đứa trẻ`, `Có ba những người đàn ông`, `Có năm mọi người`, `Có ba những con chuột`, `Có bốn những con cừu`, `Có năm những con cá`, `Có hai những chiếc kệ`. Dùng lượng từ tự nhiên: `Có hai đứa trẻ`, `Có ba người đàn ông`, `Có năm người`…
- [x] A2: nhóm `0056–0065` chỉ lặp `The ... are very fast.`; `The kites are very fast.` dịch “Những con diều rất nhanh nhẹn” thiếu tự nhiên. Thay một số câu bằng ngữ cảnh thực tế để cải thiện đa dạng. Nếu skill chính là plural, ưu tiên khoét danh từ plural thay vì cả nhóm chỉ khoét `are`.
- [x] A1 `0038`: ưu tiên `The cute little puppy is very playful.`; cập nhật tokens/spans khi đổi trật tự.
- [x] A3 `0062`: để dạy cơ bản, ưu tiên `Is that soup hot?` hoặc câu có `a bowl of hot soup`; tránh dùng `a hot soup` không có ngữ cảnh một loại/phần súp. Đây là chỉnh sư phạm, không khẳng định `a soup` luôn sai trong mọi ngữ cảnh.
- [x] B2 `0061–0105`: bản dịch “không đang…” lặp máy móc. Dùng tiếng Việt tự nhiên như `Lúc này tôi không ngủ`, `Hiện giờ cô ấy không học bài`, vẫn giữ rõ nghĩa đang xảy ra.
- [x] B2 `0172`: `The boy is flying a plane.` không nêu máy bay đồ chơi nhưng bản dịch tự thêm “đồ chơi”. Nếu chủ ý đồ chơi, thêm `toy` vào tiếng Anh và cập nhật toàn bộ annotation.
- [x] B1 `0076` và B3 `0188`: khi nghĩa là “đi ngủ”, ưu tiên `go to bed` thay vì `sleep` để mẫu sinh hoạt tự nhiên hơn; đổi cả blank/lemma/span nếu đổi câu.
- [x] A3 vocab `A3-v-0089` dùng `has` trong ví dụ `The cat has a long tail.` dù phạm vi A3 yêu cầu động từ chính là be. Đổi thành `The cat's tail is long.`.

**Đã rà 80 blank tính từ A3, giới hạn nguồn chọn bằng nhóm ba từ và nghĩa rõ ràng trong prompt.** Rà các đáp án tính từ đồng nghĩa: nếu chỉ cho một từ trong khi bản dịch và prompt cho phép nhiều từ, thêm biến thể đã duyệt hoặc làm rõ yêu cầu/nguồn từ được chọn. Không bật fuzzy matching để giải quyết sự mơ hồ.

## 13 — P2: Hoàn thiện độ phủ và chuẩn hóa từ vựng

Hoàn thành 22/09/2026; xem [bàn giao mục 13–14](D:/Dev/Genius-kids/docs/english-content-fixes-13-14.md). Các mô tả bên dưới là vấn đề trước sửa; B2/B3/B4 hiện có difficulty 80/75/45.

- [x] B3 hiện có 40 câu `was-were` nhưng **không có câu hỏi đảo Was/Were** trong nhóm này. Bổ sung/thay một số câu để luyện cả hỏi và trả lời ngắn theo theory, giữ tối thiểu 200 câu.
- [x] B2 chưa có bài đối chiếu present simple/continuous; thêm một nhóm nhỏ có ngữ cảnh rõ và tag phù hợp để đạt mục tiêu “phân biệt với B1” trong lộ trình. Không coi việc chép quy tắc vào prompt là kiểm tra khả năng phân biệt thì.
- [x] B4 `be going to` tập trung vào khẳng định, nhóm ôn có một phủ định; bổ sung câu hỏi/phủ định đơn giản nếu muốn nghiệm thu phạm vi này đầy đủ.
- [x] Rà phân bố khó: B2 = `47/137/16`, B3 = `68/125/7`, B4 = `58/131/11` cho difficulty 1/2/3. Điều chỉnh thiết kế câu để gần mục tiêu 40/40/20; không chỉ đổi nhãn hàng loạt để đẹp số.
- [x] Chuẩn hóa các headword plural đang có `en === forms.plural`: `A3-v-0076 parents`, `A3-v-0101 shoes`, `B1-v-0080 vegetables`, `B2-v-0084 dishes`, `B3-v-0099 noodles`. Đây chưa phải lỗi tiếng Anh của headword, nhưng schema không có cờ headword đã ở số nhiều; nên dùng dạng gốc `parent/shoe/vegetable/dish/noodle` và đổi IPA/vi/example tương ứng để tránh bảng biến đổi gây hiểu sai.
- [x] `B4-v-0071 rain`, `B4-v-0073 snow`: kiểm tra POS so với ví dụ `It will rain/snow...`; nếu entry dạy noun thì ví dụ phải dùng noun, nếu dạy verb thì cần đổi POS và bổ sung forms.

Các grammarPoint sau A1 hiện do từng bộ sinh đặt tên, chưa có catalog runtime tương ứng được công bố. Trước khi tích hợp bậc mới, chốt danh sách skill và quota với code; đừng dùng mẫu minh họa trong plan như danh sách ID exhaustive hoặc tự mở bậc vì đủ số lượng.

## 14 — Kiểm tra sau sửa và bàn giao

Đã kiểm tra và bàn giao A1–B4: 98 tests đạt, 14/14 ca tái hiện đạt, 20 đầu ra generator khớp dữ liệu khi chạy trong bộ nhớ. Checkbox chạy validate xác nhận **đã thực hiện**, không có nghĩa toàn kho xanh: C1–C3/K còn 237 lỗi ngoài phạm vi; xem bảng cụ thể trong bàn giao.

- [x] Chạy `node scripts/english-content.mjs validate`. Nếu Gemini vừa sinh file bậc khác bị lỗi, tách rõ lỗi trong phạm vi Claude và lỗi file mới; không sửa lan sang file đang được ghi chỉ để toàn lệnh xanh.
- [x] Kiểm tra mỗi A1–B4 vẫn đủ ≥200 câu + ≥100 từ, ID không trùng, theory refs tồn tại và đúng nghĩa, không có câu giống hệt trong cùng file.
- [x] Gọi grader cho các ca order/roles/fill trong `reproductions` của audit. Ca còn bật dạng bài phải trả đúng. Nếu bỏ whitelist có chủ đích, ghi rõ ID và lý do.
- [x] Kiểm tra câu sai vẫn bị từ chối: thiếu not, sai hợp ngôi, thiếu từ trong cụm, đảo trật tự vô nghĩa.
- [x] Sau khi chạy generator đã sửa, kiểm tra diff không xóa mất các sửa tay mới của Claude/Gemini. Không reset ID, không thay content bằng bộ vài câu lặp lại để đủ 200.
- [x] Cập nhật từng checkbox của tài liệu này, ghi file/ID đã sửa và kết quả lệnh. Những gì chưa xác minh phải giữ trạng thái chưa xong.

Audit hiện tại chứng minh các ca lỗi cụ thể; không phải công cụ chứng nhận mọi annotation đúng. Validator chưa bắt hết: token nhiều từ, prompt lộ đáp án, span không trọn cụm, câu sai ngữ pháp vẫn có `en` khớp token. Không được coi validator pass là thay thế review ngôn ngữ.

## Những sửa A1 v2 đã xác nhận

- Theory sections 2–4 đã trỏ tới nhóm câu đúng nội dung.
- `A1-s-0072`, `0074`, `0189` đã thêm các nghiệm chuyển cụm thời gian ra đầu câu được yêu cầu trước đó.
- `A1-s-0150–0155` đã đổi thành trả lời ngắn phủ định; có ngữ cảnh câu hỏi.
- Các ca Wh `0106–0112`, `0181–0184` đã thay; `0194` bỏ superlative, `0200` bỏ sở hữu cách.
- `0130`, `0195` đã thay câu, không còn annotation sai của always.
- Có **28 blank this/that/these/those**; nội dung mới không còn chỉ khoét to be.
- `A1-s-0080` đã sửa nghĩa màu sắc; desk không còn emoji laptop, school/classroom không còn chung emoji cũ. `A1-v-0097` hiện là “Bà ấy là bà của tôi”, đã bỏ bản dịch lỗi thiếu “ấy”.

Không yêu cầu Claude khôi phục câu cũ để sửa lại lỗi đã hết. A1 vẫn có các nghiệm xếp câu mới tìm thấy ở mục 07.

## Giới hạn của lần review

Đã đọc các câu EN/VI, prompt, các mục vocab và 7 trang theory trong phạm vi; chạy kiểm tra cấu trúc toàn bộ và truy vết annotation theo mẫu/lỗi cụ thể. Chưa đối chiếu từng IPA với từ điển hoặc nghe từng file audio/TTS; chưa chứng nhận từng tổ hợp đáp án đồng nghĩa. Những file/bậc được Gemini tạo sau snapshot A1–B4 không nằm trong kết luận này.
