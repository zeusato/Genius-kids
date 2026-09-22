# Hoàn thành mục 11–12: lý thuyết và biên tập câu mẫu

Ngày 22/09/2026. Đã sửa nội dung hiện tại và generator tương ứng, giữ ID, số lượng và các sửa khác đang có. Không chạy generator ghi đè toàn kho, không đổi UI/grader và không chỉnh content C1 trở đi.

## Mục 11

- **A2:** chọn a/an theo âm đầu của từ ngay sau, có đủ `an honest boy`, `a university teacher`, `a red apple`. Sửa cả formula, section, table, tips và liên kết ví dụ. Đuôi -o học theo từng từ: tomatoes nhưng pianos/photos, không áp dụng một quy tắc tuyệt đối.
- **B1:** sửa `clean` thành `cleans`; nhóm ví dụ hỏi–đáp là `0131–0133` và `0151–0153`, khớp you/I và he/he.
- **B2:** thay quy tắc “gặp từ khóa thì luôn tiếp diễn” bằng cách xét hành động, trạng thái và thói quen. Có đối chiếu simple/continuous, cùng phản ví dụ `I know the answer now.` và `Today is Monday.`. Nêu you dùng are với một hoặc nhiều người.
- **B3:** nêu you dùng were ở cả số ít và số nhiều; sửa cả body/tips. Làm rõ động từ bất quy tắc có thể giữ nguyên cách viết, không phải từ nào cũng đổi hoàn toàn.
- **B2/B3:** quy tắc gấp đôi xét chữ nguyên âm, phụ âm cuối và trọng âm; không gấp đôi w/x/y; có ví dụ nhiều âm tiết và đối chiếu không gấp đôi. Phân biệt `begin → beginning` với quá khứ bất quy tắc `begin → began`.
- **B4:** thay mẹo chọn thì chỉ theo từ khóa bằng ngữ cảnh. Tomorrow không buộc dùng will/going to; ví dụ lịch trình `The train leaves tomorrow.`. Đồng bộ heading/body/tips.

Các trường đã duyệt nằm tại `scripts/english-theory-review.mjs`, được áp dụng sau bước chuẩn hóa schema trong năm generator. Các trường ngoài phạm vi sửa được giữ nguyên.

Đối chiếu kiến thức: động từ trạng thái thường dùng simple theo [British Council](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-continuous); a/an theo âm của từ ngay sau theo [British Council Việt Nam](https://www.britishcouncil.vn/en/adults/tips/article-a-an). Các ngoại lệ số nhiều được đối chiếu với [Cambridge Grammar](https://dictionary.cambridge.org/grammar/british-grammar/nouns-form) và [tài liệu Cambridge](https://assets.cambridge.org/97811086/50540/excerpt/9781108650540_excerpt.pdf). Chính tả gấp đôi/trọng âm đối chiếu [Cambridge](https://dictionary.cambridge.org/de/grammatik/britisch-grammatik/spelling-and-verb-forms) và [Language Portal of Canada](https://our-languages.canada.ca/en/writing-tips-plus/spelling-final-consonants-doubled-before-a-suffix). Một số trang/PDF không mở toàn văn được; các quy tắc tương ứng cũng xuất hiện trong kết quả tìm kiếm của nguồn chính thức.

## Mục 12

| Phạm vi | Sửa đổi |
|---|---|
| A1-s-0038 | Đổi câu chính thành `The cute little puppy is very playful.`, đổi thứ tự token, bỏ alternative trùng câu chính. |
| A2-s-0056–0065 | Thay mô tả lặp “very fast” bằng strong/quiet/big/small/hungry/dirty/noisy/long/heavy/colorful, dịch phù hợp và khoét danh từ số nhiều. |
| A2-s-0111–0121 | Rà 11 bản dịch; sửa 10 bản, giữ “Có hai bàn chân” vốn đúng. Bỏ lượng từ kép, dùng “Có năm người”, “Có ba con chuột”, “Có hai chiếc kệ”… |
| A3-s-0062 | `Is that soup hot?`; soup là danh từ không đếm được, chủ ngữ `[1,2]`, complement `[3]`; grammarPoint đổi thành adj-predicative. |
| B2-s-0061–0105 | Sửa 45 bản dịch thành “Lúc này/Hiện giờ, … không …”, giữ nghĩa hiện tại mà bỏ “không đang”. |
| B2-s-0172 | `The boy is flying a toy plane.`; bản dịch “điều khiển … máy bay đồ chơi”; object `[4,5,6]`, cập nhật ledger. |
| B1-s-0076 | `We go to bed at ten o'clock.`; blank go, bổ sung cụm to bed và nghiệm xếp đưa giờ lên đầu. |
| B3-s-0188 | `Did he go to bed early last night?`; blank/lemma go, cập nhật span/ledger và alternative. |
| A3-v-0089 | `The cat's tail is long.` / “Đuôi của con mèo dài.” |

**B1-s-0076 bỏ roles:** sau sửa có nhiều cụm trạng ngữ độc lập, câu hỏi vai trò hiện tại không phân biệt mục tiêu. Giữ POS/fill/order. B3-s-0188 tiếp tục không bật roles theo quyết định mục 03–04; không gộp trạng ngữ để che sự mơ hồ.

**Rà tính từ:** trong A1–B4, 80 blank khoét tính từ đều thuộc A3. Prompt hiện nêu rõ nghĩa cần điền và một nhóm ba từ đã chọn (ví dụ cute/cold/tall). Người học chọn trong nhóm này; không coi đó là bài dịch mở có một đáp án duy nhất và không phủ định tính đúng của từ đồng nghĩa ngoài nhóm. `scripts/english-adjective-prompts.mjs` áp dụng quy tắc này cho generator A3. Không bật fuzzy matching.

Tổng cộng 149 câu thay đổi trong lượt này, gồm cả 80 câu chỉ sửa prompt hoặc kèm sửa cấu trúc; thêm 1 ví dụ vocab và 5 trang theory.

## Kiểm tra

```text
node node_modules/vitest/vitest.mjs run src/english/content-fixes-11-12.test.mjs src/english/content-fixes-05-06.test.mjs src/english/annotations-b2-b4.test.mjs src/english/english.test.ts
```

**4 file, 77 tests đạt.** Bao gồm schema, đủ số lượng, ID/reference, nhóm hỏi–đáp khớp nhau, kiểm tra không tái xuất hiện mẹo từ khóa sai, token tái tạo đúng câu, grader nhận đáp án mới và alternative, từ chối singular thay plural, thiếu toy trong cụm object, sleep thay go, thứ tự câu sai, và các lựa chọn tính từ sai trong nhóm.

Chạy cả bảy generator A1–B4 trong sandbox bộ nhớ (chặn ghi file), đối chiếu các câu đã sửa, năm theory và ví dụ vocab. Các test mục 03–06 tiếp tục đạt.

Toàn bộ **21 file sentences/vocab/theory A1–B4 đạt validator**. Mỗi bậc vẫn 200 câu; vocab lần lượt 118/105/105/111/106/106/105 (tổng 756). Kiểm tra toàn kho tại thời điểm này còn lỗi ngoài phạm vi ở C1.theory, C2.theory, C3.theory và C3.passages; nội dung mới đó chưa được nghiệm thu.

Chỉ đánh dấu hoàn thành mục 11–12; mục 07–08, 13 và kiểm tra bàn giao toàn bộ vẫn xử lý riêng. Mục 09–10 do Claude đã cập nhật được giữ nguyên.
