# Hoàn thành mục 05–06: token và prompt

Ngày 22/09/2026. Sửa dữ liệu hiện tại và generator của A2/B2/B3/B4. Không chạy generator ghi đè toàn bộ file, không sửa theory/vocab, bản dịch, câu tiếng Anh, alternative hoặc nội dung C1 trở đi.

## Mục 05 — Tách am not

- `B2-s-0061`–`B2-s-0070`: token `am not` được tách thành `am` (verb/verb, lemma `be`, feature `present-1sg`) và `not` (adverb/adverbial).
- Nhóm động từ là `[1,2,3]`, gồm cả từ phủ định. Dịch chuyển các chỉ số phía sau trong object/adverbial span và blank; `a kite` và `for you` vẫn là cụm đầy đủ.
- `0061` và `0066` chỉ khoét `am`, giữ `not` hiển thị. Tám câu còn lại khoét V-ing ở index 3.
- Đã cập nhật `english-annotations-b2-b4.json` và helper `addNeg` của generator. Bật lại POS/roles cho cả 10 câu sau khi kiểm tra. Tổng B2 hiện có 186 câu bật roles, 199 câu bật pos; vẫn đủ 200 câu.

## Mục 06 — Prompt không đưa sẵn đáp án

- Chuẩn hóa prompt của **600 câu B2–B4** theo động từ gốc, thì, câu khẳng định/phủ định/nghi vấn và ngữ cảnh dự định tương lai. Không chèn dạng chia đúng, kết luận “dùng nguyên thể”, hoặc quy tắc biến đổi chính tả vào đề bài.
- Giữ động từ gốc khi yêu cầu chia từ, kể cả khi dạng đúng trùng lemma (`read` ở quá khứ, động từ sau trợ động từ). Người học vẫn phải xác định dạng từ; không dùng bộ lọc xóa lemma chỉ vì trùng đáp án.
- Blank khoét trợ động từ không nêu sẵn trợ động từ. Phủ định dạng rút gọn nói rõ yêu cầu viết tắt. Nếu `not` đã hiện, prompt yêu cầu chỉ điền một từ, bao gồm `B4-s-0189`.
- Với blank `going`, chỉ cung cấp lemma `go` và mục tiêu diễn tả dự định tương lai, không đưa nguyên cấu trúc chứa đáp án.
- Giữ gợi ý sẵn có; chuyển hướng dẫn chính tả/biến đổi từ khỏi prompt sang hint.
- **70 câu A2** được điều chỉnh: bỏ gợi ý đuôi số nhiều/giữ nguyên và lời nhắc phát âm khỏi prompt; `0147/0148` chuyển blank từ `There` sang `is/are`; `0198` bổ sung ngữ cảnh nhóm táo cụ thể thay cho yêu cầu chép `the`. Các lựa chọn `a hoặc an` vẫn là câu hỏi lựa chọn hợp lệ.

Ví dụ:

| Câu | Prompt sau sửa |
|---|---|
| B3-s-0041 | Chia động từ watch để hoàn thành câu khẳng định ở thì quá khứ đơn. |
| B4-s-0001 | Điền trợ động từ phù hợp cho câu khẳng định ở thì tương lai đơn. |
| B4-s-0189 | Điền trợ động từ phù hợp cho câu phủ định ở thì tương lai đơn. Chỉ điền một từ; từ phủ định đã có trong câu. |

Quy tắc tập trung tại `scripts/english-exercise-prompts.mjs`. Bốn generator gọi helper sau khi câu có ID/level và annotation đúng. Helper chỉ chỉnh blanks; không sửa whitelist/annotation hoặc nội dung bậc khác. Khi bổ sung loại blank mới, cần duyệt mục tiêu và ngữ cảnh thay vì mặc định sử dụng mẫu hiện tại.

## Kiểm tra

```text
node node_modules/vitest/vitest.mjs run src/english/content-fixes-05-06.test.mjs src/english/annotations-b2-b4.test.mjs src/english/english.test.ts
```

**3 file, 62 tests đạt.** Kiểm tra trực tiếp grader với blank sau tách token, từ chối `am not` khi chỉ khoét `am`, nhận đủ cụm động từ gồm `not`, và xếp đúng toàn bộ token. Kiểm tra cả cụm nằm sau token mới, hợp lệ schema của bốn file sentences, không lộ dạng chia/trợ động từ trong 600 prompt, giữ đủ ngữ cảnh và hint, áp dụng helper lặp không làm đổi dữ liệu.

Chạy cả bốn generator với ghi file bị thay bằng bộ nhớ; đối chiếu tất cả blank A2/B2/B3/B4 với dữ liệu hiện tại và giữ các kiểm tra annotation B2–B4 từ mục 03–04. Không sửa UI hoặc grader để vượt kiểm tra.

Mục 07–14 và nội dung mới của Gemini tiếp tục xử lý riêng; kết quả này không phải nghiệm thu toàn kho.
