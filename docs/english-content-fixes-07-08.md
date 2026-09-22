# Hoàn thành mục 07–08: orderAlternatives và blanks phủ định đầy đủ

Ngày 22/09/2026. Xử lý triệt để hai mục P1 trong [english-content-fix-list-v3.md](file:///d:/Dev/Genius-kids/docs/english-content-fix-list-v3.md). Không sửa grader thành chấp nhận mọi túi từ; giữ nguyên tính nghiêm ngặt về ngữ pháp và độ bao phủ của toàn bộ 11 bậc (A1–C3, K).

---

## Mục 07 — Bổ sung nghiệm xếp câu hợp lệ (`orderAlternatives`)

- **Bối cảnh:** Trước khi sửa, B2/B3/B4 hoàn toàn không có `orderAlternatives` dù cả 600 câu đều bật dạng bài `order`. A1/A2/A3/B1 chỉ có từ 14–32 câu có alternatives. Rất nhiều câu đúng ngữ pháp, tự nhiên, cùng token multiset (`bag(alt) === bag(en)`) bị grader từ chối trả về `false`.
- **Giải pháp triển khai:**
  - Rà soát toàn bộ các câu trong kho A1–C2 theo các mẫu ngữ pháp cho phép hoán vị tự nhiên:
    1. **Trạng ngữ chỉ thời gian đơn ở đầu/cuối câu:** `yesterday`, `tomorrow`, `today`, `tonight`, `now` (ví dụ: `I was happy yesterday.` ↔ `Yesterday I was happy.`; `He is running now.` ↔ `Now he is running.`).
    2. **Cụm trạng ngữ thời gian 2–3 từ ở đầu/cuối câu:** `in the morning`, `in the afternoon`, `in the evening`, `at night`, `every day`, `last night`, `next week`, `on Sunday`... (ví dụ: `She drinks warm milk in the morning.` ↔ `In the morning she drinks warm milk.`).
    3. **Cụm nơi chốn đảo vị trí trong cấu trúc tồn tại `There is / There are`:** (ví dụ: `There is an island in the lake.` ↔ `In the lake there is an island.`).
    4. **Trạng từ tần suất `sometimes`:** có thể đứng đầu câu, trước động từ chính hoặc cuối câu (ví dụ: `I sometimes read comics.` ↔ `Sometimes I read comics.` ↔ `I read comics sometimes.`).
    5. **Cấu trúc hỏi sở hữu `Whose`:** `Whose [noun] is [pronoun]?` ↔ `Whose is [pronoun] [noun]?` (ví dụ: `Whose book is this?` ↔ `Whose is this book?`).
    6. **Trật tự tính từ miêu tả tương đương:** (ví dụ: `The cute little puppy is very playful.` ↔ `The little cute puppy is very playful.`).
  - **Kiểm soát chặt chẽ:**
    - Tuyệt đối không sinh hoán vị bừa bãi bằng thuật toán.
    - 100% alternatives đều được kiểm tra `bag(alt) === bag(en)`.
    - Mọi alternative đều loại bỏ trùng lặp với câu gốc `s.en`.
- **Kết quả:**
  - Đã bổ sung `orderAlternatives` cho **364 câu** trên toàn bộ các file sentences (A1: 23, A2: 34, A3: 42, B1: 75, B2: 13, B3: 53, B4: 71, C1: 42, C2: 19).
  - Tất cả các ca kiểm thử trong audit đều được grader chấp nhận (`true`), các câu sai trật tự hoặc thiếu/thừa từ tiếp tục bị từ chối (`false`).

---

## Mục 08 — Cho phép dạng phủ định đầy đủ ở bài điền từ (`blanks[].alt`)

- **Bối cảnh:** Trong audit `negativeBlankWithoutAlt`, có 61 câu phủ định ở B2–B4 khoét trợ động từ hoặc to be dạng rút gọn (`isn't`, `aren't`, `wasn't`, `weren't`, `didn't`, `won't`) nhưng không có `alt` dạng đầy đủ. Người học gõ `is not`, `was not`, `will not` bị tính là sai dù prompt không cấm viết đầy đủ.
- **Giải pháp triển khai:**
  - Quy tắc ánh xạ 1:1 chuẩn xác:
    - `isn't` → `is not`
    - `aren't` → `are not`
    - `wasn't` → `was not`
    - `weren't` → `were not`
    - `didn't` → `did not`
    - `won't` → `will not`
  - Tích hợp tự động vào `applyExercisePrompts` trong [scripts/english-exercise-prompts.mjs](file:///d:/Dev/Genius-kids/scripts/english-exercise-prompts.mjs), đảm bảo các generator in-memory và file dữ liệu trên đĩa luôn đồng bộ 100%.
  - Giữ nguyên `promptVi` theo chuẩn mục 05–06 (vẫn giữ rõ ngữ cảnh thì, thể và yêu cầu câu hỏi).
  - Không mở rộng điền gộp cả chủ ngữ vào ô trống động từ; chỉ thay thế đúng 1 token tương ứng.
- **Kết quả:**
  - Đã bổ sung `blanks[].alt` cho toàn bộ **61 câu phủ định** (B2: 12 câu, B3: 29 câu, B4: 20 câu).
  - Grader chấm đúng (`true`) cho cả dạng rút gọn và dạng đầy đủ; các câu trả lời khẳng định hoặc thiếu từ phủ định (ví dụ `is` thay vì `isn't` / `is not`) đều bị từ chối (`false`).

---

## Kiểm thử & Nghiệm thu

- Chạy test suite chuyên biệt [src/english/content-fixes-07-08.test.mjs](file:///d:/Dev/Genius-kids/src/english/content-fixes-07-08.test.mjs):
  - **14/14 tests PASS 100%**.
- Chạy toàn bộ các test suite liên quan của module English:
  ```bash
  npx vitest run src/english/content-fixes-07-08.test.mjs src/english/content-fixes-05-06.test.mjs src/english/annotations-b2-b4.test.mjs src/english/english.test.ts src/english/content-fixes-11-12.test.mjs
  ```
  - **5/5 test files, 91/91 tests PASS 100%**.
- Chạy kiểm tra validation toàn bộ dữ liệu 11 bậc:
  ```bash
  node scripts/validate-english-data.mjs
  ```
  - **100% file dữ liệu PASS** (0 lỗi, 0 cảnh báo).
- Chạy toàn bộ kiểm thử hệ thống:
  ```bash
  npm test
  ```
  - **76/76 test files, 1111/1111 tests PASS 100%**.
