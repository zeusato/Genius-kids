# Đố Vui Nhân Sư — kế hoạch remake

> Lập 02/10/2026. Trạng thái: **đã thi công GĐ0–GĐ7 trên nhánh `feat/riddle-wow` (02/10), chưa merge**. Tag mốc `riddle-before-wow`. Báo cáo bàn giao: [riddle-wow/README.md](riddle-wow/README.md). Chủ dự án duyệt "làm toàn bộ"; các quyết định D1–D9 thi công theo phương án đề xuất, trừ chỗ ghi ở mục 13.
> Mọi con số ở mục 2 đều đo trực tiếp trên code và dữ liệu hiện tại (script ở mục 11) hoặc tái hiện trên app chạy local ngày 02/10.

## 0. Cách dùng plan này

1. Mỗi phiên làm **một mục GĐx**. Đọc mục 10 "Bẫy" trước khi sửa.
2. Không tự đổi các quyết định ở mục 1. Gặp chỗ plan chưa nói thì chọn phương án **giữ tương thích ngược** và ghi vào mục 13 "Nhật ký lệch plan".
3. Xong mỗi mục, chạy lệnh nghiệm thu của mục đó. Lệnh nào cũng phải xanh mới được commit.
4. Commit tiếng Việt theo lối repo, ví dụ `Đố Vui GĐ2: engine chấm đáp án + ghép chữ`.

## 1. Quyết định đề xuất (cần chủ dự án chốt)

| # | Đề xuất | Lý do |
|---|---|---|
| D1 | **Bỏ hẳn phạt.** Không trừ sao khi sai, không mất sao khi xem đáp án, bỏ "bỏ qua phần thưởng kế tiếp". Gợi ý chỉ làm giảm phần thưởng của câu đó. | Trẻ 6–11 tuổi bị phạt ngẫu nhiên khi đoán sai sẽ ngại thử. Không module nào khác trong app có phạt. |
| D2 | **Chất lượng hơn số lượng.** Lọc và nâng cấp kho 999 câu. Bản v1 nhắm khoảng 350 câu tiếng Việt + 150 câu tiếng Anh đạt chuẩn ở mục 5. Câu bị loại vẫn giữ id trong bảng kế thừa để tiến độ cũ không mất. | Kho hiện có trùng, lộ ghi chú biên soạn, độ khó gán theo hình thức (mục 2.3). |
| D3 | **Ba cách trả lời, không bắt buộc gõ phím:** Chọn đáp án (có hình) · Ghép chữ · Tự viết. Mặc định theo lớp, bé đổi được. | Lớp 1–2 gõ tiếng Việt có dấu trên tablet rất khó. Hiện chỉ có ô gõ tự do. |
| D4 | **Câu đố tiếng Anh giữ ở Đố Vui, làm song ngữ.** Đọc bằng giọng Anh, có nút "Dịch", gợi ý bằng tiếng Việt, gắn cấp theo module Tiếng Anh. Khoảng 150 câu dạng định nghĩa "I am a…" bị loại khỏi Đố Vui. | Trẻ Việt lớp 1–3 không đọc nổi câu đố tiếng Anh thuần. Câu "I am a…" là bài từ vựng, không phải câu đố. |
| D5 | **Hình đáp án dùng bộ Microsoft Fluent Emoji 3D (MIT)**, chỉ đóng gói tập con cần dùng, tải theo câu. | Hợp phong cách đất nặn của ảnh hub, hiển thị giống nhau trên mọi máy, không phải vẽ hàng trăm hình. |
| D6 | **Giữ Nhân Sư Ai Cập** như ảnh hub `riddle.webp`, kể thành chuyện "Nhân Sư đi khắp thế gian sưu tầm câu đố". Cổng câu đố Việt Nam có họa tiết trống đồng. | Khớp ảnh bìa đang dùng. Giải thích được vì sao có cả câu đố Việt lẫn câu đố nước ngoài. |
| D7 | **v1 chỉ dành cho lớp 1–5.** Engine có sẵn mức 0 (chỉ nghe và chọn hình) để mở cho Mầm non sau khi có số liệu thử. | Giữ phạm vi v1 vừa sức. Câu đố dân gian rất hợp Mầm non nên không đóng cửa. |
| D8 | **Sửa nóng GĐ0 lên `main` trước khi remake** (mục 7). | Lỗi mất sao đang chạy thật cho người dùng. |
| D9 | Giao diện dùng `HubShell`, token `--hub-*`, font HubNunito, nền sáng kem/cát/xanh ngọc/vàng mật. Ưu tiên **tablet ngang 1180×820**, chạy tốt ở 768 và 390. **Không dùng 3D.** | Đồng bộ với Ôn Luyện, sảnh khám phá và các game mới. Điểm "wow" ở đây đến từ nhân vật, giọng đọc và màn soi manh mối, không cần cảnh 3D nặng. |

## 2. Hiện trạng đã kiểm chứng

Nguồn: [SphinxRiddleScreen.tsx](../src/components/SphinxRiddleScreen.tsx), [RiddleModal.tsx](../src/components/RiddleModal.tsx), [sphinxRiddleService.ts](../services/sphinxRiddleService.ts), [rewardService.ts](../services/rewardService.ts) (từ dòng 125), [StudentContext.tsx](../src/contexts/StudentContext.tsx) (`solveRiddle`), dữ liệu `riddle/data/vnRiddle.json` (499 câu) và `enRiddle.json` (500 câu).

### 2.1 Lỗi đang ảnh hưởng người dùng

| Lỗi | Bằng chứng | Hệ quả |
|---|---|---|
| **Sao thưởng không được cộng.** `RiddleModal` gọi `onProfileUpdate(hồ sơ + sao)`, ngay sau đó gọi `onSolveRiddle`. Hàm `solveRiddle` lấy `currentStudent` cũ từ lần render trước rồi `updateStudent` đè lên. | Tái hiện 02/10: giải đúng câu dễ, màn hình báo "⭐ +1 sao" nhưng `math_profiles[0].stars` vẫn là 0, còn `stats.riddlesSolved` = 1. | Toàn bộ sao từ Đố Vui bị mất, kể cả 10 sao bù khi ra thẻ trùng. Chỉ phần thành tích được giữ. |
| **Chấm đúng cả chuỗi con 2 ký tự.** `checkAnswer` coi là đúng nếu đáp án chứa chuỗi bé gõ (≥ 2 ký tự), hoặc chỉ cần trùng một từ. | Gõ "ày" cho đáp án "Giày" được chấm đúng (tái hiện trên app). Đo trên kho: "ng" đúng 120/499 câu Việt, "on" đúng 89/499, "er" đúng 69/500 câu Anh. "con gà mái" được tính đúng cho "Con gà trống", "mặt trời" đúng cho "Bóng mặt trăng". | Bé gõ bừa vẫn "đúng", phần thưởng mất ý nghĩa. |
| **Gõ không dấu gần như luôn sai.** | Chỉ 98/499 đáp án Việt gõ không dấu được chấp nhận, và cũng chỉ nhờ khớp chuỗi con. | Máy không có bộ gõ tiếng Việt thì gần như không chơi được. |
| Phạt ngẫu nhiên khi sai: 50% mất 1 sao, 50% bị bỏ phần thưởng kế tiếp (cờ phạt lưu ở `localStorage`). Xem đáp án tốn 3/4/5 sao. | `rewardService.ts` dòng 158–250, `RiddleModal.tsx` dòng 49–77. | Bé sợ sai. Cờ phạt nằm ngoài hồ sơ, xoá học sinh cũng không dọn. |
| Hộp "hết câu" in thẳng giá trị enum: "…ở mức độ **easy**". Lời thoại có lỗi chính tả "Ngơi". Dùng `alert()` để báo lỗi. | `SphinxRiddleScreen.tsx` dòng 197, `sphinxRiddleService.ts` dòng 201, `RiddleModal.tsx` dòng 61 và 81. | Lộ chữ kỹ thuật, trông như hàng chưa hoàn thiện. |

### 2.2 Lệch với phần đã remake

- Sảnh dùng nền tím đen, nút đỏ neon và **ảnh chó thần Anubis** (`riddle/imgSource/*.png`, mỗi ảnh khoảng 220 KB), trong khi thẻ ở menu chính là Nhân Sư đất nặn thân thiện trên nền kem. Bé bấm vào thẻ này lại thấy một nhân vật khác.
- Không dùng `HubShell`: header, nút quay lại và chỗ hiện sao khác hẳn các module khác. Phụ đề trong catalog vẫn là tiếng Anh "Sphinx Riddle".
- Không có giọng đọc, trong khi Ôn Luyện, Tiếng Anh, Bảng tuần hoàn… đều đọc to.
- Tiến độ lưu riêng ở `sphinx_profile_<id>` thay vì trong hồ sơ như các module mới (`persistX(profiles, id, …)`).

### 2.3 Cơ chế đơn điệu và nội dung

- Vòng chơi chỉ có một kiểu: chọn độ khó → **một** câu → gõ → đúng/sai → quay về sảnh. Không có chặng, không có mục tiêu tiếp theo, không có bộ sưu tập, không có lý do để quay lại ngày mai.
- **Độ khó gán theo hình thức, không theo độ khó thật:** câu Việt mức dễ đều là một dòng, còn trung bình/khó đều là thơ nhiều dòng (137 + 181 câu). Câu Anh mức khó có 114/200 câu dạng định nghĩa "I am a professional who designs buildings…".
- **Trùng lặp:** 27 câu hỏi trùng nguyên văn (8 Việt, 19 Anh), có câu trùng nhưng nằm ở hai mức khó khác nhau. Cặp VN-177/VN-394 cùng câu "Con gì đập thì sống, không đập thì chết?" nhưng một bên đáp "Quả tim", bên kia đáp "Con quay".
- **Lộ ghi chú biên soạn** trong phần giải thích hiện cho trẻ: VN-113 "(tránh câu đố liên quan đến tín ngưỡng)", VN-123 "(Watermelon đã dùng…)", VN-125, VN-211.
- Gợi ý chỉ có một dòng `note`, không đồng nhất (63 kiểu viết khác nhau, ví dụ "Đáp án là danh từ độ dài từ 3 từ"). Không có gợi ý theo bậc, không có đáp án thay thế, cũng không có từ địa phương (quả/trái, ngô/bắp, lợn/heo, bát/chén).
- Nội dung cần cân nhắc với trẻ: hai câu về quan tài (EN-192, EN-307), xe tăng (EN-499), "làm thành rượu quý" (VN-447), quạ "báo hiệu điều gì đó" (VN-113).

## 3. Hướng sản phẩm

**Tên giữ "Đố Vui Nhân Sư"**, phụ đề mới: *"Mỗi cánh cổng, một câu đố"*. Nhãn thẻ hub giữ "SUY LUẬN".

**Câu chuyện:** Nhân Sư là người gác cổng đi khắp thế gian sưu tầm câu đố. Bé là người bạn đồng hành: giải một câu là cổng đá sáng thêm một ô, giải trọn một cổng là cổng mở ra và Sổ Đố có thêm một trang.

**Thao tác trung tâm:** *nghe → soi manh mối → đoán → hiểu vì sao đúng*. Phần đáng giá nhất về học tập là bước cuối: sau khi trả lời, từng manh mối trong câu đố sáng lên kèm lời giải nghĩa. Bé học được **cách** giải câu đố (suy luận từ đặc điểm), chứ không chỉ biết thêm một đáp án.

**Mục tiêu một lượt chơi:** một chặng 5 câu (lớp 1 là 4 câu), khoảng 3–5 phút, không đếm giờ.

## 4. Vòng chơi

### 4.1 Sảnh "Ốc đảo Nhân Sư" (1180×820)

- **Bên trái (~55%):** cảnh ốc đảo với Nhân Sư (ảnh nhiều lớp có parallax nhẹ theo con trỏ hoặc cảm biến nghiêng, tắt khi giảm chuyển động). Bong bóng thoại chào bé theo tên và đọc to.
- **Bên phải:** thẻ chính **"Đi tiếp"** (cổng sắp tới, 5 câu, khoảng 4 phút) · thẻ **"Câu đố hôm nay"** · hàng nút nhỏ: **Sổ Đố** (đã sưu tầm n câu), **Đố cả nhà**, **Ôn lại** (n câu cần ôn).
- **Dải cổng phía dưới:** 8 cổng, mỗi cổng có vòng tiến độ. Bấm vào một cổng để chơi riêng chủ đề đó.

| Cổng | Nội dung |
|---|---|
| Muông Thú | con vật, chim, côn trùng |
| Vườn Cây Trái | cây, hoa, quả, củ, món bánh |
| Nhà Đồ Vật | đồ dùng, đồ chơi, dụng cụ, phương tiện |
| Trời Đất | hiện tượng tự nhiên, thiên văn, cơ thể người |
| Đất Việt | địa danh, nhân vật lịch sử, phong tục (lớp 4–5) |
| Chữ Nghĩa | đố chữ, thêm/bớt dấu, nói lái nhẹ |
| Mẹo Hay | đố mẹo, đố logic, toán mẹo |
| Bốn Phương | câu đố tiếng Anh (song ngữ) |

### 4.2 Một câu đố

1. **Đọc:** Nhân Sư (tư thế "cầm cuộn giấy") đọc câu đố. Thơ được đọc từng dòng, dòng đang đọc sáng lên. Có nút "Đọc lại". Câu tiếng Anh đọc bằng giọng Anh, có nút "Dịch".
2. **Trả lời** theo một trong ba kiểu (D3):
   - **Chọn:** 4 thẻ đáp án, có hình nếu có. Chạm giữ một thẻ để nghe đọc tên. Chọn sai thì thẻ đó mờ đi, bé chọn tiếp.
   - **Ghép chữ:** ô trống theo số tiếng của đáp án (từ chỉ loại như "con", "cái", "quả" điền sẵn), thêm các tiếng đúng trộn với 2–3 tiếng gây nhiễu. Câu tiếng Anh ghép chữ cái (từ dài hơn 8 chữ thì ghép theo cụm).
   - **Tự viết:** ô gõ. Chấp nhận gõ không dấu, không phân biệt quả/trái và các từ địa phương. Nếu bé gõ thiếu dấu thì vẫn tính đúng, kèm nhắc nhẹ cách viết đúng chính tả.
3. **Thang gợi ý** (nút "Gợi ý", hiện 0/3): G1 nhóm đáp án ("Đây là một con vật nuôi trong nhà") → G2 một manh mối được nói lại cho dễ hiểu → G3 hình dạng đáp án, tạo tự động ("2 tiếng, tiếng đầu bắt đầu bằng G") → "Đổi sang chọn đáp án" → "Xem đáp án".
4. **Gần đúng:** đáp án nằm trong danh sách `close` (ví dụ "gà" cho "gà trống") thì Nhân Sư nói "Đúng là gà rồi, nhưng là gà gì nhỉ?". Không tính là một lần sai.
5. **Phản hồi:**
   - **Đúng:** một ô trên cổng đá sáng lên, Nhân Sư reo vui. Mở thẻ **"Soi manh mối"**: các cụm từ manh mối trong câu đố được tô màu, mỗi cụm kèm một dòng giải nghĩa, rồi đọc phần "Vì sao?".
   - **Sai:** lời động viên nhẹ, tự gợi ý G1 ở lần sai thứ hai. Không còi báo lỗi, không rung.
   - **Xem đáp án:** vẫn có màn soi manh mối. Câu đó vào danh sách Ôn lại.

### 4.3 Hết chặng

Lưu kết quả trước, sau đó mới chạy hiệu ứng tổng kết: số dấu ấn nhận được, sao, các trang Sổ Đố mới, tiến độ cổng. Ba nút: **Đi tiếp** · **Chơi lại cổng này** · **Nghỉ**. Giải trọn một cổng thì cổng mở ra (hoạt cảnh khoảng 2 giây, bấm để bỏ qua) và bé nhận một ảnh album chắc chắn (dùng kho gacha hiện có).

### 4.4 Các chế độ khác

- **Câu đố hôm nay:** chọn câu theo ngày (seed = ngày). Mọi hồ sơ trong máy nhận cùng một câu để cả nhà cùng bàn, có sao thưởng thêm.
- **Ôn lại:** những câu đã xem đáp án hoặc phải dùng nhiều gợi ý sẽ quay lại sau 1, 3 rồi 7 ngày (giống cơ chế ôn câu sai ở Ôn Luyện, nhưng nhẹ hơn).
- **Sổ Đố:** bộ sưu tập theo cổng. Mỗi trang là câu đố, hình đáp án, manh mối và lời giải, đọc lại được. Nút "Đố người khác" mở thẳng chế độ Bé làm Nhân Sư với câu đó.
- **Đố cả nhà** (GĐ6), cùng một máy:
  - **Bé làm Nhân Sư:** bé đọc câu đố cho bố mẹ, đáp án được che, phải giữ nút mới hiện. Bé bấm Đúng hoặc Sai cho người trả lời. Bé luyện đọc to và thấy mình là người ra đề.
  - **Thi đố 2–4 người:** lần lượt trả lời theo kiểu Chọn, có bảng điểm, theo khuôn "2–4 NGƯỜI · CÙNG MỘT MÁY" của các board game.
- **Đố hình** (GĐ6), dùng chính bộ hình đáp án:
  - *Bóng của ai?*: hình bị phủ đen bằng CSS filter.
  - *Nhìn qua lỗ khoá*: hình mở dần, đoán sớm được nhiều dấu ấn hơn.
  - *Ai là kẻ lạ?*: chọn hình không cùng nhóm, rồi nói lý do.

### 4.5 Độ khó thích ứng

- Mỗi ngôn ngữ có một chỉ số mức trong khoảng 1,0–3,0. Khởi điểm theo lớp: lớp 1–2 là 1,0 · lớp 3–4 là 1,8 · lớp 5 là 2,3.
- Mỗi câu: giải không cần gợi ý +0,15 · cần 1–2 gợi ý +0 · xem đáp án −0,2. Câu tiếp theo lấy mức = làm tròn chỉ số, nhưng có 20% số câu lấy thấp hơn một mức để bé giữ được tự tin.
- Một chặng gồm 3 câu mới của cổng đang đi, 1 câu đến hạn ôn và 1 câu của cổng khác (xen kẽ chủ đề). Trong một chặng không có hai câu cùng đáp án.
- Kiểu trả lời mặc định: mức 1 → Chọn · mức 2 → Ghép chữ · mức 3 → Tự viết. Bé đổi được trong cài đặt, lựa chọn được ghi nhớ.

### 4.6 Phần thưởng (D1). Số cụ thể đặt trong `rewards.ts` để chỉnh

| Tình huống | Dấu ấn |
|---|---|
| Đúng ngay lần đầu, không gợi ý | 3 |
| Đúng sau 1 gợi ý hoặc ở lần thử thứ 2 | 2 |
| Đúng sau nhiều trợ giúp hoặc đã đổi kiểu trả lời | 1 |
| Xem đáp án | 0, vào danh sách Ôn lại |

- **Sao của chặng** = ⌈tổng dấu ấn của các câu giải lần đầu ÷ 3⌉, tối đa 5. Giải lại câu cũ không có sao nhưng vẫn vui.
- **Câu đố hôm nay:** +2 sao. **Giải trọn cổng:** 1 ảnh album chắc chắn.
- **Thành tích cũ vẫn chạy:** gửi `SOLVE_RIDDLE` với `category` = `vn_riddle` hoặc `en_riddle`, `difficulty` = easy/medium/hard (đổi từ mức 1/2/3). Chỉ tính lần giải đầu.
- Trước khi chốt, đo bằng script: số sao trung bình mỗi phút so với Ôn Luyện và Lật Thẻ.

## 5. Nội dung v2

### 5.1 Hợp đồng dữ liệu

```ts
// src/riddle/content/types.ts
export type RiddleLang = 'vi' | 'en';
export type RiddleKind = 'object' | 'wordplay' | 'logic' | 'math' | 'picture';
export type GateId = 'animals' | 'plants' | 'objects' | 'nature' | 'vietnam' | 'words' | 'tricks' | 'world';
export interface Riddle {
  id: string;              // giữ rID cũ (VN-001, EN-001) khi kế thừa; câu mới: VN-1001…
  lang: RiddleLang;
  kind: RiddleKind;
  gate: GateId;
  level: 0 | 1 | 2 | 3;    // 0 = Mầm non (chỉ nghe + chọn hình), 1 = lớp 1–2, 2 = lớp 3–4, 3 = lớp 5
  text: string;            // dòng thơ cách bằng \n
  speech?: string;         // văn bản riêng cho TTS khi chữ viết khó đọc
  vi?: string;             // bản dịch (bắt buộc với lang 'en')
  answer: string;          // dạng hiển thị: "Con gà trống"
  accept: string[];        // các cách viết đúng khác: ["gà trống", "chú gà trống"]
  close?: string[];        // gần đúng → nhắc nghĩ thêm: ["gà"]
  hints: [string, string]; // G1 nhóm, G2 manh mối nói lại (G3 tự sinh)
  choices: [string, string, string]; // 3 đáp án nhiễu cùng nhóm, không thuộc accept/close
  clues?: { quote: string; means: string }[]; // quote phải là chuỗi con của text
  explain: string;         // ≤ 2 câu, giọng nói với trẻ, không chứa ghi chú biên soạn
  picture?: string;        // id hình trong bộ hình đáp án (D5)
  vocabId?: string;        // câu tiếng Anh: id từ vựng trong module Tiếng Anh nếu có
  source: 'dân gian' | 'sưu tầm' | 'biên soạn';
}
```

### 5.2 Tiêu chuẩn mỗi câu (kiểm bằng test)

- id là duy nhất. Câu hỏi không trùng nguyên văn, và không trùng khi đã chuẩn hoá (bỏ dấu câu, khoảng trắng).
- `accept` có chứa dạng chuẩn hoá của `answer`. `choices` không giao với `accept` hay `close`. Các đáp án nhiễu cùng `gate` với đáp án đúng và khác nhau đôi một.
- Các tiếng gây nhiễu ở kiểu Ghép chữ không được ghép thành một đáp án hợp lệ khác.
- Mỗi `clues[].quote` là chuỗi con của `text`. `explain` không có ngoặc đơn chứa chữ "tránh", "đã dùng", "sửa lại", "câu đố này"…
- Gợi ý G2 không chứa nguyên đáp án. Nếu đáp án xuất hiện trong câu hỏi thì câu phải là loại `wordplay`, hoặc được đánh dấu đã duyệt.
- Câu tiếng Anh phải có `vi`. Danh sách từ cấm và chủ đề nhạy cảm (chết, vũ khí, rượu bia, mê tín) phải được rà tay và ký duyệt.

### 5.3 Quy trình

1. `scripts/riddle-audit.mjs` đọc kho cũ và in báo cáo: câu trùng, cặp trùng câu khác đáp án, ghi chú bị lộ, câu dạng "I am a…", câu có đáp án nằm trong câu hỏi, từ nhạy cảm.
2. Script gán tự động `gate` từ `note` cũ (63 kiểu viết gom về 8 cổng), sau đó duyệt tay.
3. Dùng Gemini để soạn **nháp** các trường `accept`, `close`, `hints`, `choices`, `clues`, `explain`, `vi`, `picture`. Script chạy tại máy, khoá đặt trong biến môi trường, không chạy lúc người dùng chơi. Nháp ghi ra file `.draft.json`.
4. Test ở 5.2 phải xanh. Sau đó xuất trang duyệt HTML (mỗi câu một thẻ, nút đạt/sửa/loại) để người duyệt chấm, kết quả ghi vào `docs/riddle-content-review.md`.
5. Gán lại `level` theo độ khó thật: dựa trên độ quen của đáp án với trẻ, số manh mối cần ghép và việc câu có ẩn dụ hay chơi chữ hay không. Hình thức thơ hay văn xuôi không quyết định mức.
6. Bổ sung câu mới cho các cổng còn thiếu, ưu tiên Chữ Nghĩa, Mẹo Hay và mức 1 (lớp 1–2 hiện thiếu nhiều nhất). Mỗi câu ghi rõ `source`.

### 5.4 Bộ hình đáp án (D5)

- `scripts/riddle-pictures.mjs` lấy tập con Fluent Emoji 3D (bản PNG có nền trong suốt) theo danh sách `picture` thực sự được dùng, chuyển thành WebP 128 px bằng `sharp`, đặt ở `public/riddle/pictures/`, kèm `LICENSE` (MIT) và `README.md` ghi nguồn.
- Ngân sách: mỗi hình ≤ 8 KB, tải theo câu (mỗi câu tối đa 4 hình), **không precache** trong PWA.
- Câu không có hình thì thẻ Chọn chỉ hiện chữ, với khung màu của cổng.

## 6. Kiến trúc đích

Đi theo khuôn 3 tầng của các module đã remake: lõi thuần → lưu trữ thuần → React. Đặt ở `src/riddle/` (là một mode như `src/english/`, không phải game trong `GAME_CATALOG`).

```
src/riddle/
  content/  types.ts · riddles.vi.json · riddles.en.json · gates.ts · legacy-ids.ts · content.test.ts
  engine/   normalize.ts   chuẩn hoá tiếng Việt (NFC, vị trí dấu cũ/mới hoà↔hòa, bỏ từ chỉ loại, quả↔trái, từ địa phương)
            judge.ts       judge(riddle, input) → 'correct' | 'correct_spelling' | 'close' | 'wrong'   (KHÔNG khớp chuỗi con)
            tiles.ts       tách tiếng/chữ cái + tiếng gây nhiễu an toàn
            planner.ts     chọn câu cho chặng / hôm nay / ôn lại; độ khó thích ứng; seed cố định
            round.ts       reducer chặng: reading → answering → feedback → summary; gợi ý; số lần thử
            rewards.ts     dấu ấn → sao; thưởng cổng; đổi sang thông số thành tích cũ
            *.test.ts
  progress/ model.ts       RiddleProgress v1 (lưu ở profile.riddle)
            progress.ts    completeRound(profile, round) thuần → {profile, earned, unlocked}; chống ghi trùng theo round.id
            legacy.ts      nhập sphinx_profile_<id> → profile.riddle, bỏ cờ phạt
            draft.ts       riddle-draft:<id> để tải lại giữa chặng vẫn chơi tiếp
            *.test.ts
  ui/       RiddlePage.tsx · Oasis.tsx (sảnh) · Round.tsx · inputs/{Choice,Tiles,Typing}.tsx · ClueReveal.tsx
            Summary.tsx · Album.tsx · Family.tsx · Sphinx.tsx (đổi tư thế) · useRiddleVoice.ts · riddle.css
```

- **StudentContext:** thêm `completeRiddle(owner, round)` gọi `persistRiddle(profiles, id, round, saveProfiles)`. Hàm này dùng `studentsRef` (ảnh chụp đồng bộ) và **tính sao, thành tích, album trong cùng một lần ghi**, nên lỗi ở 2.1 không còn chỗ xảy ra. Bỏ `solveRiddle`.
- **Giọng đọc:** dùng `speak` / `speakSequence` ở [speech.ts](../src/utils/speech.ts), đọc thơ từng dòng, chờ `onEnd` rồi mới mở nhập. Hạ nhỏ nhạc nền khi đang đọc, giống `voiceSpeak` của Rồng Thần. Huỷ giọng khi rời trang.
- **Nhạc:** giữ track `SPHINX_RIDDLE`, chỉnh âm lượng mặc định thấp hơn khi có giọng.
- Giữ ẩn `AIChatWidget` trên `/riddle` để không có đường tắt hỏi đáp án.

### 6.1 Dữ liệu tiến độ

```ts
export interface RiddleProgress {
  version: 1;
  solved: Record<string, { at: string; seals: 0 | 1 | 2 | 3; mode: 'choice' | 'tiles' | 'type' | 'family'; legacy?: true }>;
  legacySolved: string[];                     // id cũ đã giải nhưng bị loại khỏi kho v2: vẫn tính thành tích
  review: { id: string; due: string; misses: number }[];   // ≤ 60
  rating: { vi: number; en: number };         // 1,0–3,0
  daily: { date: string; id: string; done: boolean } | null;
  gates: Partial<Record<GateId, { rewardClaimed: boolean }>>;
  recentRounds: string[];                     // ≤ 20, chống ghi trùng
  settings: { autoRead: boolean; input?: 'choice' | 'tiles' | 'type'; showVi: boolean };
}
```

**Kế thừa:** lần đầu đọc, nếu `profile.riddle` chưa có mà có `sphinx_profile_<id>` thì nhập `answeredRiddleIds` vào hồ sơ. Id còn trong kho mới vào `solved` (đánh dấu `legacy: true`, 3 dấu ấn), id đã bị loại vào `legacySolved`. Không đụng `stats.riddlesSolved` vì đã được đếm từ trước. Xoá key cũ sau khi ghi thành công. `deleteStudent` dọn thêm `riddle-draft:<id>`.

## 7. Thứ tự thi công

| GĐ | Nội dung | Nghiệm thu |
|---|---|---|
| **0 · Sửa nóng trên bản cũ** (lên `main` ngay, D8) | (a) Gộp phần thưởng và `SOLVE_RIDDLE` vào một lần cập nhật hồ sơ. (b) `checkAnswer` bỏ khớp chuỗi con và khớp một từ; chỉ so khớp nguyên cụm sau khi bỏ từ chỉ loại, chấp nhận không dấu. (c) Sửa chữ "easy" và lỗi "Ngơi". (d) Xoá 4 ghi chú bị lộ và cặp câu trùng mâu thuẫn. (e) Bỏ `alert()`. | Test mới cho `checkAnswer` ("ày" sai, "con meo" đúng, "con gà mái" sai). Giải một câu trên app thì sao trong `math_profiles` tăng đúng bằng số hiển thị. |
| **1 · Nội dung v2** | Hợp đồng dữ liệu 5.1, script audit, gán cổng, soạn nháp, duyệt, gán lại mức, bộ hình đáp án. | `npx vitest run src/riddle/content`, `node scripts/riddle-audit.mjs` báo 0 lỗi chặn, bản duyệt ký xong. |
| **2 · Engine** | normalize, judge, tiles, planner, round, rewards. | `npx vitest run src/riddle/engine`. Bảng ca chấm tiếng Việt gồm hoà/hòa, NFD từ iOS, quả/trái, không dấu, từ gần đúng. Planner chạy 10 000 chặng giả lập: không trùng đáp án trong chặng, phân bố mức đúng thiết kế. |
| **3 · Lưu & tích hợp** | `RiddleProgress`, `persistRiddle`, kế thừa, nháp, thành tích, dọn khi xoá học sinh. | Test thuần cho chống ghi trùng, kế thừa và giữ nguyên tổng thành tích. Hai lần gọi hoàn tất liên tiếp trước khi render không làm mất sao. |
| **4 · Mỹ thuật** | Lấy `riddle.webp` làm ảnh tham chiếu để tạo trên Google Flow: Nhân Sư 6 tư thế (chào, cầm cuộn đọc, suy nghĩ, chỉ gợi ý, reo vui, động viên), nền ốc đảo nhiều lớp, 8 cổng, khung Sổ Đố. Ghi prompt và nguồn vào `public/riddle/README.md`. | Mỗi ảnh nhân vật ≤ 120 KB, nền ≤ 250 KB. Màn đầu tải ≤ 500 KB. Không có chữ do AI vẽ sai. |
| **5 · Giao diện** | Sảnh, màn chơi với 3 kiểu nhập, thang gợi ý, soi manh mối, tổng kết, Sổ Đố, câu đố hôm nay, Ôn lại, cài đặt. Đồng bộ giọng đọc. Xử lý bố cục cả 3 cỡ màn hình, a11y và chế độ giảm chuyển động. | `node scripts/riddle-shots.mjs` chụp 1180×820 / 768×1024 / 390×844, màn chơi ở 1180×820 không phải cuộn. Bàn phím đi hết luồng, kết quả đúng/sai có `aria-live`. `npx tsc --noEmit`, `npm run build`. |
| **6 · Chế độ mở rộng** | Đố cả nhà (Bé làm Nhân Sư, thi 2–4 người), Đố hình (bóng, lỗ khoá, kẻ lạ), widget thêm/bớt dấu cho Chữ Nghĩa, gói Toán mẹo dùng bàn phím số. | Test reducer cho từng chế độ, ảnh chụp từng chế độ. |
| **7 · Dọn & bàn giao** | Xoá `SphinxRiddleScreen*`, `RiddleModal*`, `sphinxRiddleService.ts`, ảnh `riddle/imgSource`, các hàm phạt không còn ai dùng trong `rewardService.ts`, kiểu `PenaltyType`. Cập nhật phụ đề catalog, README, `docs/riddle-implementation.md`. | `npx vitest run` toàn repo, `npx tsc --noEmit`, `npm run build` xanh. `grep -r "sphinxRiddleService\|PenaltyType"` không còn kết quả. |

**Mốc xem thử đầu tiên** (sau GĐ5 bản rút gọn): cổng Muông Thú với 30 câu đã duyệt, đủ 3 kiểu trả lời, soi manh mối và tổng kết. Chốt cảm giác chơi và chất lượng hình ở mốc này rồi mới nhân rộng nội dung.

## 8. Giao diện và khả năng tiếp cận

- Vùng chạm ≥ 48 px. Chữ câu đố ≥ 22 px trên tablet. Thơ căn trái, mỗi dòng thơ là một dòng hiển thị.
- Ô gõ dùng `inputmode="text"`, `autocapitalize="none"`, `autocomplete="off"`. Khi bàn phím ảo bật lên, giữ câu đố trong tầm nhìn (đo bằng `visualViewport`).
- Dùng màu kèm biểu tượng, không dùng màu đơn thuần để báo đúng/sai. Chế độ giảm chuyển động: thay hiệu ứng mở cổng và parallax bằng chuyển trạng thái nhẹ.
- Mọi hoạt cảnh đều bỏ qua được. Không có hoạt cảnh nào chặn thao tác quá 2 giây.

## 9. Ngoài phạm vi v1

- Dùng AI chấm câu trả lời tự do lúc chơi (cần mạng, khó kiểm soát và có vấn đề riêng tư).
- Bảng xếp hạng trực tuyến. Mở cho Mầm non (D7, chờ số liệu thử).

## 10. Bẫy

- **Ghi hồ sơ hai lần trong một lượt render** chính là nguyên nhân mất sao hiện nay. Mọi thay đổi hồ sơ của một chặng phải đi qua **một** hàm thuần và ghi một lần.
- **Không khớp chuỗi con** khi chấm đáp án. Chỉ so nguyên cụm sau khi chuẩn hoá, cộng với danh sách `accept` và `close` soạn sẵn.
- Bàn phím iOS có thể gửi chuỗi NFD, và có hai kiểu đặt dấu thanh (hoà/hòa, thuỷ/thủy): phải chuẩn hoá cả hai. Bỏ dấu chỉ dùng để so khi chấm, **luôn hiển thị đáp án có dấu**.
- Chrome tự cắt câu đọc dài hơn khoảng 15 giây, nên đọc thơ từng dòng. Bắt `onEnd` và `onError` để không kẹt ở bước "đang đọc" trên máy không có giọng Việt.
- Tiếng gây nhiễu ở kiểu Ghép chữ có thể vô tình ghép thành một đáp án đúng khác: kiểm bằng test.
- Hình phủ bóng cần PNG có nền trong suốt, nên chọn đúng biến thể khi tải Fluent Emoji.
- `vite-plugin-pwa` có thể precache cả thư mục `public/riddle/pictures`: loại khỏi `globPatterns`.
- Bé trả lời bằng từ địa phương (bắp, heo, chén, trái thơm…): phải được tính đúng. Bảng từ địa phương nằm ở một chỗ duy nhất (`normalize.ts`).

## 11. Script đo hiện trạng (để kiểm lại các con số ở mục 2)

```bash
node -e "const v=require('./riddle/data/vnRiddle.json'),e=require('./riddle/data/enRiddle.json');for(const[n,d]of[['vi',v],['en',e]]){const q=d.map(r=>r.question.trim());console.log(n,d.length,'trùng',q.length-new Set(q).size)}"
```

Tái hiện lỗi mất sao: tạo hồ sơ thử → Đố Vui → Dễ → giải đúng một câu → so `JSON.parse(localStorage.math_profiles)[0].stars` với số sao được báo trên màn hình.

## 12. Tiêu chí nghiệm thu cuối

- Bé lớp 1 chơi trọn một chặng mà **không phải gõ phím**, mọi câu đều được đọc to.
- Không còn đường nào làm trừ sao. Sao hiển thị luôn bằng sao được lưu (có test và đo trên app).
- Gõ một mẩu 2 ký tự không bao giờ được tính đúng. "con meo" và "trai thom" được chấp nhận, kèm nhắc cách viết.
- Kho v2: 0 câu trùng, 0 ghi chú biên soạn bị lộ. Mọi câu có 2 gợi ý soạn sẵn và 3 đáp án nhiễu cùng nhóm. Mọi câu tiếng Anh có bản dịch.
- Tải lại trang giữa chặng thì tiếp tục đúng câu đang làm. Tiến độ cũ (`sphinx_profile_*`) được nhập đủ, tổng thành tích không giảm.
- Màn chơi ở 1180×820 không phải cuộn. Ở 390 px vẫn dùng được, không cuộn ngang.

## 13. Nhật ký lệch plan

- **D5 / 5.4 (Fluent Emoji):** chưa tải bộ hình Fluent (cần xin phép tải file ngoài). Hình đáp án dùng emoji hệ thống, giống module Tiếng Anh. Thẻ Chọn chỉ hiện hình khi cả 4 đáp án đều có emoji, để thẻ thiếu hình không thành dấu hiệu lộ đáp án. Hiện 154/565 câu tiếng Việt có đủ hình cho cả 4 thẻ. Pipeline Fluent vẫn làm được sau, chỉ cần đổi component hiển thị emoji.
- **GĐ4 (ảnh Google Flow):** thay bằng nhân vật Nhân Sư vẽ bằng SVG (6 nét mặt, chớp mắt, nói, vẫy đuôi) và cảnh ốc đảo SVG nhiều lớp có parallax. Không tải ảnh nào, đồng bộ với bảng màu của `riddle.webp`. Thẻ ở hub vẫn dùng `riddle.webp`.
- **Nội dung:** thay vì nháp bằng Gemini, các lô do agent Claude biên tập theo `docs/riddle-wow/content-spec.md`, rồi được kiểm bằng `scripts/riddle-validate.mjs` và `src/riddle/content/content.test.ts`. Chưa có người duyệt tay từng câu. Danh sách câu bị loại và lý do ở `docs/riddle-wow/dropped.json`.
- **Chấm đáp án:** thêm kết quả `marks` (gõ không dấu mà trùng cả đáp án lẫn đáp án nhiễu, vd "dua" = dứa/dừa: nhờ gõ có dấu, không tính là lần sai). Từ chỉ loại tách làm 2 nhóm: nhóm chung (con, cái, chiếc…) luôn được bỏ; nhóm mang nghĩa (quả, hoa, cây…) được phép thiếu nhưng không được khác ("quả hồng" ≠ "hoa hồng"). "cặp" không coi là từ chỉ loại.
- **GĐ6:** đã làm Đố cả nhà (Bé làm Nhân Sư, Thi đố 2–4 người), Đố hình (bóng, lỗ khoá, kẻ lạ) và gói toán mẹo có bàn phím số. **Chưa làm** widget kéo thả dấu thanh riêng cho cổng Chữ Nghĩa: phần explain đã nêu rõ phép biến đổi.
- **Script chụp ảnh `riddle-shots.mjs`:** chưa viết. Đã kiểm thủ công trên browser pane ở 1180×820 và 390×844.
- Câu tiếng Anh gốc có id trùng `VN-032` (Cow) được đổi thành `EN-032`.
