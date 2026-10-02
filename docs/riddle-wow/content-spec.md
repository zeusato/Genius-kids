# Quy chuẩn nội dung Đố Vui Nhân Sư v2

Bạn đang biên tập kho câu đố cho app học tập của trẻ Việt Nam lớp 1–5 (6–11 tuổi). Người chơi là trẻ, phụ huynh đọc cùng. Toàn bộ chữ hiển thị cho trẻ (trừ câu đố tiếng Anh và đáp án tiếng Anh) viết **tiếng Việt chuẩn, có dấu, giọng ấm áp, câu ngắn**.

## Đầu ra

Một file JSON là MẢNG, mỗi phần tử ứng với một câu đầu vào (giữ đúng thứ tự, đủ số lượng) theo một trong hai dạng:

Loại bỏ:
```json
{ "id": "VN-183", "keep": false, "dropReason": "trùng VN-030" }
```

Giữ:
```json
{
  "id": "VN-001",
  "lang": "vi",
  "kind": "object",
  "gate": "animals",
  "level": 1,
  "text": "Con gì mào đỏ\nGáy ó o o\nTừ sáng tinh mơ\nGọi người thức dậy?",
  "answer": "Con gà trống",
  "accept": ["gà trống", "chú gà trống"],
  "close": ["gà", "con gà", "gà mái"],
  "hints": ["Đây là một con vật nuôi trong nhà, có hai chân và có cánh.", "Mỗi sáng nó cất tiếng gáy thật to để đánh thức mọi người."],
  "choices": [{ "text": "Con vịt", "emoji": "🦆" }, { "text": "Con gà mái", "emoji": "🐔" }, { "text": "Con chim sẻ", "emoji": "🐦" }],
  "emoji": "🐓",
  "clues": [{ "quote": "mào đỏ", "means": "Trên đầu gà trống có cái mào màu đỏ." }, { "quote": "Gáy ó o o", "means": "Gà trống gáy “ò ó o” vào buổi sáng." }],
  "explain": "Gà trống có mào đỏ và hay gáy vào sáng sớm, như một chiếc đồng hồ báo thức.",
  "source": "dân gian"
}
```

## Từng trường

- **lang**: `vi` | `en`.
- **kind**: `object` (đố vật: con vật, đồ vật, cây quả, hiện tượng…) · `wordplay` (đố chữ: thêm/bớt dấu, thêm/bớt chữ, nói lái, chơi chữ đồng âm) · `logic` (đố mẹo, đố tư duy) · `math` (toán mẹo, đáp án là một số nguyên viết bằng chữ số).
- **gate**:
  - `animals`: con vật, chim, côn trùng, cá.
  - `plants`: cây, hoa, quả, củ, hạt, món bánh, món ăn.
  - `objects`: đồ dùng, đồ chơi, dụng cụ, phương tiện, đồ học tập.
  - `nature`: thiên nhiên, thời tiết, trời đất, thiên văn, lửa nước, bộ phận cơ thể người.
  - `vietnam`: địa danh, nhân vật lịch sử, phong tục, lễ hội Việt Nam.
  - `words`: mọi câu kind = `wordplay`.
  - `tricks`: mọi câu kind = `logic` hoặc `math`.
  - `world`: MỌI câu tiếng Anh (lang = `en`), bất kể chủ đề.
- **level**, theo độ khó THẬT với trẻ (không theo việc câu là thơ hay văn xuôi):
  - `1` (lớp 1–2): đáp án là thứ rất quen trong đời sống của trẻ, manh mối nói thẳng đặc điểm, ít ẩn dụ.
  - `2` (lớp 3–4): cần ghép vài manh mối, có ẩn dụ nhẹ, hoặc đáp án ít quen hơn.
  - `3` (lớp 5): ẩn dụ sâu, từ cổ, chơi chữ khó, kiến thức lịch sử/địa lý, hoặc đáp án lạ với trẻ thành phố.
  - Câu tiếng Anh: `1` nếu từ vựng đáp án và câu đố rất cơ bản (A1), `2` trung bình, `3` khó.
- **text**: câu đố đã biên tập lại cho chuẩn. Giữ nguyên lời câu đố dân gian (chỉ sửa chính tả, dấu câu). Mỗi dòng thơ một dòng, nối bằng `\n`. Câu tiếng Anh giữ tiếng Anh. Không viết hoa toàn bộ. Có thể bỏ đuôi "Là gì?" nếu thừa, nhưng câu phải là câu hỏi rõ ràng.
- **answer**: đáp án hiển thị, viết hoa chữ đầu, có từ chỉ loại khi tự nhiên ("Con gà trống", "Quả dưa hấu", "Cái kéo"). Câu tiếng Anh: đáp án tiếng Anh ("Clock", "Letter M"). Nếu câu gốc có nhiều đáp án ngang nhau (vd "Hat, Cap") thì chọn một làm `answer`, phần còn lại cho vào `accept`.
- **accept**: các cách gọi khác cũng ĐÚNG hoàn toàn. Không cần viết lại từ chỉ loại hay bản không dấu, máy tự xử lý. Nhớ thêm từ địa phương Nam/Bắc khi có (ngô/bắp, lợn/heo, dứa/thơm/khóm, bát/chén, thìa/muỗng, quả/trái, mì/mỳ, ô/dù, kẹo/kẹo ngọt…). Mảng rỗng nếu không có.
- **close**: những câu trả lời "gần đúng" mà trẻ dễ nói (từ chung hơn, hoặc họ hàng gần). Máy sẽ nói "gần đúng rồi, nghĩ thêm chút nữa". Không được trùng với accept. Mảng rỗng nếu không có.
- **hints**: đúng 2 câu tiếng Việt, KHÔNG chứa đáp án.
  - G1 cho biết nhóm của đáp án ("Đây là một loại quả", "Đây là một đồ dùng trong bếp").
  - G2 nói lại một manh mối quan trọng cho dễ hiểu hơn.
  - Câu tiếng Anh: gợi ý vẫn viết bằng tiếng Việt.
- **choices**: đúng 3 đáp án NHIỄU.
  - Cùng nhóm, hợp lý, viết cùng kiểu với `answer` (cùng ngôn ngữ, cùng cách viết từ chỉ loại).
  - Chỉ MỘT đáp án thật sự khớp với mọi manh mối; mỗi đáp án nhiễu phải SAI ít nhất một manh mối.
  - Không dùng từ đồng nghĩa với đáp án, không lấy thứ có trong accept/close.
  - `emoji` là MỘT ký tự emoji tiêu chuẩn mô tả đúng vật đó. Bỏ trường emoji nếu không có emoji khớp, đừng gán bừa.
  - Câu kind `math`: đáp án nhiễu là số gần đúng, ví dụ do tính sai.
  - Câu `wordplay`: đáp án nhiễu là từ gần âm.
- **emoji**: emoji của đáp án. Bỏ trường nếu không có emoji khớp chính xác (đừng dùng 🍎 cho "quả vải").
- **clues**: 1–3 manh mối. `quote` là một đoạn **chép NGUYÊN VĂN** từ `text` (đúng từng ký tự và hoa thường, không nối qua `\n`). `means` là 1 câu tiếng Việt giải nghĩa manh mối đó khớp với đáp án như thế nào.
- **explain**: 1–2 câu tiếng Việt cho trẻ, giải thích vì sao là đáp án này. Với đố chữ hay đố mẹo, nói rõ "mẹo" nằm ở đâu.
- **vi** (chỉ câu tiếng Anh): bản dịch tiếng Việt tự nhiên của `text`.
- **answerVi** (chỉ câu tiếng Anh): nghĩa tiếng Việt của đáp án ("Đồng hồ").
- **source**: `dân gian` (câu đố dân gian Việt Nam / riddle truyền thống tiếng Anh) · `sưu tầm` · `biên soạn` (câu tự viết, hoặc câu viết lại nhiều).

## Khi nào LOẠI (keep: false)

- Câu trùng với câu khác (danh sách trùng được cho trong đề bài: giữ id nhỏ hơn, loại id lớn hơn).
- Câu tiếng Anh dạng "định nghĩa từ vựng" không có yếu tố đố: "I am a professional who designs buildings…", "I am a red liquid that flows in your veins…". Chỉ giữ nếu câu có mẹo hoặc ẩn dụ thật sự.
- Nội dung không hợp với trẻ: chết chóc, quan tài, vũ khí hay chiến tranh, rượu bia thuốc lá, mê tín điềm báo, tục giảng thanh, phân biệt vùng miền hay ngoại hình.
- Câu sai kiến thức mà không sửa được, câu mơ hồ có nhiều đáp án đều đúng, câu quá tối nghĩa ngay cả với người lớn.
- Câu gần như giống hệt một câu khác (cùng đáp án, cùng manh mối) trong lô của bạn: giữ câu hay hơn.

Nếu câu sửa được thì SỬA thay vì loại: đổi đáp án sai (vd "vỏ đỏ, ruột trắng, hạt đen" là quả thanh long), bỏ chữ mê tín, viết lại câu lủng củng.

## Kiểm tra trước khi nộp

```bash
node scripts/riddle-validate.mjs <file-đầu-ra>
```

Chạy trong thư mục `D:\Quyetnm\Dev\mathgenius-kids`. Script phải in "lỗi 0". Sửa đến khi đạt. Tự đọc lại toàn bộ: kiểm chính tả tiếng Việt, kiểm từng đáp án nhiễu thực sự sai, kiểm emoji đúng vật.
