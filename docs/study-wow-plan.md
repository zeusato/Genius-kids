# Ôn Luyện "wow" — Kế hoạch thi công

> Lập 01/10/2026. Đi kèm bản rà soát `docs/study-review-2026-10-01.md` (gọi tắt **RS**; "RS §3" = mục 3 của bản rà soát).
> Nhánh `feat/study-wow`, tag mốc `study-before-wow` trên `main` trước khi sửa.
> Quyết định của chủ dự án (01/10): **(1) định dạng số theo SGK · (2) nội dung vượt lớp giữ lại, gắn nhãn "Nâng cao" · (3) làm trọn gói.**

> **Bàn giao thực tế 01/10:** đã tiếp nhận code dở sau GĐ3, hoàn thiện giao diện/báo cáo/in và kiểm tra luồng. Xem [study-wow/README.md](study-wow/README.md) để biết chính xác kiểm chứng, thay đổi so với plan và lỗi TypeScript có sẵn ở module farm. Không suy diễn trạng thái từ danh sách kế hoạch bên dưới.

## 0. Cách dùng plan này (đọc trước mỗi phiên)

1. Mỗi phiên chỉ làm **một mục GĐx.y**. Đọc mục 5 "Bẫy" trước khi sửa.
2. Không tự đổi quyết định ở mục 1. Gặp chỗ plan chưa nói thì chọn phương án **giữ tương thích ngược** và ghi chú vào cuối file này (mục 12 "Nhật ký lệch plan").
3. Xong mỗi mục, chạy **lệnh nghiệm thu** của mục đó. Mọi lệnh phải xanh mới commit.
4. Commit theo lối repo, tiếng Việt, ví dụ: `Ôn Luyện GĐ0.2: hàm định dạng & đọc số theo SGK`. Kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn phiên.
5. Lệnh chung:
   - Test: `npx vitest run`
   - Kiểu: `npx tsc --noEmit`
   - Build: `npm run build`
   - Mẫu đề: `node scripts/study-dump.mjs <topicId|skillId|all> [n]` (tạo ở GĐ0.1)
   - Ảnh: `node scripts/study-shots.mjs` (tạo ở GĐ4.0)

## 1. Quyết định đã chốt

| # | Quyết định | Chi tiết thi công |
|---|---|---|
| D1 | Định dạng số theo SGK | Nhóm 3 chữ số bằng **khoảng trắng không ngắt** ` ` ("12 345", "10 000 đồng"); dấu **phẩy** thập phân ("0,125"); không dùng `,` hay `.` để nhóm nghìn. Số có ≤ `GROUP_MIN_DIGITS` chữ số thì không nhóm. Mặc định **5** (4 chữ số viết liền "2417"); đổi một hằng số nếu đối chiếu SGK lớp 3 khác. |
| D2 | Nội dung vượt lớp: giữ, nhãn "Nâng cao" | Kỹ năng có `advanced: true`. Hiện ở nhóm "Nâng cao" cuối mỗi lớp, **không** vào "Ôn hôm nay" / đề ma trận / % thành thạo chủ đề. Danh sách ở mục 7 (đánh dấu ★). |
| D3 | Làm trọn gói GĐ0–GĐ6 | Theo thứ tự ở mục 6. |
| D4 | Giữ nguyên `Topic.id` cũ | Lịch sử, `stats.topicCorrectCount` và MathRacing tham chiếu các id này. Chỉ **thêm** topic mới, đổi `title`/`description` được. |
| D5 | Ký hiệu SGK | `×` cho nhân, `:` cho chia (không dùng `÷`, `x`); "?" hoặc "□" cho số cần tìm (không dùng "Tìm x"); "l/ml" viết thường; "trả lại" (không dùng "thối"); "thứ Hai" (chữ "thứ" viết thường). |
| D6 | In đề | Thay jsPDF bằng **trang in HTML** `/study/print` + `window.print()`: SVG nét đẹp, không tải font từ CDN, có trang đáp án. Xoá `utils/pdfExport.ts` khi trang in chạy ổn. |
| D7 | Giao diện | Dùng `HubShell` (giống `PreschoolShell`), token `--hub-*` và font HubNunito; ưu tiên **tablet ngang 1180×820**, vẫn chạy tốt ở 768 và 390. |

## 2. Kiến trúc đích

```
services/study/                 ← MỚI: lõi thuần (không React)
  types.ts        Strand, Level, Term, OpTag, SkillDef, Template, GenOpts, VisualSpec, CompactQuestion
  value.ts        fmt, fmtMoney, readNumberVN, parseValue, sameValue        (+ value.test.ts)
  grading.ts      isCorrect(q, answer)                                         (+ grading.test.ts)
  catalog.ts      SKILLS: SkillDef[] (mục 7) + TOPIC_META (strand, term, order, icon)
  registry.ts     gom templates của mọi generator → bySkill, byTopic; generate(skillId, level)
  session.ts      buildSession(spec): practice/test/daily/review/matrix; dedupe; báo thiếu
  progress.ts     StudyProgress: readStudyProgress, applySession, status, topicMastery (+ test)
  rewards.ts      sessionReward(mode, result, progressDelta)
  compact.ts      compactQuestion, compactResult, migrateHistory
services/generators/
  kit.ts          ← MỚI: rint, pickOne, shuffle (generatorRandom), single/compare/yesNo/input/multi/order, fromTemplates
  wrongs.ts       ← MỚI: distractor theo lỗi sai thường gặp
  svg/            giữ; thêm renderVisual(spec) + sửa angleSVG/baseTenSVG/triangle/box3d; thêm hình mới (mục 6 GĐ2)
  gradeN/*.ts     mỗi file export `templates: Template[]` + giữ tên hàm cũ = fromTemplates(templates)
  invariants.test.ts  ← MỚI: kiểm đầu ra THÔ của mọi template (mục 4)
services/mathEngine.ts   giữ TOPICS (thêm topic mới) + generateQuestions (wrap session.ts) + AI fallback
src/components/study/    viết lại (GĐ4): StudyHome, TopicSheet, CustomSessionDialog, player/*, ResultView, ReportView, PrintSheet, study.css
scripts/study-dump.mjs, scripts/study-shots.mjs
```

## 3. Hợp đồng dữ liệu (code mẫu, đặt đúng tên)

```ts
// types.ts (root) — MỞ RỘNG, mọi trường mới đều optional để dữ liệu cũ & AI vẫn hợp lệ
export enum QuestionType { SingleChoice='single', MultipleSelect='multi', SelectWrong='wrong', ManualInput='input', Typing='typing', Order='order' }
export interface Question {
  id: string; topicId: string; type: QuestionType; questionText: string;
  visualSvg?: string;            // CHỈ để hiển thị, KHÔNG BAO GIỜ lưu vào lịch sử
  visual?: VisualSpec;           // dữ liệu hình nhỏ gọn → renderVisual(); được lưu
  options?: string[]; correctAnswer?: string; correctAnswers?: string[]; userAnswer?: string | string[];
  explanation: string;           // 1 câu tóm tắt (vẫn bắt buộc)
  steps?: string[];              // lời giải từng bước (hiển thị dạng danh sách)
  hint?: string;                 // gợi ý ở lần sai đầu (Luyện tập)
  speech?: string;               // văn nói cho TTS; thiếu thì dùng questionToSpeech(questionText)
  accept?: string[];             // ManualInput: đáp án hợp lệ khác (so theo giá trị)
  answerKind?: 'number' | 'text';// number → bàn phím số + so theo giá trị
  skillId?: string; level?: 1 | 2 | 3; advanced?: boolean; ops?: OpTag[];
}
export type StudyMode = 'practice' | 'test' | 'daily' | 'review' | 'matrix';

// services/study/types.ts
export type Strand = 'number' | 'geometry' | 'measurement' | 'statistics' | 'probability' | 'explore'; // explore: Mầm non (màu, thời gian)
export type Level = 1 | 2 | 3;    // M1 nhận biết · M2 hiểu/làm được · M3 vận dụng (Thông tư 27)
export type Term = 1 | 2;
export type OpTag = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'geometry' | 'fractions'; // khớp src/data/achievements.json
export interface SkillDef { id: string; grade: Grade; topicId: string; strand: Strand; term: Term; title: string; levels: Level[]; advanced?: boolean; ops?: OpTag[] }
export interface GenOpts { skillId?: string; level?: Level }
export type Generated = Omit<Question, 'id' | 'topicId'>;
export interface Template { skillId: string; level: Level; weight?: number; make: () => Generated; check?: (q: Generated) => string | null }
export interface VisualSpec { fn: VisualFn; args: unknown[] }    // VisualFn = union tên hàm kit được phép (whitelist)
export type CompactQuestion = Omit<Question, 'visualSvg'>;        // explanation cắt ≤ 300 ký tự, steps ≤ 6
```

**Hợp đồng generator** (template):
- `fromTemplates(templates)` trả về `(opts?: GenOpts) => Generated`.
  - Có `opts.skillId` thì chỉ chọn template của kỹ năng đó; có `opts.level` thì ưu tiên mức đó, không có thì lấy mức gần nhất.
  - Không có `opts` thì chọn ngẫu nhiên theo `weight` như cũ, để MathRacing và game khác giữ nguyên hành vi.
  - Luôn gắn `skillId`, `level`, `advanced`, `ops` từ catalog vào câu.
- Ngẫu nhiên **chỉ** qua `generatorRandom()` (để MathRacing sinh được theo seed).

**Định dạng / đọc / so giá trị** (`value.ts`):
- `fmt(n, {decimals?})`: theo D1, không "-0", bỏ số 0 thừa ở phần thập phân.
- `fmtMoney(n)` trả về `fmt(n) + ' đồng'`.
- `readNumberVN(n)` đọc đúng SGK. Ca kiểm bắt buộc:
  - 21 → "hai mươi mốt"
  - 15 → "mười lăm"
  - 25 → "hai mươi lăm"
  - 105 → "một trăm linh năm"
  - 5041 → "năm nghìn không trăm bốn mươi mốt"
  - 1005 → "một nghìn không trăm linh năm"
  - 2050 → "hai nghìn không trăm năm mươi"
  - 1 000 005 → "một triệu không trăm linh năm" (lớp ở giữa toàn chữ số 0 thì bỏ qua lớp đó). Tài liệu chưa thống nhất cách đọc ca này, nên câu hỏi "Cách đọc / Viết số" **không được sinh số có lớp giữa toàn 0**.
  - 534 636 → "năm trăm ba mươi tư nghìn sáu trăm ba mươi sáu" ("tư" sau "mươi"; chấp nhận cả "bốn" ở `accept`)
  - Không chèn dấu phẩy giữa các lớp.
- `parseValue(text)`:
  - Bỏ đơn vị cuối (cm, dm, m, km, mm, cm², dm², m², ha, km², cm³, dm³, m³, g, kg, yến, tạ, tấn, l, ml, đồng, %, °, °C, tuổi, giờ, phút, giây, viên, cái, quyển…).
  - Hiểu "12 345", "12.345", "12345", "0,5", "0.5", "3/4", "2 3/4" (hỗn số), "-".
  - Quy tắc: có `,` thì `,` là thập phân. Không có `,` mà có `.` + đúng 3 chữ số thì `.` là nhóm nghìn; còn lại `.` là thập phân.
- `sameValue(a, b)`: nếu cả hai parse được thì so |a−b| < 1e-9; nếu không thì so chuỗi đã chuẩn hoá (NFC, hạ chữ, gộp khoảng trắng).

**Chấm** (`grading.ts`), dùng ở MỌI nơi (TestRunner/StudyPage/ResultScreen cũ và mới, `achievementService.updateStats` + `initializeStats`):
- Single/SelectWrong: lựa chọn phải trùng **đúng chuỗi** `correctAnswer`.
- MultipleSelect: so tập.
- ManualInput:
  - `answerKind==='number'`: `sameValue` với `correctAnswer` hoặc bất kỳ phần tử nào trong `accept`.
  - `text`: so chuỗi đã chuẩn hoá.
- Typing: so chuỗi NFC đã trim.
- Order: so mảng.

**Tiến độ** (`progress.ts`), lưu ở `StudentProfile.study?: StudyProgress`:
```ts
interface SkillState { a: number; c: number; m: number; lvl: Level; last: string }   // attempts, firstTryCorrect, mastery 0..1, mức gợi ý, ISO
interface ReviewItem { key: string; skillId: string; q: CompactQuestion; step: 0|1|2|3; due: string }
interface StudyProgress { version: 1; skills: Record<string, SkillState>; review: ReviewItem[];
  days: Record<string, { n: number; c: number }>;   // 'YYYY-MM-DD' giờ địa phương, giữ 60 ngày gần nhất
  streak: { count: number; last: string }; prefs: { tts?: boolean; showAdvanced?: boolean } }
```
- `readStudyProgress(raw)` làm sạch như `games/Piano/progress.ts` `readProgress`: bỏ skill không có trong catalog, kẹp số trong biên, tối đa 80 review.
- `applySession(progress, answers[], mode, now)` là hàm **thuần**.

## 4. Bất biến bắt buộc (`services/generators/invariants.test.ts`)

Chạy **thẳng từng template**, không qua `generateQuestions`, 500 lượt/template. Mỗi lỗi in ra `skillId` + câu mẫu.

1. **Chữ trong đề:**
   - `questionText` không rỗng.
   - Không chứa `undefined|NaN|Infinity|\\n|ai/cái nào|tấtcả|÷|Tìm x|thối`.
   - Không có số nhóm nghìn bằng dấu phẩy/chấm (regex `/\d[,.]\d{3}(?!\d)/`), **trừ** số thập phân hợp lệ khi skill là số thập phân (template khai báo `decimal: true`; kiểm parse ra đúng).
2. **Single/SelectWrong:**
   - Có 2–4 lựa chọn; **không trùng theo `sameValue`**.
   - Single: **đúng 1** lựa chọn `sameValue` với `correctAnswer`, và `correctAnswer` có trong `options`.
3. **Giá trị:** mọi số parse được trong đề/lựa chọn/đáp án đều ≥ 0. Không có template nào được phép số âm.
4. **Không đoán theo vị trí:** với lựa chọn đều là số (≥ 3 lựa chọn), xếp hạng giá trị của đáp án đúng ở **mỗi hạng ≥ 10%** số lượt; vị trí hiển thị (index) mỗi ô ≥ 15%.
5. **ManualInput:**
   - `answerKind:'number'` thì `correctAnswer` parse được.
   - Câu có nhiều đáp án hợp lệ phải liệt kê đủ ở `accept`.
6. **Hình:** `visual.fn` thuộc whitelist; `renderVisual` không ra `NaN`. Lớp ≤ 1 có `visual` thì **bắt buộc có `speech`** đủ ý (đọc cả phép tính / yêu cầu).
7. **Catalog:**
   - `skillId` có trong `SKILLS`, cùng lớp với file.
   - `level ∈ skill.levels`; mỗi skill có template cho mọi `levels`.
   - `advanced` khớp catalog.
8. **Lời giải:** `explanation` ≥ 12 ký tự và không chỉ nhắc lại kết quả. Có ≥ 2 bước tính thì phải có `steps`.
9. `template.check?.(q)` trả `null`. Dùng cho luật riêng: bất đẳng thức tam giác, số dư < số chia, dài > rộng, nhóm so sánh không hoà, mệnh giá tiền đúng lớp…
10. **Đủ câu:** mỗi skill có ≥ 12 câu khác nhau trong 300 lượt (Mầm non ≥ 6). `buildSession` của mọi topic trả **đúng** số câu yêu cầu (20).

Giữ `content.test.ts` (kiểm sau lọc) nhưng sửa kỳ vọng thành "2–4 lựa chọn".

## 5. Bẫy phải biết

- **MathRacing phụ thuộc generator** (`games/MathRacing/cup/questions.ts:3-21`, 19 hàm):
  - Recipe lọc câu bằng regex trên chữ ("Tính nhanh:", "Trung bình cộng của các số", "là bao nhiêu phần trăm", "giá sau khi giảm", `/^\d[\d\s,]* [+−\-×÷:] .../`).
  - `clean()` / `numbers()` giả định nhóm nghìn bằng `,`/space thường. `correctAnswer.replaceAll(',', '')`.
  - **Mỗi khi đổi định dạng số hoặc câu chữ** của các hàm này:
    - sửa recipe sang lọc theo `q.skillId`/`q.level` khi có thể;
    - cho `numbers()`/`clean()` hiểu ` `;
    - thay `replaceAll(',', '')` bằng `parseValue`;
    - chạy `npx vitest run games/MathRacing`.
  - `\s` trong regex JS **có** khớp ` `; còn `[ ,]` thì **không**.
- **TTS với số có khoảng trắng:**
  - "12 345" sẽ bị đọc thành hai số. `questionToSpeech` phải nối nhóm số trước: `/(?<=\d)[\s  ](?=\d{3}(?!\d))/g → ''`.
  - Đọc "0,5" thành "không phẩy năm".
  - Đọc `□`/`?`/`...` thành "ô trống" / "bao nhiêu".
- **Khoá chống trùng** phải gồm `skillId|questionText|options|correct|JSON(visual)` (hoặc hash `visualSvg` với generator cũ). Đừng chỉ dùng text.
- **Bỏ luật "đủ 4 lựa chọn":** câu 2–3 lựa chọn là hợp lệ. Trùng lựa chọn phải sửa trong generator (dùng `single()`/`distinct`), không lọc âm thầm.
- **Lịch sử:**
  - Không lưu `visualSvg` (`baseTenSVG` cũ ~70 KB/câu).
  - `profileService.saveProfiles` bọc try/catch. Gặp `QuotaExceededError` thì nén mạnh hơn (bỏ `questions` của bài cũ hơn 10 bài gần nhất) rồi thử lại 1 lần.
- **Thành tích chủ đề** (`src/data/achievements.json`) dùng khoá `addition|subtraction|multiplication|division|geometry|fractions`, chưa từng khớp topic nào. `updateStats` phải cộng `topicCorrectCount[tag]` theo `q.ops` (và vẫn cộng theo `q.topicId`), chấm bằng `grading.isCorrect`.
- **Hooks:** không gọi hook sau `return` sớm. Không gọi side-effect (`onFinish`) trong updater của `setState`.
- **Chế độ Kiểm tra:** không phát tiếng đúng/sai trước khi nộp bài.
- **Hồ sơ test:**
  - `createProfile` dùng `Date.now()` làm id. Tạo 2 hồ sơ liền nhau sẽ **trùng id** → gán id tay.
  - Chọn học sinh rồi điều hướng SPA bằng `history.pushState` + `popstate`. Reload sẽ mất học sinh đang chọn.
- **Chụp ảnh:** browser pane hay timeout khi ẩn. Dùng Chrome headless qua CDP (mẫu script ở GĐ4.0), `--user-data-dir` riêng.
- **Đồng hồ kiểm tra:** tính theo `Date.now()` khi bắt đầu, không đếm `setInterval` (tab nền bị throttle).

## 6. Các giai đoạn

### GĐ0 — Chuẩn bị & nền móng (không đổi nội dung câu)

- **0.1** Tạo nhánh + tag. Tạo `scripts/study-dump.mjs`:
  - Đóng gói `services/mathEngine.ts` bằng esbuild API (`alias @ → .`; plugin `onLoad` thay `const generators:` → `export const generators:` để gọi thô).
  - In N câu/topic hoặc skill: text | options | đáp án | lời giải.
  - Kèm bảng thống kê: số câu khác nhau / 300 lượt, % bị lọc, phân bố hạng đáp án.
- **0.2** `services/study/value.ts` + `value.test.ts`: `fmt`, `fmtMoney`, `readNumberVN`, `parseValue`, `sameValue`, toàn bộ ca kiểm ở mục 3. Thay `numberToVietnamese` trong `generators/utils.ts` bằng re-export `readNumberVN`.
- **0.3** `services/study/grading.ts` + test. Thay 5 chỗ chấm điểm cũ (RS S5). Sửa `achievementService` cộng theo `ops` (mục 5).
- **0.4** Lịch sử gọn (`compact.ts`):
  - `StudyPage` lưu `compactResult`. `migrateProfile` chạy `migrateHistory` (bỏ `visualSvg`, giữ chi tiết 50 bài gần nhất).
  - `saveProfiles` có try/catch + thử lại.
  - Điền `TestResult.topicIds`.
- **0.5** Sửa nhanh UI cũ (để `main` dùng được nếu dừng giữa chừng):
  - Kiểm tra không phát tiếng (RS S7); ✓ đáp án đúng (S13).
  - Lỗi hooks và `onFinish` (S14); hiển thị `\n`/`steps` (S12).
  - Tối thiểu số câu: Mầm non 5, Lớp 1 8, còn lại 10 (S15).
- **0.6** `questionToSpeech`: thêm luật ở mục 5; TTS ưu tiên `q.speech`.

**Nghiệm thu GĐ0:**
- `npx vitest run` + `npx tsc --noEmit` + `npm run build` xanh.
- `node scripts/study-dump.mjs all 5` chạy được.
- Hồ sơ có 30 bài cũ (tạo giả) sau migrate nhỏ hơn 300 KB.

### GĐ1 — Engine mới (khung kỹ năng; nội dung cũ chạy qua lớp bọc)

- **1.1** `services/study/types.ts`, `catalog.ts` (nhập toàn bộ mục 7), `TOPIC_META`:
  - Mỗi topic có `strand`, `term`, `order`, `icon` (tên icon lucide: `Calculator`, `Shapes`, `Ruler`, `Clock`, `Coins`, `BarChart3`, `Dices`, `Sparkles`, `Palette`, `Sun`).
  - Thêm topic mới vào `TOPICS` (mục 7, đánh dấu MỚI).
- **1.2** `services/generators/kit.ts`:
  - `rint`, `pickOne`, `shuffle` (đều dùng `generatorRandom`).
  - `single({ q, correct, wrong, min?, max?, fmt?, visual?, speech?, steps?, hint? })`: xây đúng 1 đáp án, lọc trùng theo giá trị, lọc âm/ngoài biên, bù bằng `nearby`, xáo trộn.
  - `compare(left, right, {q})` → 3 lựa chọn `>`, `<`, `=` (giữ thứ tự cố định để UI vẽ nút ký hiệu).
  - `yesNo(q, yes)` → `['Đúng','Sai']` hoặc `['Có','Không']`.
  - `input({q, correct, accept?, answerKind})`, `multi(...)`, `order(items, correct)`.
  - `fromTemplates`.
- **1.3** `services/generators/wrongs.ts`, mỗi hàm trả danh sách ứng viên:
  - `nearby(n, spread)`
  - `carryError(a, b, op)` (quên nhớ / quên mượn)
  - `placeError(n)` (×10, :10, lệch một hàng)
  - `swapDigits(n)`, `opError(a, b, op)` (nhầm phép)
  - `offByOne(n)`, `unitError(v, factor)` (quên đổi đơn vị)
  - `remainderError(q, r, d)` (số dư sai nhưng luôn < số chia)
  - `fractionErrors(a/b ± c/d)` (cộng cả tử lẫn mẫu, không quy đồng)
- **1.4** `registry.ts`:
  - Generator cũ chưa chuyển thì bọc thành template "legacy" (`skillId = topicId + '.legacy'`, level 1).
  - Các skill này **có trong catalog dạng ẩn** để invariants tạm bỏ qua mục 7 cho chúng; còn lại mục 1–6 vẫn áp dụng.
- **1.5** `session.ts` `buildSession({ grade, mode, topicIds?, skills?: {skillId, level?, count}[], count, seed? })`:
  - Dedupe theo mục 5.
  - Thử tối đa `count × 20` lượt; thiếu thì lấy thêm từ skill khác cùng topic. Vẫn thiếu thì trả kèm `shortBy`, UI báo.
  - `generateQuestions` cũ gọi `buildSession`.
- **1.6** Bỏ luật 4 lựa chọn. Tạo `invariants.test.ts`, lúc này áp dụng cho template legacy với danh sách lỗi đã biết → `test.fails`/skip **có ghi chú**. Mỗi GĐ2.x phải gỡ phần skip của lớp mình.

**Nghiệm thu GĐ1:** app cũ vẫn chạy. Dump `all` cho thấy câu so sánh `>,<,=` đã xuất hiện (tạm render như 3 lựa chọn thường). MathRacing test xanh.

### GĐ2 — Nội dung theo lớp (mỗi lớp một commit: 2a MN · 2b L1 · 2c L2 · 2d L3 · 2e L4 · 2f L5)

Mỗi lớp làm đúng 6 bước:

1. Chuyển từng file `services/generators/gradeN/*.ts` sang `templates`, gắn `skillId`/`level` theo **mục 7**; tên hàm export cũ giữ nguyên.
2. Sửa **mọi lỗi của lớp đó** trong RS §3 (và các dòng liên quan ở RS §2: S8, S9, S10, S11). Đáp án nhiễu chuyển sang `wrongs.ts`. Số định dạng bằng `fmt`/`fmtMoney`. Ký hiệu theo D5.
3. Kỹ năng **MỚI** trong mục 7 thì viết template mới; kỹ năng ★ thì gắn `advanced`.
4. **Lời giải:**
   - `explanation` 1 câu + `steps` cho bài ≥ 2 bước.
   - Bài cộng/trừ/nhân/chia nhiều chữ số có `visual` **đặt tính dọc** (`columnArithSVG`, viết mới trong kit) ở `steps`.
   - Bài lời văn chuyển động / tổng–hiệu có **sơ đồ đoạn thẳng** (`segmentDiagramSVG`).
   - Phân số có `fractionBarSVG`.
5. `hint` cho mọi template M2–M3 (một câu nhắc cách nghĩ, **không** lộ số đáp án).
6. Chạy nghiệm thu lớp đó.

**Hình mới / sửa trong kit (làm ở lớp đầu tiên cần):**
- `angleSVG` (tia quay ngược chiều kim đồng hồ phía trên đường ngang; tham số `showDegree` mặc định false)
- `protractorSVG(deg)` (thước đo góc đè lên góc, L4)
- `baseTenSVG` (khối trăm vẽ thành tấm 10×10 bằng `<pattern>` hoặc 1 rect + lưới; tối đa ~2 KB; xuống dòng khi > 5 khối)
- `triangleSVG(a, b, c)` (dựng theo đúng 3 cạnh)
- `box3dSVG` (nhãn không bị cắt)
- `rulerSVG(len, {from})` (thước có vạch cm, không in đáp án)
- `numberLineSVG` (không tô nhãn cần tìm)
- `pictographSVG` (biểu đồ tranh L2), `tallySVG` (kiểm đếm)
- `thermometerSVG` (°C L3), `circleParts` (tâm, bán kính, đường kính L3)
- `positionSceneSVG` (trên/dưới/trái/phải L1/MN)
- `solidsSVG` (khối lập phương / hộp / trụ / cầu, MN–L2)
- `netSVG` (hình khai triển L5), `mapScale` (đoạn thẳng có tỉ lệ L5)
- `calendarMonthSVG` (lịch tháng L2), `columnArithSVG`, `segmentDiagramSVG`
- `moneySVG` (thêm tờ 100, 200, 500 đồng)
- Font SVG đổi sang `HubNunito, Nunito, sans-serif`.

**Nghiệm thu mỗi lớp:**
- `npx vitest run services/generators services/study games/MathRacing` xanh, **không còn skip** của lớp đó.
- `node scripts/study-dump.mjs g<N> 10`: soát bằng mắt 10 câu/skill (đúng chính tả, đúng SGK, hình khớp chữ); dán 3 câu mẫu mỗi topic vào commit message hoặc `docs/study-wow/samples-g<N>.md`.
- **Phiên rà soát độc lập** (phiên mới, effort cao, hoặc subagent; **không** để phiên vừa viết code tự chấm). Lý do: test chỉ bắt lỗi cơ học, không bắt được đáp án tính sai, gợi ý lộ đáp án, câu chữ trái SGK. Prompt mẫu:
  > Rà soát CHỈ ĐỌC các generator lớp N của Ôn Luyện như bản `docs/study-review-2026-10-01.md`. Chạy `node scripts/study-dump.mjs g<N> 60` và gọi thẳng template 2000 lượt. Báo: lỗi đúng/sai (kèm file:dòng + câu mẫu), gợi ý/hình lộ đáp án, câu chữ trái SGK, kỹ năng trong `docs/study-wow-plan.md` mục 7 còn thiếu hoặc làm sai mức. Không sửa file.

  Sửa hết lỗi báo về rồi mới sang lớp tiếp theo.

### GĐ3 — Mô hình tiến độ, phiên học, phần thưởng (thuần, có test)

- **3.1** `progress.ts`: `readStudyProgress`, `applySession`.
- **3.2** **Thành thạo:**
  - Điểm câu `s`: 1 nếu đúng lần đầu, 0,5 nếu đúng sau "thử lại" (chỉ Luyện tập), 0 nếu sai.
  - Cập nhật: `m ← m + 0,25·(s − m)`; `a++`; `c += (s===1)`; `last = now`.
- **3.3** **Mức gợi ý `lvl`:**
  - Trong một phiên, 2 câu liên tiếp `s=1` ở mức hiện tại → lên 1 mức (≤ mức max của skill).
  - Có `s=0` → xuống 1 mức (≥ 1).
  - Lưu `lvl` cuối phiên. Câu mới của skill sinh ở `lvl`.
- **3.4** **Trạng thái skill:**
  - `none` (a=0)
  - `learning` (m<0,5)
  - `good` (0,5≤m<0,8, hoặc a<6)
  - `mastered` (m≥0,8 và a≥6)
  - % thành thạo topic = trung bình `m` của skill **không nâng cao** (skill `none` tính 0).
- **3.5** **Ôn câu sai:**
  - Sai (s=0) ở bất kỳ chế độ nào thì thêm/cập nhật `ReviewItem`: `step=0`, `due=now+1 ngày`, lưu `CompactQuestion`.
  - Ở chế độ `review`, đúng một item đã đến hạn thì `step++`, `due += [1,3,7,14][step]` ngày; `step>3` thì xoá.
  - Sai ở `review` thì về `step=0`, +1 ngày.
  - Tối đa 80 item, quá thì bỏ item có `due` xa nhất.
- **3.6** **"Ôn hôm nay"** (`buildSession` mode `daily`):
  - Số câu: Mầm non 6, Lớp 1 8, Lớp 2–5 10.
  - Thành phần:
    - ≤ 40% item ôn đến hạn;
    - 40% skill yếu nhất đã học (`learning`/`good`, m tăng dần, rồi `last` cũ trước);
    - 20% "skill tiếp theo": skill đầu tiên `none`, không nâng cao, theo thứ tự catalog của học kì hiện tại, mức 1.
  - Học kì theo tháng: 9–1 → HK1, 2–5 → HK2, 6–8 → cả năm.
  - Hồ sơ mới: 3 skill đầu học kì.
  - **Chuỗi ngày:** hoàn thành daily ngày D; nếu `streak.last` = D−1 thì `count+1`, nếu = D thì giữ, còn lại về 1.
- **3.7** **Đề ma trận** (mode `matrix`):
  - Chọn HK1 / HK2 / Cả năm; 10, 20 hoặc 30 câu.
  - Tỉ lệ mức M1:M2:M3 = 5:3:2 (hằng số).
  - Skill không nâng cao của học kì, chia theo mạch tỉ lệ số skill, mỗi mạch ≥ 1 câu, xoay vòng skill trong mạch.
  - Thời gian = số câu × (lớp ≤ 2 ? 1,5 : 1) phút.
- **3.8** **Phần thưởng** (`rewards.ts`):
  - `test`/`matrix` ≥ 10 câu: giữ `processTestReward` (sao theo %, gacha 30%).
  - `practice`/`daily`: sao = `min(3, floor(đúng_lần_đầu/4))` + 2 × số skill vừa lên `mastered`; daily xong +2 và gacha 30%.
  - `review`: +1 sao mỗi 5 item được xoá khỏi hàng đợi, không gacha.
  - Phiên < 5 câu: 0 sao.
  - Mọi phiên vẫn ghi `TestResult` (`mode` mới) để `getDailyStarsEarned` / thành tích chạy đúng.
- **3.9** Lưu một lần: `addTestResult(result, gacha, typingScore, study?)` gán `updatedStudent.study = study` trước `updateStudent`.

**Nghiệm thu GĐ3:** `services/study/progress.test.ts` phủ:
- cập nhật m, lên/xuống mức, ngưỡng trạng thái;
- lịch ôn [1, 3, 7, 14], giới hạn 80;
- daily với hồ sơ mới / cũ / không có item ôn;
- streak qua 2 ngày và bỏ 1 ngày;
- ma trận đúng tỉ lệ ±1 câu và đủ mạch;
- sao không vượt trần.

### GĐ4 — Giao diện mới

- **4.0** `scripts/study-shots.mjs`:
  - Chrome headless CDP. Tạo 2 hồ sơ (lớp 1 id `g1kid`, lớp 3 id `g3kid`) qua `import('/Genius-kids/services/profileService.ts')`, chọn học sinh, `pushState`.
  - Chụp 1180×820, 768×1024, 390×844 vào `docs/study-wow/shots/`.
  - Dùng server `devpreview` (port 5190).
- **4.1** Vỏ + trang chủ `/study` (`StudyHome.tsx`, `study.css` dùng `var(--hub-*)`, bọc trong `HubShell section="Ôn Luyện" backText onBack→/mode`). Mục 8.1.
- **4.2** Màn làm bài `/study/play` (`player/Player.tsx`, `QuestionView`, `AnswerChoices`, `CompareChoices`, `YesNoChoices`, `NumberPad`, `OrderAnswer`, `FeedbackPanel`, `ProgressDots`). Mục 8.2. `QuestionView` dùng lại cho xem lại và trang in.
- **4.3** Kết quả `/study/result` (`ResultView.tsx`). Mục 8.3.
- **4.4** Biến thể Mầm non (mục 8.4).
- **4.5** Xoá `TopicSelection.tsx`, `TestRunner.tsx`, `ResultScreen.tsx` cũ khi màn mới đã thay hết. Giữ đường dẫn `/study`, `/study/test` (redirect → `/study/play`), `/study/result`.

**Nghiệm thu GĐ4:**
- Ảnh 3 kích thước cho: trang chủ (hồ sơ mới & hồ sơ có dữ liệu), câu 4 lựa chọn có hình, câu so sánh, câu nhập số, câu sắp xếp, phản hồi sai lần 1 (gợi ý) và lần 2 (lời giải), kết quả, Mầm non.
- 0 lỗi console; không cuộn ngang ở 390px.
- Bấm được hoàn toàn bằng bàn phím: 1–4, Enter, ←/→ trong Kiểm tra.

### GĐ5 — Báo cáo, đề ma trận, in phiếu

- **5.1** `/study/report` (`ReportView.tsx`). Mục 8.5.
- **5.2** Hộp thoại "Đề kiểm tra" (ma trận GĐ3.7) và "Tự chọn đề" (`CustomSessionDialog`).
  - "Tự chọn đề": chọn topic/skill, số câu, chế độ, bật/tắt giờ.
  - "Cốt truyện AI" chỉ hiện khi `aiEnabled` + có key. Câu AI chạy qua `single()` kiểm trùng. Lỗi thì nút "Dùng đề có sẵn".
  - Câu AI không có `skillId` thì không cập nhật thành thạo.
- **5.3** `/study/print` (`PrintSheet.tsx`). Mục 8.6. Xoá `utils/pdfExport.ts` + dependency `jspdf` nếu không còn ai dùng (`grep -r jspdf`).

**Nghiệm thu GĐ5:** ảnh báo cáo (hồ sơ có 3 tuần dữ liệu giả); bản in xem trước (`Page.printToPDF` qua CDP) 2 trang đề + 1 trang đáp án, hình rõ nét.

### GĐ6 — Nghiệm thu tổng & bàn giao

- `npx vitest run` / `tsc` / `build` xanh. Dump `all 5` không còn mẫu lỗi của RS §3.
- Bộ ảnh cuối `docs/study-wow/shots/` + `docs/study-wow/README.md` (tóm tắt thay đổi, ảnh trước/sau).
- Cập nhật memory `study-mode-architecture.md`.
- Hỏi chủ dự án trước khi merge vào `main` / push.

## 7. Danh mục kỹ năng (catalog)

Ký hiệu cột:
- **HK**: học kì.
- **Mức**: các level có template.
- **Nguồn**: `có` = sửa từ code hiện có (file); `MỚI` = viết mới; ★ = `advanced`.
- Mạch: `S`=số & phép tính, `H`=hình học, `Đ`=đo lường, `T`=thống kê, `X`=xác suất, `K`=khám phá (MN).

Phân lớp theo Chương trình Toán GDPT 2018. Mục có (?) cần đối chiếu SGK khi làm.

### Mầm non (5–6 tuổi) — mọi skill HK1, không giờ, đề do TTS dẫn

| Topic | Skill id | Tên | Mạch | Mức | Nguồn / mẫu câu |
|---|---|---|---|---|---|
| mn_counting | mn.count | Đếm đến 10 | S | 1 | có `preschool/counting.ts`; hình đồ vật thật (emoji/SVG), khoá trùng gồm hình |
| mn_counting | mn.numeral | Nhận biết số 0–10 | S | 1 | MỚI: "Đâu là số 7?" 4 ô chữ số lớn |
| mn_counting | mn.more_less | Nhiều hơn – ít hơn – bằng nhau | S | 1,2 | MỚI: 2 nhóm hình, 3 lựa chọn |
| mn_counting | mn.ordinal | Số thứ tự | S | 2 | MỚI: hàng 5 con vật, "Bạn nào đứng thứ ba?" |
| mn_counting | mn.combine | Gộp – tách nhóm | S | 2 | MỚI: "2 quả và 3 quả, tất cả mấy quả?" (không dùng dấu +) |
| mn_counting | mn.pattern | Quy luật | S | 2,3 | MỚI: AB, AAB, ABC — chọn hình tiếp theo |
| mn_shapes | mn.shapes2d | Hình tròn, vuông, tam giác, chữ nhật | H | 1,2 | có `preschool/shapes.ts`; thêm xoay/cỡ/màu, dạng "Hình nào là…?" |
| mn_shapes | mn.shapes3d | Khối cầu, trụ, vuông, chữ nhật | H | 1 | MỚI: đồ vật thật (bóng, lon, hộp) |
| mn_shapes | mn.size | To – nhỏ, cao – thấp, dài – ngắn | Đ | 1 | MỚI |
| mn_shapes | mn.position | Trên – dưới, trước – sau, trái – phải | H | 1,2 | MỚI `positionSceneSVG` |
| mn_colors | mn.colors | Màu sắc | K | 1 | có `preschool/colors.ts`; thêm đồ vật ("Quả chuối màu gì?") |
| mn_time (MỚI) | mn.daytime | Sáng, trưa, chiều, tối · hôm qua, hôm nay, ngày mai | K | 1,2 | MỚI (hình cảnh, không dùng emoji mơ hồ) |

### Lớp 1

| Topic | Skill id | Tên | Mạch | HK | Mức | Nguồn / ghi chú |
|---|---|---|---|---|---|---|
| g1_numbers_5 | g1.count5 | Đếm, đọc, viết 0–5 | S | 1 | 1 | có `numbers5.ts` |
| g1_numbers_5 | g1.compare5 | So sánh trong 5 | S | 1 | 1,2 | có (đang chết) |
| g1_numbers_5 | g1.order5 | Thứ tự, điền dãy | S | 1 | 1,2 | có |
| g1_numbers_10 | g1.count10 | Đếm, đọc, viết 0–10 | S | 1 | 1 | có `numbers10.ts` (tia số không tô đáp án) |
| g1_numbers_10 | g1.compare10 | So sánh, lớn nhất, bé nhất | S | 1 | 1,2 | có (đang chết) |
| g1_numbers_10 | g1.split10 | Mấy và mấy (tách – gộp số) | S | 1 | 1,2 | **sửa** lỗi 4 đáp án cùng đúng: hỏi "6 gồm 2 và mấy?" |
| g1_addition_10 | g1.add10 | Cộng trong 10 | S | 1 | 1,2 | có; `speech` đọc đủ phép tính; ops addition |
| g1_addition_10 | g1.add10_missing | Tìm số trong phép cộng | S | 1 | 2 | có |
| g1_addition_10 | g1.add10_compare | So sánh tổng | S | 1 | 2,3 | có (đang chết) |
| g1_subtraction_10 | g1.sub10 | Trừ trong 10 | S | 1 | 1,2 | có; ops subtraction |
| g1_subtraction_10 | g1.sub10_missing | Tìm số trong phép trừ | S | 1 | 2 | có |
| g1_subtraction_10 | g1.chain10 | Dãy tính hai dấu (5 + 2 − 3) | S | 1 | 2,3 | MỚI |
| g1_subtraction_10 | g1.write_eq | Viết phép tính theo tranh | S | 1 | 2,3 | MỚI: tranh thêm/bớt → chọn phép tính |
| g1_geometry | g1.shapes2d | Hình vuông, tròn, tam giác, chữ nhật | H | 1 | 1,2 | có `grade1/geometry.ts`; thêm hình xoay, đếm hình |
| g1_geometry | g1.shapes3d | Khối lập phương, khối hộp chữ nhật | H | 1 | 1 | MỚI `solidsSVG` |
| g1_geometry | g1.position | Vị trí: trên, dưới, trái, phải, trước, sau, ở giữa | H | 1 | 1,2 | MỚI |
| g1_numbers_20 | g1.numbers20 | Số 11–20: chục và đơn vị, so sánh | S | 2 | 1,2 | có `numbers20.ts`; **bỏ** chẵn/lẻ, bỏ số ngoài 20 |
| g1_numbers_100 | g1.numbers100 | Số đến 100: đọc, viết, chục – đơn vị, số tròn chục | S | 2 | 1,2 | có `numbers100.ts` (đang chỉ có tròn chục) → mở rộng 21–99 |
| g1_numbers_100 | g1.compare100 | So sánh, sắp xếp trong 100 | S | 2 | 1,2 | có (đang chết) |
| g1_numbers_100 | g1.neighbors100 | Số liền trước, liền sau | S | 2 | 1 | MỚI |
| g1_add_sub_100 (MỚI) | g1.addsub100 | Cộng, trừ không nhớ trong 100 | S | 2 | 1,2,3 | MỚI: 2 chữ số ± 1/2 chữ số, tròn chục; ops add/sub |
| g1_operations_20 | g1.addsub20 | Cộng, trừ không qua 10 trong 20 | S | 2 | 1,2 | có `operations20.ts`, lọc bỏ qua 10 |
| g1_operations_20 | g1.carry20 ★ | Cộng, trừ qua 10 | S | 2 | 2 | có (chuyển ★) |
| g1_length | g1.length_cm | Đo độ dài bằng thước (cm) | Đ | 2 | 1,2 | có; `rulerSVG` không in đáp án |
| g1_length | g1.length_compare | Dài hơn, ngắn hơn | Đ | 2 | 1 | có (đang chết) |
| g1_length | g1.length_ops | Cộng, trừ số đo cm | Đ | 2 | 2 | MỚI |
| g1_clock | g1.clock | Xem giờ đúng | Đ | 2 | 1,2 | có `clock.ts`; đề không nói sẵn giờ |
| g1_time | g1.weekday | Ngày trong tuần, hôm qua – ngày mai | Đ | 2 | 1,2 | có `grade1/time.ts` |
| g1_time | g1.calendar_day | Đọc tờ lịch (thứ, ngày) | Đ | 2 | 1 | MỚI |
| g1_time | g1.daytime | Buổi trong ngày | Đ | 2 | 1 | có (sửa emoji → hình cảnh) |
| g1_word_problems | g1.word10 | Bài toán thêm, bớt trong 10 | S | 1 | 2,3 | có `wordProblems.ts`; có hình minh hoạ |
| g1_word_problems | g1.word100 | Bài toán một bước trong 100 (không nhớ) | S | 2 | 2,3 | có, lọc bỏ qua 10 |

### Lớp 2

| Topic | Skill id | Tên | Mạch | HK | Mức | Nguồn / ghi chú |
|---|---|---|---|---|---|---|
| g2_add_sub_20 (MỚI) | g2.addsub20 | Bảng cộng, bảng trừ qua 10 | S | 1 | 1,2 | MỚI (chuyển từ g1.carry20) |
| g2_add_sub_no_carry | g2.addsub100_nc | Cộng, trừ không nhớ trong 100 | S | 1 | 1,2 | có; thêm dạng tìm ?, đặt tính |
| g2_add_sub_carry | g2.addsub100_c | Cộng, trừ có nhớ trong 100 | S | 1 | 1,2,3 | có; `columnArithSVG` ở lời giải; sửa "lớn hơn 10" → "từ 10 trở lên" |
| g2_add_sub_carry | g2.chain | Dãy tính hai dấu | S | 1 | 2 | MỚI |
| g2_arithmetic_advanced | g2.terms | Số hạng – tổng, số bị trừ – số trừ – hiệu | S | 1 | 1 | MỚI (hỏi tên thành phần) |
| g2_arithmetic_advanced | g2.missing | Tìm số hạng, số bị trừ, số trừ | S | 1 | 2 | có `arithmetic.ts` |
| g2_arithmetic_advanced | g2.compare_expr | Điền >, <, = | S | 1 | 2 | có (đang chết) |
| g2_arithmetic_advanced | g2.word_more_less | Bài toán nhiều hơn, ít hơn | S | 1 | 2,3 | có |
| g2_units_measure | g2.kg | Ki-lô-gam: nặng hơn, nhẹ hơn | Đ | 1 | 1,2 | có (đang chết) |
| g2_units_measure | g2.liter | Lít | Đ | 1 | 1,2 | có |
| g2_units_measure | g2.length | dm, m, km: đổi, ước lượng | Đ | 2 | 1,2 | có `units.ts`; thêm dm, km |
| g2_time_calendar | g2.clock | Xem đồng hồ (kim phút chỉ 3, 6) | Đ | 1 | 1,2 | có `grade2/time.ts` |
| g2_time_calendar | g2.hours_day | Ngày – giờ, 13 giờ = 1 giờ chiều | Đ | 1 | 1,2 | MỚI |
| g2_time_calendar | g2.calendar_month | Lịch tháng, số ngày trong tháng | Đ | 1 | 1,2 | MỚI `calendarMonthSVG` (bỏ "Tháng 20") |
| g2_geometry_basic | g2.points_lines | Điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng | H | 1 | 1,2 | MỚI |
| g2_geometry_basic | g2.polyline | Đường gấp khúc, độ dài đường gấp khúc | H | 1 | 1,2 | MỚI |
| g2_geometry_basic | g2.quadrilateral | Hình tứ giác, đếm hình | H | 1 | 1,2 | có (mở rộng) |
| g2_geometry_basic | g2.shapes3d | Khối trụ, khối cầu | H | 2 | 1 | có (sửa vẽ khối trụ) |
| g2_multiplication | g2.mul_meaning | Phép nhân: thừa số, tích | S | 2 | 1,2 | có; ops multiplication |
| g2_multiplication | g2.mul_table | Bảng nhân 2, bảng nhân 5 | S | 2 | 1,2 | có (lọc chỉ 2, 5) |
| g2_multiplication | g2.mul_table34 ★ | Bảng nhân 3, 4 | S | 2 | 1,2 | có (★) |
| g2_division | g2.div_meaning | Phép chia: số bị chia, số chia, thương | S | 2 | 1,2 | có; ops division |
| g2_division | g2.div_table | Bảng chia 2, bảng chia 5 | S | 2 | 1,2 | có (lọc chỉ 2, 5) |
| g2_division | g2.div_table34 ★ | Bảng chia 3, 4; tìm số bị chia | S | 2 | 2 | có (★) |
| g2_numbers_1000 | g2.numbers1000 | Số đến 1000: trăm – chục – đơn vị, tròn trăm, tia số | S | 2 | 1,2 | có; `baseTenSVG` mới |
| g2_numbers_1000 | g2.compare1000 | So sánh, sắp xếp | S | 2 | 1,2 | có (đang chết; M2 cùng hàng trăm) |
| g2_add_sub_1000 (MỚI) | g2.addsub1000 | Cộng, trừ trong 1000 (không nhớ, có nhớ một lần) | S | 2 | 1,2,3 | MỚI |
| g2_money | g2.money | Tiền Việt Nam: 100, 200, 500, 1000 đồng | Đ | 2 | 1,2 | có `money.ts` (thu về phạm vi 1000) |
| g2_money | g2.money_big ★ | Tiền đến 50 000 đồng | Đ | 2 | 2 | có (★) |
| g2_statistics (MỚI) | g2.tally | Thu thập, kiểm đếm | T | 2 | 1,2 | MỚI `tallySVG` |
| g2_statistics (MỚI) | g2.pictograph | Biểu đồ tranh | T | 2 | 1,2 | MỚI `pictographSVG` |
| g2_probability (MỚI) | g2.chance | Chắc chắn, có thể, không thể | X | 2 | 1,2 | MỚI (hộp bi, túi kẹo) |

### Lớp 3

| Topic | Skill id | Tên | Mạch | HK | Mức | Nguồn / ghi chú |
|---|---|---|---|---|---|---|
| g3_multiplication | g3.mul_tables | Bảng nhân 3, 4, 6, 7, 8, 9 | S | 1 | 1,2 | có (tách riêng); ops multiplication |
| g3_multiplication | g3.mul_1digit | Nhân số có 2, 3 chữ số với số có 1 chữ số | S | 1 | 1,2,3 | có (nhớ ≤ 1 lượt) |
| g3_multiplication | g3.times_more | Gấp một số lên nhiều lần | S | 1 | 2,3 | MỚI |
| g3_multiplication | g3.mul_2digit ★ | Nhân với số có 2 chữ số | S | 1 | 2 | có (★) |
| g3_division | g3.div_tables | Bảng chia 3–9 | S | 1 | 1,2 | có (sửa: thương trong bảng) |
| g3_division | g3.div_1digit | Chia cho số có 1 chữ số, chia có dư | S | 1 | 1,2,3 | có (`check`: số dư < số chia) |
| g3_division | g3.times_less | Giảm một số đi nhiều lần | S | 1 | 2,3 | MỚI |
| g3_division | g3.how_many_times | Số lớn gấp mấy lần số bé, số bé bằng một phần mấy số lớn | S | 1 | 2,3 | MỚI |
| g3_expressions (MỚI) | g3.expression | Biểu thức số, thứ tự thực hiện, dấu ngoặc | S | 1 | 1,2,3 | MỚI |
| g3_expressions (MỚI) | g3.missing | Tìm thừa số, số bị chia, số chia | S | 1 | 2 | MỚI |
| g3_fractions | g3.unit_fraction | Một phần hai … một phần chín (hình) | S | 1 | 1 | có (thêm 1/2, 1/9); ops fractions |
| g3_fractions | g3.fraction_of | Một phần mấy của một số | S | 1 | 2,3 | có |
| g3_fractions | g3.fraction_ab ★ | Phân số a/b | S | 1 | 2 | có (★) |
| g3_geometry | g3.midpoint | Điểm ở giữa, trung điểm | H | 1 | 1,2 | MỚI |
| g3_geometry | g3.circle | Hình tròn: tâm, bán kính, đường kính | H | 1 | 1,2 | MỚI `circleParts` |
| g3_geometry | g3.right_angle | Góc vuông, góc không vuông (ê-ke) | H | 1 | 1 | có (đang chết) |
| g3_geometry | g3.polygon | Tam giác, tứ giác: đỉnh, cạnh, góc | H | 1 | 1,2 | có (sửa) |
| g3_geometry | g3.rect_square | Đặc điểm hình chữ nhật, hình vuông | H | 1 | 1 | có |
| g3_geometry | g3.solids | Khối lập phương, khối hộp chữ nhật: mặt, đỉnh, cạnh | H | 1 | 1,2 | MỚI |
| g3_measurements | g3.small_units | mm, g, ml: đổi và dùng trong tình huống | Đ | 1 | 1,2,3 | có (sửa lựa chọn vô lý) |
| g3_measurements | g3.temperature | Nhiệt độ °C | Đ | 1 | 1 | MỚI `thermometerSVG` |
| g3_numbers | g3.numbers10000 | Số đến 10 000: đọc, viết, cấu tạo | S | 2 | 1,2 | có (sửa "không trăm", "linh") |
| g3_numbers | g3.numbers100000 | Số đến 100 000 | S | 2 | 1,2 | MỚI |
| g3_numbers | g3.compare | So sánh, sắp xếp, lớn nhất, bé nhất | S | 2 | 1,2 | có (đang chết) |
| g3_numbers | g3.round | Làm tròn đến chục, trăm, nghìn, mười nghìn | S | 2 | 2 | có (lựa chọn đều là số tròn) |
| g3_numbers | g3.roman | Chữ số La Mã I–XX | S | 2 | 1,2 | MỚI |
| g3_arithmetic | g3.addsub100000 | Cộng, trừ trong 100 000 | S | 2 | 1,2,3 | có (sửa câu lời văn) |
| g3_arithmetic | g3.muldiv_big | Nhân, chia số đến 5 chữ số với số có 1 chữ số | S | 2 | 1,2 | MỚI |
| g3_area | g3.perimeter | Chu vi tam giác, tứ giác, hình chữ nhật, hình vuông | H | 2 | 1,2,3 | có (`check` tam giác hợp lệ, dài > rộng) |
| g3_area | g3.area_cm2 | Diện tích: cm², đếm ô, hình chữ nhật, hình vuông | Đ | 2 | 1,2,3 | có (+ đếm ô) |
| g3_time (MỚI) | g3.clock_minute | Xem đồng hồ đến từng phút | Đ | 2 | 1,2 | có (từ measurements, sửa) |
| g3_time (MỚI) | g3.month_year | Tháng – năm, số ngày trong tháng | Đ | 2 | 1,2 | MỚI |
| g3_time (MỚI) | g3.duration | Khoảng thời gian | Đ | 2 | 2,3 | có (bỏ lựa chọn "0 giờ") |
| g3_money | g3.money | Tiền đến 100 000 đồng, tiền trả lại | Đ | 2 | 1,2,3 | có |
| g3_statistics | g3.data_table | Bảng số liệu (đọc, so sánh, tổng) | T | 2 | 1,2 | có → đổi biểu đồ cột thành bảng; `check` không hoà |
| g3_statistics | g3.bar_chart ★ | Biểu đồ cột | T | 2 | 2 | có (★) |
| g3_probability (MỚI) | g3.chance | Khả năng xảy ra | X | 2 | 1,2 | MỚI |
| g3_word_problems | g3.word_2step | Bài toán hai bước (gấp, giảm, một phần mấy, mua bán) | S | 2 | 2,3 | có (bỏ "\n", sửa lựa chọn) |
| g3_word_problems | g3.sum_diff ★ | Tổng – hiệu | S | 2 | 3 | có (★) |

### Lớp 4

| Topic | Skill id | Tên | Mạch | HK | Mức | Nguồn / ghi chú |
|---|---|---|---|---|---|---|
| g4_large_numbers | g4.read_write | Đọc, viết số đến lớp triệu | S | 1 | 1,2 | có (dùng `readNumberVN`) |
| g4_large_numbers | g4.place_class | Hàng và lớp, giá trị chữ số | S | 1 | 1,2 | có |
| g4_large_numbers | g4.compare | So sánh, sắp xếp | S | 1 | 1,2 | có (đang chết) |
| g4_large_numbers | g4.round | Làm tròn đến hàng trăm nghìn | S | 1 | 2 | có (lựa chọn đều là số tròn) |
| g4_large_numbers | g4.even_odd | Số chẵn, số lẻ | S | 1 | 1,2 | MỚI |
| g4_add_sub | g4.addsub | Cộng, trừ số nhiều chữ số | S | 1 | 1,2,3 | có ("?" thay x) |
| g4_add_sub | g4.properties_add | Tính chất giao hoán, kết hợp; tính nhanh | S | 1 | 2,3 | MỚI |
| g4_add_sub | g4.letter_expr | Biểu thức chứa chữ | S | 1 | 2 | MỚI |
| g4_angles | g4.angle_types | Góc nhọn, vuông, tù, bẹt | H | 1 | 1 | có (`angleSVG` mới, không in độ) |
| g4_angles | g4.angle_measure | Đo góc bằng thước đo góc | H | 1 | 2 | có → `protractorSVG` |
| g4_angles | g4.angle_compare | So sánh góc | H | 1 | 2 | có (đang chết) |
| g4_lines | g4.perp_parallel | Hai đường thẳng vuông góc, song song | H | 1 | 1,2 | có (mở rộng nhiều hình, ≥ 12 câu) |
| g4_units | g4.mass | Yến, tạ, tấn | Đ | 1 | 1,2 | MỚI |
| g4_units | g4.area_units | dm², m², mm² | Đ | 1 | 1,2 | có (mở rộng) |
| g4_units | g4.time_units | Giây, thế kỉ | Đ | 1 | 1,2 | MỚI |
| g4_multiplication | g4.mul | Nhân với số có 1, 2 chữ số | S | 2 | 1,2,3 | có; ops multiplication |
| g4_multiplication | g4.mul10 | Nhân với 10, 100, 1000; số tròn chục | S | 2 | 1,2 | MỚI |
| g4_multiplication | g4.properties_mul | Giao hoán, kết hợp, nhân một số với một tổng/hiệu | S | 2 | 2,3 | MỚI |
| g4_division | g4.div | Chia cho số có 1, 2 chữ số | S | 2 | 1,2,3 | có; ops division |
| g4_division | g4.div10 | Chia cho 10, 100, 1000 | S | 2 | 1,2 | MỚI |
| g4_parentheses | g4.expr | Biểu thức có ngoặc | S | 2 | 2,3 | có (":" thay "÷"; so sánh hết chết) |
| g4_average | g4.average | Trung bình cộng | S | 2 | 2,3 | có (sửa ngữ cảnh "điểm 10") |
| g4_word_problems | g4.sum_diff | Tìm hai số khi biết tổng và hiệu | S | 2 | 2,3 | có |
| g4_word_problems | g4.unit_rate | Bài toán rút về đơn vị | S | 2 | 2,3 | MỚI |
| g4_word_problems | g4.word_multi | Bài toán 2–3 bước | S | 2 | 3 | có (vị trí đáp án) |
| g4_fractions | g4.fraction_concept | Phân số: tử số, mẫu số, đọc, viết | S | 2 | 1 | có; ops fractions |
| g4_fractions | g4.fraction_equiv | Tính chất cơ bản, rút gọn | S | 2 | 1,2 | có (kết quả rút gọn) |
| g4_fractions | g4.fraction_common | Quy đồng (mẫu này chia hết cho mẫu kia) | S | 2 | 2 | MỚI |
| g4_fractions | g4.fraction_compare | So sánh phân số | S | 2 | 1,2 | có (đang chết) |
| g4_fraction_ops | g4.frac_addsub | Cộng, trừ phân số (cùng mẫu / mẫu chia hết) | S | 2 | 1,2 | có (không âm, rút gọn) |
| g4_fraction_ops | g4.frac_mul | Nhân phân số | S | 2 | 1,2 | có |
| g4_fraction_ops | g4.frac_div | Chia phân số | S | 2 | 2 | MỚI |
| g4_fraction_ops | g4.fraction_of | Tìm phân số của một số | S | 2 | 2,3 | MỚI |
| g4_fraction_ops | g4.frac_addsub_any ★ | Cộng, trừ phân số khác mẫu tuỳ ý | S | 2 | 2 | có (★, quy đồng theo mẫu số chung nhỏ nhất) |
| g4_geometry_2d | g4.para_rhombus_id | Nhận biết hình bình hành, hình thoi | H | 2 | 1,2 | MỚI |
| g4_geometry_2d | g4.rect_word | Chu vi, diện tích hình chữ nhật, hình vuông, hình ghép | H | 2 | 2,3 | có (sửa đơn vị m/cm, có kết quả trong lời giải) |
| g4_para_rhombus ★ | g4.para_area ★ | Diện tích hình bình hành, hình thoi | H | 2 | 2 | có (cả topic ★) |
| g4_statistics | g4.data_series | Dãy số liệu thống kê | T | 2 | 1,2 | MỚI |
| g4_statistics | g4.bar_chart | Biểu đồ cột | T | 2 | 1,2,3 | có (lớn nhất/nhỏ nhất 4 cột, không có "−1") |
| g4_statistics | g4.events | Số lần xuất hiện của một sự kiện | X | 2 | 1,2 | MỚI |
| g4_patterns | g4.sequence | Dãy số theo quy luật | S | 1 | 2,3 | có (thêm quy luật nhân, xen kẽ) |
| g4_divisibility ★ | g4.divisibility ★ | Dấu hiệu chia hết cho 2, 3, 5, 9 | S | 2 | 2 | có (cả topic ★; `accept` đủ chữ số hợp lệ) |

### Lớp 5

| Topic | Skill id | Tên | Mạch | HK | Mức | Nguồn / ghi chú |
|---|---|---|---|---|---|---|
| g5_fractions | g5.decimal_fraction | Phân số thập phân | S | 1 | 1 | MỚI; ops fractions |
| g5_fractions | g5.mixed_number | Hỗn số (?) | S | 1 | 1,2 | MỚI (đối chiếu SGK lớp 5 bộ 2018; nếu không có bài Hỗn số thì gắn ★) |
| g5_fractions | g5.frac_addsub | Cộng, trừ phân số khác mẫu | S | 1 | 1,2 | có (mở rộng khác mẫu) |
| g5_fractions | g5.frac_muldiv | Nhân, chia phân số | S | 1 | 1,2 | có (không có 2 lựa chọn tương đương) |
| g5_fractions | g5.frac_compare | So sánh phân số | S | 1 | 1,2 | có (đang chết) |
| g5_numbers | g5.decimal_read | Số thập phân: đọc, viết, hàng | S | 1 | 1,2 | có |
| g5_numbers | g5.decimal_compare | So sánh, sắp xếp số thập phân | S | 1 | 1,2 | có (đang chết) |
| g5_numbers | g5.decimal_round | Làm tròn số thập phân | S | 1 | 2 | MỚI |
| g5_numbers | g5.measure_decimal | Viết số đo dạng số thập phân | Đ | 1 | 2 | MỚI |
| g5_decimal_ops | g5.dec_addsub | Cộng, trừ số thập phân | S | 1 | 1,2 | có |
| g5_decimal_ops | g5.dec_mul | Nhân số thập phân | S | 1 | 1,2 | có |
| g5_decimal_ops | g5.dec_div | Chia số thập phân | S | 1 | 1,2 | có |
| g5_decimal_ops | g5.dec_shift | Nhân, chia với 10, 100, 1000; 0,1; 0,01 | S | 1 | 1,2 | MỚI |
| g5_measurements | g5.area_units_big | ha, km², m² … mm² | Đ | 1 | 1,2 | có (sửa trùng, lựa chọn không theo ×10) |
| g5_measurements | g5.volume_units | cm³, dm³, m³, lít | Đ | 2 | 1,2 | có (đang chết) |
| g5_ratios | g5.ratio | Tỉ số | S | 1 | 1,2 | có (`accept` cả 4:6 và 2:3) |
| g5_ratios | g5.percent | Tỉ số phần trăm, tìm % của một số | S | 1 | 1,2,3 | có (giá trị đúng tuyệt đối, không làm tròn ngầm) |
| g5_ratios | g5.map_scale | Tỉ lệ bản đồ | Đ | 1 | 2,3 | MỚI |
| g5_ratios | g5.sum_diff_ratio | Tổng – tỉ, hiệu – tỉ (?) | S | 1 | 3 | MỚI (đối chiếu SGK lớp 5) |
| g5_ratios | g5.interest ★ | Lãi suất, tăng rồi giảm % | S | 1 | 3 | có (★) |
| g5_geometry | g5.triangle_area | Diện tích hình tam giác | H | 2 | 1,2 | có (đang chết vì trùng) |
| g5_geometry | g5.trapezoid_area | Diện tích hình thang | H | 2 | 1,2 | có (đang chết vì trùng) |
| g5_geometry | g5.circle | Hình tròn: đường kính, chu vi, diện tích | H | 2 | 1,2,3 | có (đơn vị trong đáp án) |
| g5_geometry | g5.solid_area | Diện tích xung quanh, toàn phần | H | 2 | 2,3 | có (sửa trùng ở cạnh 3, 4, 6) |
| g5_geometry | g5.volume | Thể tích hình hộp chữ nhật, hình lập phương | H | 2 | 1,2,3 | có |
| g5_geometry | g5.nets | Hình khai triển | H | 2 | 1 | MỚI `netSVG` |
| g5_geometry | g5.para_area ★ | Diện tích hình bình hành | H | 2 | 2 | có (★) |
| g5_time_ops | g5.time_addsub | Cộng, trừ số đo thời gian | Đ | 2 | 1,2 | có |
| g5_time_ops | g5.time_muldiv | Nhân, chia số đo thời gian | Đ | 2 | 2 | có (+ chia) |
| g5_word_problems | g5.motion | Vận tốc, quãng đường, thời gian | S | 2 | 1,2,3 | có (đang chết 89% → mở lại; giá trị đúng) |
| g5_word_problems | g5.motion_two | Hai chuyển động: gặp nhau, đuổi kịp | S | 2 | 3 | có |
| g5_word_problems | g5.work_together ★ | Làm chung công việc | S | 2 | 3 | có (★, chỉ số chia hết) |
| g5_word_problems | g5.stream ★ | Xuôi dòng, ngược dòng | S | 2 | 3 | có (★) |
| g5_parentheses | g5.expr | Biểu thức có ngoặc (số lớn) | S | 1 | 2,3 | có (":" thay "÷") |
| g5_statistics | g5.pie_chart | Biểu đồ hình quạt tròn | T | 2 | 1,2 | có |
| g5_statistics | g5.bar_read | Biểu đồ cột có tiêu đề, đơn vị | T | 2 | 1,2 | có (thêm tiêu đề/đơn vị; trung bình cộng không mơ hồ) |
| g5_statistics | g5.chance_ratio | Tỉ số mô tả số lần lặp lại của một khả năng | X | 2 | 2 | MỚI |

Topic luyện gõ (`*_typing`) giữ nguyên, không vào catalog; trang chủ xếp vào mục "Luyện gõ phím".

## 8. Spec giao diện

### 8.1 Trang chủ `/study`

Bọc trong `HubShell` (`section="Ôn Luyện"`, `backText`, `onBack → /mode`, có hồ sơ/cửa hàng như PreschoolShell). Nền `var(--hub-bg)`, chữ `var(--hub-ink)`. Từ trên xuống:

1. **Thẻ "Ôn hôm nay"** (rộng toàn hàng, cao ~220px trên tablet):
   - Tranh `/Genius-kids/hub/art/study.webp` (bản `-sm` cho < 768px) bên phải.
   - Trái: eyebrow "Mỗi ngày một chút"; tiêu đề "Ôn hôm nay"; dòng "10 câu · 3 câu ôn lại · kỹ năng mới: Bảng nhân 6"; chuỗi ngày 🔥 n.
   - Nút chính "Bắt đầu" (cao 56px, nền `--hub-accent`). Hoàn thành rồi thì hiện "Đã xong hôm nay ✓ — Làm thêm".
2. **Hàng nút phụ** (chip lớn 48px, cuộn ngang trên điện thoại): "Ôn câu sai (n)" (ẩn khi n=0), "Đề kiểm tra", "Tự chọn đề", "In phiếu", "Báo cáo".
3. **Các mạch** theo thứ tự S, H, Đ, T, X (Mầm non: S, H, K), rồi "Nâng cao" (thu gọn mặc định, nhớ trạng thái trong `study.prefs.showAdvanced`), rồi "Luyện gõ phím" (lớp ≥ 2).
   - Mỗi mạch có tiêu đề + mô tả 1 dòng, lưới thẻ topic: 3 cột ≥ 1024, 2 cột ≥ 600, 1 cột.
   - **Thẻ topic**: icon trong ô vuông bo 14px nền `--hub-tint`; tên (SGK); nhãn "HK1/HK2"; vòng thành thạo 44px (% của mục 3.4, màu `--hub-accent`, nền `--hub-line`); dòng trạng thái ("Chưa học" / "Đang học 3/5 kỹ năng" / "Thành thạo ⭐").
   - Chạm thẻ thì mở **TopicSheet**.
4. **TopicSheet** (`HubDialog`): danh sách kỹ năng (tên, thanh m, trạng thái, mức hiện tại M1–M3) + 2 nút "Luyện tập" (phiên 10 câu thích ứng theo các skill của topic, ưu tiên skill yếu) và "Kiểm tra nhanh" (10 câu, có giờ). Chạm một kỹ năng thì có nút "Luyện riêng kỹ năng này".

### 8.2 Màn làm bài `/study/play`

- **Thanh trên** (cao 64px):
  - Nút thoát (hỏi xác nhận).
  - `ProgressDots` (mỗi câu một chấm; Luyện tập tô xanh/đỏ, Kiểm tra tô "đã làm").
  - Đồng hồ (chỉ Kiểm tra/ma trận; ≤ 30 giây thì đổi màu, không nhấp nháy).
  - Nút loa (luôn có; lớp ≤ 1 tự đọc).
- **Bố cục:**
  - ≥ 1024 ngang và câu có hình: **2 cột 55/45**. Trái: panel hình (nền trắng, bo 20px, cao tối đa `calc(100dvh − 200px)`, hình co vừa). Phải: đề (28px, đậm 800) + đáp án + nút.
  - Không có hình: 1 cột, rộng tối đa 760px, căn giữa.
  - < 1024: 1 cột, hình trên (cao tối đa 40dvh).
- **Đáp án theo dạng:**
  - 4 lựa chọn: lưới 2×2, ô cao ≥ 72px (điện thoại 56px), chữ 22px, nhãn A–D.
  - `compare`: 3 nút vuông 96px ký hiệu `>` `<` `=` cỡ 48px.
  - `yesNo`: 2 nút rộng "Đúng" / "Sai" (hoặc Có/Không).
  - `answerKind:'number'`: ô hiển thị + `NumberPad` 3×4 (1–9, `,`, 0, ⌫) + nút "Xong"; phím cứng vẫn gõ được. `/` hiện khi đáp án là phân số.
  - `Order`: thẻ kéo thả (pointer events), có thêm cách chạm 2 thẻ để đổi chỗ; nút "Xong".
  - MultipleSelect: ô có checkbox, nhãn "Chọn tất cả đáp án đúng".
- **Luyện tập:**
  - Chọn xong bấm **"Trả lời"** (không dùng chữ "Kiểm tra").
  - Đúng: ô xanh `#e3f3e8`/viền `#2f8f5b` + hiệu ứng nảy 180ms + pháo giấy nhẹ (12 mảnh CSS, tắt khi `prefers-reduced-motion`) + tiếng đúng; `FeedbackPanel` "Chính xác!" + `explanation`; nút "Tiếp" (Enter).
  - Sai lần 1: rung 240ms + `FeedbackPanel` cam "Chưa đúng, thử lại nhé" + `hint` (nếu có); bỏ chọn, cho làm lại 1 lần.
  - Sai lần 2: tô đáp án đúng, `FeedbackPanel` đỏ nhạt với `steps` (danh sách đánh số, hình ở `steps` nếu có).
- **Kiểm tra:**
  - Không có tiếng đúng/sai, không lộ đáp án.
  - "Câu tiếp" / "Câu trước"; nút lưới câu để nhảy.
  - "Nộp bài" hỏi xác nhận nếu còn câu chưa làm. Hết giờ tự nộp.
- **Phím tắt:** 1–4 / A–D chọn; Enter = Trả lời/Tiếp; ←/→ chuyển câu (Kiểm tra); số và ⌫ cho NumberPad.
- Tương tác ≥ 48px, `:focus-visible` viền `#bd783a` như hub, `aria-live="polite"` cho FeedbackPanel.

### 8.3 Kết quả `/study/result`

- **Đầu trang:** vòng điểm lớn (đúng/tổng, %), sao nhận được, thời gian `mm:ss`, câu khen theo mức (giữ giọng vui, không chê).
- **Theo kỹ năng:** bảng (tên kỹ năng | đúng/tổng | thanh m trước → sau, có ▲/▼) + chip "Lên Thành thạo ⭐" khi có.
- **Nút:**
  - "Làm lại câu sai" (phiên mới từ các câu sai, mode `review`, không sao);
  - "Luyện tiếp kỹ năng yếu";
  - "Về Ôn Luyện".
- **Xem lại:** danh sách thu gọn, mở từng câu bằng `QuestionView` chỉ đọc (đủ Markdown/KaTeX/hình, kèm lựa chọn của bé và lời giải).

### 8.4 Mầm non

- Mặc định đọc đề (không tắt hẳn được, chỉ tắt tạm 1 phiên). Đề hiện ngắn 1 dòng, cỡ 32px.
- Đáp án là ô lớn 120px (số / hình / màu). Phiên 6 câu, không giờ, không có chế độ Kiểm tra / ma trận.
- Sai thì đọc gợi ý; đúng thì đọc lời khen ngẫu nhiên ("Giỏi quá!", "Đúng rồi!").
- Trang chủ chỉ có thẻ "Ôn hôm nay" + 4 topic (mn_counting, mn_shapes, mn_colors, mn_time).

### 8.5 Báo cáo `/study/report`

- **14 ngày gần nhất:** biểu đồ cột (recharts) số câu/ngày, cột tô theo tỉ lệ đúng; tổng câu, % đúng, chuỗi ngày.
- **Theo mạch:** thanh % thành thạo từng mạch.
- **Cần luyện thêm:** 5 kỹ năng m thấp nhất đã học (nút "Luyện ngay").
- **Đã thành thạo:** số lượng + danh sách thu gọn.
- **Câu sai gần đây:** 5 item ôn đến hạn sớm nhất.
- **Bài kiểm tra gần đây:** 10 bài (ngày, chế độ, điểm).
- Nút "In báo cáo" (dùng chung CSS in của 8.6).

### 8.6 Trang in `/study/print`

- **Tuỳ chọn** (ẩn khi in): kỹ năng/topic (mặc định 3 kỹ năng yếu nhất), số câu 10/20/30, kèm đáp án (mặc định bật), mức độ.
- **Trang đề A4:** tiêu đề "Phiếu bài tập Toán — Lớp N", dòng "Họ và tên… Ngày… Điểm…". Câu đánh số, 2 cột (`column-count:2; break-inside:avoid`), lựa chọn A–D cùng hàng nếu ngắn, hình SVG ≤ 45% cột.
- **Trang đáp án** (`break-before: page`): bảng gọn "Câu | Đáp án | Lời giải ngắn".
- Nút "In / Lưu PDF" gọi `window.print()`. `@media print` ẩn header/nút, chữ đen, khổ A4 lề 12mm.

## 9. Kiểm thử & ảnh bắt buộc theo giai đoạn (tóm tắt)

| GĐ | Test mới | Ảnh |
|---|---|---|
| 0 | value, grading, compact, questionSpeech (mở rộng) | — |
| 1 | invariants (khung), session | — |
| 2x | invariants của lớp không còn skip; MathRacing xanh | ảnh 6 hình mới / sửa của lớp (render bằng CDP) |
| 3 | progress, rewards | — |
| 4 | (component test tuỳ chọn) | bộ ảnh mục GĐ4 |
| 5 | session matrix | báo cáo + PDF in |
| 6 | toàn bộ | bộ ảnh cuối |

## 10. Ước lượng & thứ tự commit

GĐ0 (6 commit nhỏ) → GĐ1 (3–4) → GĐ2a…2f (6 commit lớn, mỗi cái ~8–12 file generator) → GĐ3 (2) → GĐ4 (4–5) → GĐ5 (3) → GĐ6 (1).

Phần cần suy nghĩ nhiều nhất là **GĐ2** (viết dạng câu mới + lời giải). Nên làm với effort trung bình trở lên. Các GĐ còn lại đã đủ cụ thể để làm với effort thấp.

**Chia phiên đề xuất** (mỗi phiên vừa một ngữ cảnh, kết thúc bằng commit xanh):

| Phiên | Phạm vi | Effort |
|---|---|---|
| 1 | GĐ0.1–0.3 | medium |
| 2 | GĐ0.4–0.6 | medium |
| 3 | GĐ1.1–1.3 | medium |
| 4 | GĐ1.4–1.6 | medium |
| 5–7 | GĐ2a Mầm non + GĐ2b Lớp 1 (mỗi lớp: chuyển + sửa → kỹ năng MỚI + hình mới) | medium |
| 8 | Rà soát độc lập MN + L1 | **high** |
| 9–16 | GĐ2c–2f, mỗi lớp 2 phiên + 1 phiên rà soát độc lập | medium / **high** |
| 17 | GĐ3 | medium |
| 18–21 | GĐ4.0–4.5 (mỗi phiên kết thúc bằng bộ ảnh) | medium |
| 22–23 | GĐ5 | medium |
| 24 | GĐ6: rà soát tổng (chạy lại 3 agent như 01/10) + ảnh cuối | **high** |

Không chạy các lớp GĐ2 song song: chúng cùng sửa `kit.ts`, `wrongs.ts`, `svg/index.ts` nên sẽ xung đột.

## 11. Ngoài phạm vi (không làm đợt này)

- Đồng bộ đám mây tiến độ Ôn Luyện (Supabase).
- Chế độ thi đấu nhiều người.
- Sinh đề AI theo kỹ năng.
- Đổi kinh tế sao / gacha ngoài các quy tắc ở GĐ3.8.

## 12. Nhật ký lệch plan

(ghi ngày · mục · lý do · quyết định)

- 01/10 · GĐ4–5 · Tiếp tục cấu trúc component Claude đã viết: dùng ReportView/PrintView và Answers.tsx; không đổi tên file chỉ để giống sơ đồ. Biểu đồ báo cáo dùng HTML/CSS, cùng dữ liệu và nội dung yêu cầu.
- 01/10 · GĐ4.0/GĐ6 · Dùng sân thử DEV có dữ liệu cố định cho bộ ảnh, thêm kiểm lưu kết quả qua app thật. Chrome headless dùng profile riêng; mỗi kích thước dùng renderer mới để tránh ERR_INSUFFICIENT_RESOURCES khi tải lại hàng trăm module Vite nhiều lần.
- 01/10 · GĐ6 · Kiến trúc lưu trong docs/study-mode-architecture.md để đi cùng repository. Không có ảnh trước trong log; dùng tag study-before-wow làm mốc so sánh.
- 01/10 · Nghiệm thu · Typecheck toàn repo phát hiện lỗi có sẵn ở modules/farm/src/ui/renderSnapshot.ts:26. Ghi rõ trong bàn giao; không thay đổi module farm trong công việc Ôn Luyện.
