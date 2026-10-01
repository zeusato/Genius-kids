# Rà soát module Ôn Luyện (`/study`) — 01/10/2026

> Phạm vi: `src/pages/StudyPage.tsx`, `src/components/study/*`, `services/mathEngine.ts`,
> `services/generators/**` (60 chủ đề trắc nghiệm, bỏ qua luyện gõ), `utils/pdfExport.ts`,
> phần lưu lịch sử trong `StudentContext` / `achievementService` / `profileService`.
> Trạng thái: **mới rà soát, chưa sửa gì**. Ảnh bằng chứng ở `docs/study-review-2026-10-01/`.

## 0. Cách rà soát

- Đóng gói `mathEngine` bằng esbuild và chạy thật trong Node:
  - Qua `generateQuestions()`: 300 lượt/chủ đề, đo kích thước ngân hàng câu, số dạng câu, cơ cấu loại câu, vị trí đáp án đúng.
  - Gọi **thẳng từng generator**, không qua bộ lọc: 400–20 000 lượt/chủ đề, để thấy câu nào bị loại.
- 3 agent rà nội dung theo khối (MN+L1–2, L3, L4–5) so với chương trình Toán GDPT 2018. Đối chiếu SGK Kết nối tri thức / Chân trời sáng tạo / Cánh diều.
- Chụp màn hình thật bằng Chrome headless (tablet ngang 1180×820): chọn chủ đề, câu hỏi, phản hồi Luyện tập, kết quả.

## 1. Tóm tắt

Kiến trúc tốt:
- generator thuần;
- bộ SVG dùng chung;
- `content.test.ts` chạy mọi chủ đề;
- 2 chế độ Luyện tập / Kiểm tra;
- TTS đọc đề;
- in đề PDF;
- sinh đề bằng AI.

Nhưng **thứ đến tay bé kém xa thứ đã viết**:

1. **Bộ lọc engine âm thầm vứt câu.** `generateQuestions` bỏ mọi câu SingleChoice/SelectWrong có ít hơn 4 đáp án khác nhau (`mathEngine.ts:345-366`, có từ 11/2025).
   - Toàn bộ dạng **so sánh >, <, =** trong 17 generator: đếm 300 câu/chủ đề thì có **0 câu**.
   - Toàn bộ dạng **Có/Không, nặng hơn/nhẹ hơn, dài hơn/ngắn hơn, lớn nhất/nhỏ nhất (3 lựa chọn)** cũng bị loại.
   - Mọi câu có distractor trùng nhau cũng bị loại.
   - 33/60 chủ đề mất từ 1% đến 65% số câu sinh ra. Ví dụ: `g4_statistics` 65%, `g3_geometry` 52%, `g5_fractions` 50%, `g1_length` 45%, `g1_numbers_100` 42%.
2. **Khoá chống trùng `questionText|correctAnswer` bỏ qua hình và `correctAnswers`.** Câu có đề cố định ("Đếm xem có mấy hình?", "Đo xem vật dài…") gộp lại còn ≤10 câu.
   - `g4_lines` chỉ có **3** câu.
   - `mn_shapes` 4 câu, `g1_length` 8 câu, `g4_angles` 21 câu.
   - Xin 20 câu thì nhận ít hơn mà không báo gì.
3. **Câu sai kiến thức ở mọi khối:**
   - hai/bốn đáp án cùng đúng;
   - đọc số sai;
   - định dạng số kiểu Mỹ lẫn với dấu phẩy thập phân;
   - phân số âm;
   - tam giác không tồn tại;
   - hình vẽ góc hỏng và lộ đáp án.
4. **Lệch chương trình GDPT 2018:**
   - Có nội dung vượt lớp: bảng nhân 3–4 ở lớp 2; qua 10 ở lớp 1; dấu hiệu chia hết 2/3/5/9 và diện tích hình bình hành/thoi ở lớp 4–5 (theo GDPT 2018 thuộc lớp 6).
   - Đồng thời thiếu mảng cốt lõi: cộng trừ phạm vi 100 ở lớp 1; phạm vi 1000 ở lớp 2; bảng 6–9 riêng ở lớp 3; số chẵn/lẻ ở lớp 4; hỗn số ở lớp 5; toàn bộ mạch **xác suất** (chắc chắn/có thể/không thể).
5. **Trải nghiệm là "làm bài trắc nghiệm", chưa phải "ôn luyện":**
   - không có lộ trình, mức độ, thành thạo theo kỹ năng;
   - không ôn lại câu sai;
   - giao diện Comic Sans + thẻ xanh kiểu cũ, lệch với hub mới (Nunito, nền giấy, tranh minh hoạ).

## 2. Lỗi hệ thống (engine / app)

| # | Vấn đề | Bằng chứng | Vị trí |
|---|---|---|---|
| S1 | Lọc "đủ 4 đáp án" vứt mọi câu 2–3 lựa chọn và câu có distractor trùng | 0 câu so sánh / 300 câu ở 17 chủ đề; 33/60 chủ đề mất câu | `services/mathEngine.ts:345-366` |
| S2 | Khoá chống trùng bỏ qua SVG/`correctAnswers` → ngân hàng câu tí hon, số câu thiếu không báo | `g4_lines` 3 câu, `mn_shapes` 4, `g1_length` 8 | `services/mathEngine.ts:337` |
| S3 | `content.test.ts` chỉ kiểm **sau** bộ lọc nên không thấy S1/S2 | — | `services/generators/content.test.ts` |
| S4 | Lịch sử lưu **nguyên câu kèm SVG** vào 1 key localStorage; `baseTenSVG` tới **~70 KB/câu**, `clockSVG` ~8 KB. `saveProfiles` không try/catch → đầy quota là mất tiến trình | đo bằng sampler | `StudyPage.tsx:118-137`, `profileService.ts:25-27`, `svg/index.ts:261` |
| S5 | Logic chấm lặp 5 nơi và không thống nhất: stats/achievement dùng `===` nên câu chọn nhiều / tự nhập không bao giờ tính vào thành thạo | — | `StudyPage.tsx:80-95`, `TestRunner.tsx:96-106`, `ResultScreen.tsx:79-90`, `achievementService.ts:64-70, 237-241` |
| S6 | `TestResult.topicIds` luôn là `[]` | — | `StudyPage.tsx:129` |
| S7 | Chế độ Kiểm tra phát tiếng đúng/sai khi bấm "Câu tiếp theo" → lộ đáp án | — | `TestRunner.tsx:149-153` |
| S8 | TTS lớp ≤1 đọc "Tính tổng" nhưng phép tính nằm trong hình nên không được đọc; `□`/`_` đọc thành khoảng trống ("dãy: 1 3") | — | `grade1/addition10.ts:119`, `subtraction10.ts:117`, `src/utils/questionSpeech.ts:28` |
| S9 | `numberToVietnamese` sai: 475 → "bảy mươi **năm**", 21 → "hai mươi **một**", 1 005 → "một nghìn, năm", chèn dấu phẩy. ~50% câu "Cách đọc" ở `g4_large_numbers` có đáp án đúng đọc sai | — | `services/generators/utils.ts:21-48` |
| S10 | `angleSVG`: tia thứ hai quay **xuống dưới** đường ngang và bị viewBox cắt; nhãn in sẵn số đo nên lộ đáp án | ảnh `svg-loi-goc-nhan.png` | `services/generators/svg/index.ts:166-180` |
| S11 | `baseTenSVG` rộng tới 1130px bị ép về 360px → ô đơn vị ~3px, không đếm được | — | `svg/index.ts:261-279` |
| S12 | Lời giải dùng `\n` / `\\n` nhưng hiển thị bằng `<p>` thường → dồn một dòng hoặc hiện chữ "\n" | — | `TestRunner.tsx:306`, nhiều generator G3/G5 |
| S13 | Luyện tập: dấu ✓ ở đáp án đúng không hiện (xung đột class `bg-white`/`bg-green-500`) | ảnh `luyen-tap-phan-hoi.png` | `TestRunner.tsx:287` |
| S14 | Gọi `onFinish` bên trong updater của `setTimeLeft` (StrictMode gọi 2 lần); `useMemo` sau `return null` (sai luật hooks) | — | `TestRunner.tsx:72-77`, `TopicSelection.tsx:53-55` |
| S15 | Tối thiểu 20 câu cho cả Mầm non; thời gian = số câu (phút) | — | `TopicSelection.tsx:81-84`, `StudyPage.tsx:53` |
| S16 | Màn kết quả: xem lại hiển thị đề thô (không Markdown/KaTeX), hình ép 200px, "trong 0 phút" khi làm dưới 1 phút | — | `ResultScreen.tsx:53,100,108` |
| S17 | In PDF: không có trang đáp án; tải font Roboto từ CDN → offline (PWA) hỏng tiếng Việt | — | `utils/pdfExport.ts:77-103` |
| S18 | Nhiều generator dùng `Math.random` thay vì `generatorRandom` → không sinh đề theo seed được; `grade3/numbers.ts` và `grade3/wordProblems.ts` import vòng từ `mathEngine` | — | `grade3/*` |

## 3. Lỗi đúng/sai trong nội dung (ưu tiên sửa)

### Mầm non + Lớp 1–2

- **Tách số** (`grade1/numbers10.ts:105-110`): cả 4 lựa chọn đều có tổng đúng ("Tách 10: 2+8 / 8+2 / 9+1 / 3+7"). Tiêu đề SVG còn in sẵn đáp án (`:45`).
- **Lộ đáp án:**
  - Thước in chữ "9 cm" (`length.ts:22`).
  - Tia số tô đỏ chính nhãn cần tìm (`numbers10.ts:31`).
  - Đề đồng hồ nói sẵn giờ (`clock.ts:36`).
- **Đoán theo vị trí:** lựa chọn dạng {x−1, x, x+1, x+2}, nên đáp án **luôn là số nhỏ thứ 2**. Gặp ở 100% câu số của `g1_operations_20`, `g1_numbers_100`, `g1_length`. Ở `g2_time_calendar`, câu "mấy tiếng nữa" đáp án luôn đứng thứ 3.
- "Số lẻ là số chia hết cho 2 dư 1" ở lớp 1: tự mâu thuẫn, và chẵn/lẻ không thuộc lớp 1 (`numbers20.ts:67`).
- Emoji buổi trong ngày mâu thuẫn: ☀️/🌞 không phân biệt được sáng/trưa; 🌅 lại gán cho "chiều" (`grade1/time.ts:16-18`).
- "Hàng đơn vị cộng lại lớn hơn 10" sai khi tổng hàng đơn vị bằng đúng 10 (`addSubCarry.ts:56`).
- SVG: chữ "cm" đè nhãn vạch (`grade2/units.ts:53`); khối trụ vẽ đè viền (`grade2/geometry.ts:68-70`).

### Lớp 3

- Thống kê "nhiều/ít nhất" có cột **hoà** → 2 đáp án đúng, 14% số câu (`grade3/statistics.ts:26-31`). Ngoài ra còn lộ chữ mẫu "ai/cái nào".
- **Tam giác không tồn tại** ở 13% câu chu vi tam giác ("5, 8, 3cm") (`grade3/geometry.ts:126-128`). Tam giác vẽ hình cố định, không theo số đo.
- **Đọc số thiếu "không trăm":** "năm nghìn bốn mươi mốt" cho 5 041. Code dùng "lẻ" trong khi SGK dùng "linh" (`grade3/numbers.ts:34-36`).
- **Chia có dư:** 33% câu có lựa chọn với số dư = số chia ("30 dư 2" cho 61 : 2) (`grade3/division.ts:51`).
- **Hình chữ nhật dài < rộng** (26%) hoặc dài = rộng (8%) (`grade3/area.ts`, `grade3/geometry.ts`).
- **Đồng hồ:**
  - Câu giờ đúng 1–11 bị trùng đáp án nên bị loại; chỉ còn "12 giờ".
  - Có lựa chọn "13 giờ rưỡi", "h giờ 0 phút".
  - Thước đo không có vạch (`grade3/measurements.ts:16-21, 125-143`).
- **Nhãn bị cắt:** "12cm" nằm ngoài viewBox (`grade3/geometry.ts:43`).

### Lớp 4–5

- **Định dạng số:**
  - Dấu phân cách nghìn kiểu Mỹ ("534,636", "10,000 đồng") trong khi số thập phân dùng dấu phẩy ("0,125"). Câu "Viết số 242,005 dưới dạng tổng" vì vậy mơ hồ.
  - Lẫn cả "12.5", "0.35", "58,666.667 đồng" (`grade5/ratios.ts:70,133`).
  - G2–G3 tiền lại dùng "10.000 đồng". Toàn app không thống nhất.
- **Hai đáp án tương đương:** "2/5 : 4" có cả 2/20 và 1/10; "2/2 × 4" có cả 4 và 8/2 (`grade5/fractions.ts`). Kết quả "7/7" không rút gọn (`grade4/fractions.ts`).
- **Số âm:**
  - "1/3 − 1/2 = −1/6" (`grade4/fractionOps.ts`), quy đồng theo tích thay vì mẫu số chung nhỏ nhất.
  - 45% câu cộng phân số có lựa chọn âm.
  - Các lựa chọn "−1", "−0,05", "0 giờ".
- **Đáp án chỉ xấp xỉ:**
  - "655 HS, 50% nữ = 327" (thực 327,5); "781 × 25% = 195" (`grade5/wordProblems.ts:164`).
  - Làm chung "10 & 14 ngày → 6 ngày" (thực ≈5,83) (`:81`).
  - "Tỉ số của 4 và 6" chấm "4:6" là sai (`grade5/ratios.ts:48-60`).
- **Dạng câu chết vì S1:**
  - Diện tích tam giác và hình thang (distractor trùng `area*2`, `grade5/geometry.ts:133,160`).
  - cm→mm, m→dm, dm³→lít (`grade5/measurements.ts:43-44,94`).
  - Bài tính thời gian bị loại 89%, đuổi kịp 54% (`grade5/wordProblems.ts:233,255`).
- **Nhập tay nhiều đáp án hợp lệ:** "Điền chữ số để 8* chia hết cho 2 — một đáp án đúng là?" chỉ chấm "0" (`grade4/divisibility.ts`).
- **Hình mâu thuẫn chữ:**
  - Đề "hình vuông cạnh 17m" nhưng hình ghi "17cm" (`grade4/geometry.ts:22,24`).
  - `box3dSVG` cắt nhãn; `triangleSVG({sides})` vẽ hình cố định (`svg/index.ts:105-158`).
- **Đáp án luôn nhỏ nhất hoặc lớn nhất:** gặp ở "còn thừa bao nhiêu kẹo", chu vi tam giác G5, vận tốc dòng nước, đổi m³/dm³…
- **Ký hiệu, chữ:**
  - Dùng "÷" (SGK dùng ":") ở g4/g5_parentheses.
  - Dùng "x" thay "×" ở g4_geometry; dùng "Tìm x" (SGK 2018 dùng "?").
  - "điểm số" > 10.

## 4. Chất lượng sư phạm

- **Distractor ngẫu nhiên ±n, không dựa trên lỗi sai thường gặp:**
  - Bé loại được bằng mẹo: chỉ đáp án đúng là số tròn (97% câu giá vở G3, 84% câu làm tròn); "15 chục 0 đơn vị"; "Tháng 20"; số ngoài phạm vi 20.
  - Nên sinh distractor theo lỗi sai thật: quên nhớ, sai hàng, nhầm phép, lệch một chục, đảo chữ số, nhầm đơn vị.
- **Lời giải không giải thích:**
  - Nhiều câu chỉ nhắc lại kết quả: "168 : 8 = 21", "Có 5 đồ vật", "Quan sát đặc điểm của hình…", "Cộng giá trị các tờ tiền…" (không liệt kê tờ).
  - Không có đặt tính dọc, sơ đồ đoạn thẳng, thanh phân số trong lời giải.
- **Ít dạng câu:** ~95% là trắc nghiệm 4 lựa chọn. Nhiều chủ đề chỉ có 2–5 khuôn câu (`g2_add_sub_*` có 1–2). MultipleSelect luôn có đúng 2/4 đáp án đúng.
- **Tiếng Việt chưa tự nhiên:**
  - "Bạn có 10 cái kẹo, cho bạn 3 cái", "Vườn có 2,350 cây. trồng thêm…", "quyển truyện mỗi cái", "tấtcả".
  - "thối lại" (SGK dùng "trả lại"); "Thứ Hai" (SGK viết "thứ Hai"); "L/mL" (SGK viết "l/ml").
  - "Tính tổng/hiệu" ở lớp 1, trong khi thuật ngữ này học ở lớp 2.
- **Mầm non:** đề toàn chữ ("Đếm xem có mấy hình?"). Bé dựa hoàn toàn vào TTS; tối thiểu 20 câu là quá dài cho 5 tuổi.

## 5. Độ phủ chương trình GDPT 2018

### Nội dung vượt lớp (đề xuất: chuyển lớp hoặc gắn nhãn "Nâng cao", không xoá)

| Hiện ở | Nội dung | Thuộc |
|---|---|---|
| L1 `g1_operations_20`, `g1_word_problems` | cộng trừ qua 10 (7+8, 13−5) | L2 |
| L2 `g2_multiplication/division` | bảng nhân/chia 3, 4; "? : 3 = 10" | L3 |
| L2 `g2_money` | tiền 1.000–50.000 đồng (SGK L2: tờ 100/200/500/1000) | L3 |
| L3 | tổng–hiệu, phân số a/b, nhân 2 chữ số × 2 chữ số, nhân nhớ nhiều lượt | L4 |
| L4 `g4_divisibility` | dấu hiệu chia hết 2, 3, 5, 9 | L6 (L4 chỉ học chẵn/lẻ) |
| L4 `g4_para_rhombus`, L5 `g5_geometry` | diện tích hình bình hành / thoi | L6 (L4 chỉ nhận biết hình) |
| L4 `g4_fraction_ops` | cộng trừ phân số khác mẫu tuỳ ý | L5 (L4 chỉ khi mẫu này chia hết cho mẫu kia) |
| L5 | làm chung công việc, xuôi/ngược dòng, lãi suất, tăng rồi giảm % | nâng cao |

### Thiếu / yếu (chọn lọc, kiểm bằng grep code)

- **Mầm non:**
  - so sánh nhiều/ít/bằng nhau bằng hình;
  - gộp/tách nhóm ≤10, số thứ tự, tương ứng 1-1, quy luật;
  - to/nhỏ, cao/thấp; khối; định hướng không gian;
  - sáng/trưa/chiều/tối, hôm qua/hôm nay.
- **Lớp 1:**
  - **cộng trừ không nhớ phạm vi 100** (hoàn toàn không có);
  - số 21–99, chục–đơn vị;
  - dãy tính 2 dấu; viết phép tính theo tranh;
  - vị trí trên/dưới/trái/phải; khối lập phương/hộp chữ nhật; dài hơn/ngắn hơn.
- **Lớp 2:**
  - **cộng trừ phạm vi 1000**;
  - tên thành phần phép tính; số tròn trăm, tia số;
  - điểm, đoạn thẳng, đường gấp khúc, 3 điểm thẳng hàng, tứ giác;
  - dm, km; 15 phút, 24 giờ, lịch tháng;
  - **biểu đồ tranh, kiểm đếm, khả năng xảy ra**.
- **Lớp 3:**
  - số đến 100 000, số La Mã;
  - **bảng nhân/chia 6–9 riêng**; gấp/giảm một số lần, số lớn gấp mấy lần số bé;
  - biểu thức số và thứ tự thực hiện;
  - trung điểm; hình tròn (tâm, bán kính, đường kính); góc vuông/ê-ke; khối lập phương/hộp chữ nhật;
  - °C, ml/g theo ngữ cảnh; đồng hồ đến từng phút; diện tích bằng đếm ô;
  - bảng số liệu, khả năng xảy ra.
- **Lớp 4:**
  - **số chẵn/lẻ**; biểu thức chữ; hàng–lớp;
  - tính chất giao hoán/kết hợp/phân phối; nhân/chia 10, 100, 1000; rút về đơn vị;
  - yến, tạ, thế kỉ, mm²;
  - nhận biết hình bình hành/thoi; dùng thước đo góc;
  - dãy số liệu; số lần xuất hiện;
  - phép chia phân số, tìm phân số của một số, quy đồng.
- **Lớp 5:**
  - **hỗn số**, phân số thập phân, cộng trừ phân số khác mẫu;
  - so sánh/làm tròn số thập phân; ×/: 10, 100, 0,1;
  - ha, km²; chia số đo thời gian;
  - diện tích tam giác/hình thang (đang chết vì S1); hình lập phương; hình trụ/khai triển;
  - tỉ lệ bản đồ; tổng–tỉ, hiệu–tỉ;
  - tỉ số số lần lặp lại của sự kiện.

## 6. Giao diện / trải nghiệm

- **Ngôn ngữ hình ảnh lệch hub.**
  - Hub: Nunito, nền giấy `#faf8f0`, xanh `#337760`, tranh minh hoạ.
  - Ôn Luyện: Comic Sans (`tailwind.config.js` sans), thẻ trắng viền xanh trời, icon lucide (ảnh `chon-chu-de-lop3.png`).
- **Chọn chủ đề:** danh sách phẳng 10–17 thẻ chữ.
  - Không nhóm theo mạch (Số & phép tính / Hình học & đo lường / Thống kê & xác suất).
  - Không icon, không tiến độ / thành thạo từng chủ đề.
  - Thanh nổi dưới đáy lẫn 3 việc (Cốt truyện AI / số câu / In đề / Bắt đầu).
- **Màn câu hỏi:**
  - Bố cục dọc; trên tablet ngang hình và đáp án phải cuộn.
  - Không có phím tắt 1–4 / Enter.
  - Nút "Kiểm tra" trong chế độ Luyện tập trùng tên với chế độ Kiểm tra.
  - Sai là xong, không có "thử lại" hay gợi ý.
- **Màn kết quả:** chỉ có % và sao.
  - Không phân tích theo kỹ năng.
  - Không có "Làm lại câu sai", không gợi ý bài tiếp theo.
- **Giá trị cho phụ huynh:**
  - Không có báo cáo "con yếu phần nào", không có đề theo ma trận mức độ.
  - Đề in không có đáp án.

## 7. Kế hoạch nâng cấp đề xuất

Đề xuất làm trên nhánh `feat/study-wow` (tag `study-before-wow`) theo thứ tự ưu tiên **đúng → tốt → đẹp → giá trị**.

### GĐ0 — Nền engine & an toàn dữ liệu

- `generateQuestions` cho phép câu 2–3 lựa chọn.
  - Distractor trùng phải sửa **trong generator** (helper `distinctOptions()` + fail test), không loại âm thầm.
  - Khoá chống trùng gồm tham số / hình.
  - Báo khi ngân hàng câu thiếu.
- Test kiểm **đầu ra thô của generator**, chạy nghìn lượt mỗi chủ đề:
  - đúng 1 đáp án đúng (so giá trị: phân số / thập phân tương đương);
  - không số âm; tam giác hợp lệ; số dư < số chia; dài ≥ rộng;
  - đáp án không bị dồn ở vị trí min/max;
  - không còn "\n" thô hay chữ mẫu lộ ra.
- `formatNumberVN` (khoảng trắng nhóm nghìn như SGK "12 345", dấu phẩy thập phân) và `readNumberVN` (mốt, lăm, linh, không trăm) dùng chung, có test.
- `grading.ts` duy nhất: chuẩn hoá số; nhập tay chấp nhận tập đáp án hợp lệ. Dùng ở TestRunner / StudyPage / ResultScreen / achievementService.
- **Lịch sử gọn:** bỏ `visualSvg` khỏi `history` (lưu seed/tham số để dựng lại). `saveProfiles` có try/catch. Điền `topicIds`.
- **TTS:** thêm trường `speech` cho câu có phép tính nằm trong hình; đọc `□`/`…` là "ô trống".
- Chế độ Kiểm tra không phát tiếng đúng/sai; sửa lỗi hooks và ✓ ẩn.

### GĐ1 — Sửa nội dung sai (mục 3) + distractor theo lỗi sai thường gặp + lời giải từng bước

- Bộ `distractors` mới theo lỗi sai thật: quên nhớ, sai hàng, nhầm phép, ±1 chục, đảo chữ số, nhầm đơn vị.
- Lời giải từng bước, có SVG đặt tính dọc / sơ đồ đoạn thẳng / thanh phân số.
- Sửa `angleSVG` (có thước đo góc, không in số đo khi hỏi số đo), `baseTenSVG` (khối trăm dạng tấm), tam giác/hộp theo đúng số đo.

### GĐ2 — Bám chương trình

- Cấu trúc lại `TOPICS` thành **mạch → chủ đề → kỹ năng**, mỗi câu gắn `skillId` + **mức độ M1/M2/M3** (Thông tư 27).
- Chuyển nội dung vượt lớp sang đúng lớp hoặc gắn nhãn "Nâng cao".
- Bổ sung phần thiếu ở mục 5, ưu tiên:
  - L1 cộng trừ phạm vi 100;
  - L2 phạm vi 1000 + biểu đồ tranh + khả năng xảy ra;
  - L3 bảng 6–9 + gấp/giảm lần + biểu thức;
  - L4 chẵn/lẻ + tính chất phép tính + phân số;
  - L5 hỗn số + tam giác/hình thang + tỉ lệ bản đồ.

### GĐ3 — Giao diện mới theo ngôn ngữ hub (tablet ngang là chính)

- **Bản đồ chủ đề theo mạch:** thẻ có tranh/icon + vòng thành thạo; nút lớn **"Ôn hôm nay"** (10 câu trộn tự chọn).
- **Màn câu hỏi 2 cột:** hình bên trái, đáp án bên phải.
- **Dạng câu tương tác:** bàn phím số, 3 nút `>` `<` `=`, Đúng/Sai, kéo thả sắp xếp, chọn trên hình.
- **Phím tắt** 1–4 / Enter.
- **Luyện tập** có "thử lại" + gợi ý trước khi lộ lời giải.
- **Mầm non:** ít chữ, câu do TTS dẫn, 5–10 câu mỗi phiên.

### GĐ4 — Học thích ứng

- **Thành thạo theo kỹ năng** (lưu gọn trong profile).
- **Hàng đợi ôn lại câu sai** theo lịch lặp lại cách quãng, giống `reviewItems` của module Tiếng Anh.
- **Phiên tự tăng/giảm mức độ.**

### GĐ5 — Kết quả & phụ huynh

- **Màn kết quả:**
  - theo kỹ năng + "Làm lại câu sai" + gợi ý bài tiếp theo;
  - sao thưởng theo tiến bộ thành thạo, chứ không chỉ theo % (tránh "cày" sao).
- **Báo cáo phụ huynh.**
- **Đề kiểm tra cuối kì theo ma trận M1/M2/M3.**
- **PDF có trang đáp án + font nhúng offline.**

## 8. Quyết định (01/10/2026)

1. Định dạng số **theo SGK** (khoảng trắng nhóm nghìn, dấu phẩy thập phân).
2. Nội dung vượt lớp **giữ lại, gắn nhãn "Nâng cao"**.
3. **Làm trọn gói.**

→ Kế hoạch thi công chi tiết: `docs/study-wow-plan.md`. Phân giai đoạn ở đó (GĐ0–GĐ6) thay cho mục 7 ở trên.
