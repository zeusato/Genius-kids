# Xưởng Tô Màu — kế hoạch triển khai

> Lập 13/10/2026; cập nhật triển khai 14/10/2026. **Đã có module chạy được ở `/coloring`, 40 mẫu ImageGen, các nhóm chức năng GĐ1–8.** Xem mục 14 để biết phạm vi thực tế, khác biệt và kiểm chứng; các mục trước đó giữ lại thiết kế ban đầu, không phải tuyên bố mọi tiêu chí đã đạt. Mã nguồn được tích hợp vào nhánh main; việc phát hành theo quy trình của repository.
> Các con số ở mục 2 và mục 7 đo bằng script thử nghiệm trong [coloring-studio/spike/](coloring-studio/spike/) (Node 22, sharp 0.34, máy dev 20 luồng). Số đo trên tablet phải đo lại ở GĐ2.

## 0. Cách dùng plan này

1. Mỗi phiên làm **một mục GĐx** ở mục 9. Đọc mục 11 "Bẫy" trước khi sửa.
2. Không tự đổi các quyết định ở mục 1. Gặp chỗ plan chưa nói thì chọn phương án đơn giản hơn và ghi vào mục 14 "Nhật ký lệch plan".
3. Xong mỗi GĐ, chạy lệnh nghiệm thu của GĐ đó. Lệnh nào cũng phải xanh mới được commit.
4. Commit tiếng Việt theo lối repo, ví dụ `Tô Màu GĐ2: màn tô cốt lõi + xô màu loang`.

## 1. Quyết định đề xuất (cần chủ dự án chốt)

| # | Đề xuất | Lý do |
|---|---|---|
| D1 | **Module riêng "Xưởng Tô Màu"** (`/coloring`, `ModeId 'coloring'`), có ở sảnh của mọi lớp, kể cả Mầm non. Hoạt động "Tô màu theo yêu cầu" của Mầm non giữ chỗ cũ nhưng chạy bằng engine mới (chế độ Nghe và tô). | Tô màu hợp từ 3 đến 11 tuổi. Nhét vào mục Màu Sắc của Mầm non thì lớp 1–5 không thấy. |
| D2 | **Không bao giờ tô hỏng.** Mọi thao tác đều bị giới hạn trong **một vùng**. Xô màu tô kín vùng được chạm. Bút vẽ bị cắt theo vùng nơi nét bắt đầu. Chạm trúng nét đen thì tính là vùng gần nhất. | Đây là yêu cầu gốc. Giữ được bất biến này thì hoàn tác cũng rẻ (mục 6.4). |
| D3 | **Engine raster + nét vector.** Vùng tô là bản đồ nhãn 2048×2048 được tính sẵn khi build. Màu vẽ trên Canvas 2D, nét đen là SVG đặt trên cùng nên phóng to vẫn sắc. Phần lõi không dùng WebGL. | Một engine dùng được cho mọi nguồn tranh (SVG, ảnh AI, tranh bé tự vẽ). Đo được: tách vùng 150 ms, tô một vùng dưới 2 ms (mục 7.2). |
| D4 | **Tranh đẹp là điều kiện tiên quyết. Claude không tự vẽ tranh bằng tay.** Nguồn chính: tranh tô màu sinh bằng AI (ImageGen, Google Flow hoặc plugin Abracadabrax) theo **một bộ quy chuẩn phong cách** (mục 5.2), vector hoá sang SVG, rồi người duyệt bằng bảng xem trước. OpenMoji (CC BY-SA 4.0) chỉ dùng bổ sung cho Mầm non, sau khi lọc hình nét kín. | Chủ dự án chê tranh tự vẽ trong spike. Đo OpenMoji: khoảng một nửa hình có nét hở, hình nào cũng chỉ 1–15 vùng (mục 2.3). |
| D5 | **Có cổng duyệt phong cách (GĐ0) trước khi viết code giao diện.** Làm 12 trang mẫu, 3 cấp × 4 chủ đề. Chủ dự án duyệt xong mới sản xuất hàng loạt. | Rủi ro lớn nhất là tranh xấu hoặc không đồng bộ, không phải code. |
| D6 | **Tô tự do không có đúng/sai.** Sao chỉ trao lần đầu tô xong một trang (≥ 95% vùng). Các chế độ trò chơi (Tô theo số, Toán tô màu, Nghe và tô) mới chấm điểm. | Không biến sáng tạo thành bài kiểm tra. Không cày sao bằng cách tô lại. |
| D7 | **Tranh của bé lưu trong IndexedDB dưới dạng nhật ký thao tác + ảnh thu nhỏ.** Hồ sơ học sinh chỉ giữ tiến độ nhẹ `profile.coloring` (< 5 KB). | Nhật ký thao tác rất nhỏ (vài chục KB), xem lại được quá trình tô, và không làm phình hồ sơ đồng bộ Supabase. |
| D8 | **Trang vuông 2048×2048.** Ưu tiên **tablet ngang 1180×820**, chạy tốt ở 820×1180 và 390×844. Giao diện dùng `HubShell` và token `--hub-*`. | Trang vuông đặt được ở cả tablet ngang lẫn dọc mà không phải dàn lại. Đồng bộ với các module đã làm lại. |
| D9 | **Điểm "wow" là Thế Giới Sống (GĐ7):** con vật bé tô xong sẽ bơi, bay, chạy trong một cảnh chung (lấy cảm hứng từ Sketch Aquarium của teamLab). AI vẽ trang theo lời bé nói để ngoài phạm vi v1. | Cho bé lý do để tô xong và quay lại vào hôm sau. Tính năng AI theo yêu cầu cần khoá API, kiểm soát an toàn nội dung và có độ trễ, nên làm sau. |

## 2. Hiện trạng đã kiểm chứng

### 2.1 Code có sẵn

- [ColoringActivity.tsx](../src/components/preschool/ColoringActivity.tsx) (119 dòng): có 4 hình SVG cứng (bóng bay, ngôi sao, trái tim, con cá), mỗi hình **1 vùng**. Chọn màu là tô cả hình, sai màu thì báo sai. Không có bút, không lưu tranh, không phóng to. Hoạt động này nằm ở `/preschool/colors` (activity `color`) trong [catalog.ts](../src/components/preschool/catalog.ts).
- Những thứ dùng lại được:
  - Đọc to: `speak`, `speakSequence` trong [speech.ts](../src/utils/speech.ts).
  - Âm thanh: `soundManager` trong [sound.ts](../utils/sound.ts).
  - Trao thưởng: `processGameReward` qua mẫu `usePreschoolReward`.
  - Dữ liệu tên màu: `COLORS_DATA`.
  - Lưu IndexedDB: mẫu ở [repository.ts](../src/components/planetmaker/persistence/repository.ts) của Xưởng Hành Tinh.
  - Ghi hồ sơ một lần: mẫu `persistRiddle`.
  - Mục sảnh: [hub/catalog.ts](../src/components/hub/catalog.ts) và test của nó.
- PWA: [sw.ts](../pwa/sw.ts) chỉ cài trước JS/CSS/HTML. Media trong `public/` được tải khi dùng hoặc khi bấm "Tải toàn bộ offline". `globPatterns` hiện có `json`, `svg`, `webp`, `bin` nhưng **không có đuôi lạ** như `.rgn`. Bộ offline hiện khoảng 74 MB.

### 2.2 Spike tách vùng (ảnh [spike-gap-closing.webp](coloring-studio/spike-gap-closing.webp))

Trang thử: [scene.svg](coloring-studio/spike/scene.svg). Đây chỉ là hình để thử thuật toán, **không phải tranh dùng thật**. Nét 10 px ở 2048, có cố ý chừa một khe 14 px ở đám mây.

| Đo | Kết quả |
|---|---|
| Thời gian ở 2048²: raster hoá / khoảng cách / gán nhãn / bỏ vụn / lan nhãn xuống dưới nét / thống kê | 58 / 47 / 40 / 9 / 35 / 18 ms, tổng khoảng **150 ms** chưa tính raster hoá |
| Tô cả 62 vùng qua RLE vào `Uint32Array` | 3,6 ms. Vùng lớn nhất (2,03 triệu px) mất 1,8 ms |
| Số vùng | 62 vùng giữ lại, 25 mảnh vụn bị bỏ (< 168 px) |
| Bán kính nội tiếp nhỏ nhất | 6 px trang, khoảng 2 px CSS ở mức thu phóng 1. **Quá nhỏ cho mọi cấp**, validator phải bắt được |
| Mã hoá bản đồ nhãn | PNG 16-bit: 32,6 KB. **RLE nhị phân + gzip: 18,6 KB** |
| Lớp nét | SVG gốc 2,9 KB. PNG xám+alpha 140 KB. WebP lossless 63 KB |
| Khép khe hở bằng nong nét toàn cục | Nong 6 px: mây **vẫn rò**. Nong 16 px: mây kín nhưng **mất 6 vùng nhỏ** (tia nắng, mắt, bong bóng, lá) → **không dùng nong to**, phải nối đầu nét (mục 6.2) |
| Vùng "lát mỏng" | Dải 2–3 px giữa mái và thân nhà vẫn qua lọc diện tích → cần lọc thêm theo bán kính nội tiếp |

### 2.3 Spike nguồn SVG mở (ảnh [spike-openmoji.webp](coloring-studio/spike-openmoji.webp))

Chạy 16 hình OpenMoji 17.0.0 (bản `black` làm nét, bản `color` làm màu gợi ý), mỗi file 0,7–3,6 KB:

- Nét đẹp, đồng bộ, dễ thương. Màu gợi ý lấy tự động theo vùng **khớp đúng** với hình màu gốc.
- **Khoảng 1/2 không dùng thẳng được:** mèo, sư tử, kỳ lân, cáo, bạch tuộc, khủng long đều vẽ nét hở (OpenMoji dựa vào lớp màu bên dưới chứ không khép nét). Tách vùng chỉ ra 1–3 vùng và màu tràn ra nền.
- Hình dùng được cũng chỉ có 2–15 vùng, hợp Mầm non nhưng quá đơn giản từ lớp 1 trở lên.
- Giấy phép CC BY-SA 4.0: phải ghi công, và trang phái sinh cũng phải mang CC BY-SA.

### 2.4 Spike vector hoá

Dùng potrace (GPL-2.0, **chỉ chạy lúc build, không đóng gói vào app**). Ảnh nét 2048² của trang thử khoảng 60 vùng → SVG 50 KB (gzip 20,6 KB), mất 0,7 s. Hình rùa OpenMoji → 9,5 KB (gzip 4,4 KB).

## 3. Hướng sản phẩm

**Tên:** Xưởng Tô Màu. **Phụ đề:** *"Mỗi nét màu, một câu chuyện"*. **Nhãn thẻ sảnh:** SÁNG TẠO & MỸ THUẬT.

**Câu chuyện:** Bé là họa sĩ nhí của một xưởng vẽ trong vườn, có bạn Gấu (nhân vật của mục Màu Sắc Mầm non) cầm bảng màu đi cùng. Tô xong một bức thì bức tranh sống dậy và đi vào Thế Giới Sống.

**Thao tác trung tâm:** *chọn màu → chạm → màu loang ra kín vùng, không bao giờ lem*. Bé lớn hơn thì có thêm bút sáp, màu nước, kim tuyến, hoa văn, và tất cả vẫn không lem.

**Ba cấp tranh** (tự chọn theo lớp, bé đổi được):

| Cấp | Dành cho | Số vùng | Bán kính nội tiếp tối thiểu | Nét (px trang) | Một bức mất |
|---|---|---|---|---|---|
| **Mầm** | Mầm non | 6–25 | 20 px CSS ≈ 56 px trang | 16–20 | 3–6 phút |
| **Chồi** | Lớp 1–2 | 20–70 | 8 px CSS ≈ 22 px trang | 10–14 | 8–15 phút |
| **Họa sĩ** | Lớp 3–5 | 60–250 | 3 px CSS ≈ 8 px trang, phải phóng to tới 4× | 6–10 | 15–30 phút, tô tiếp được |

(1 px CSS ≈ 2,8 px trang khi trang 2048 hiển thị trong khung 730 px. Xem mục 7.1.)

## 4. Vòng chơi

### 4.1 Sảnh "Xưởng vẽ" (1180×820)

- **Trái (khoảng 55%):** xưởng vẽ có Gấu, giá vẽ hiện **bức đang tô dở** (ảnh thu nhỏ thật), nút lớn "Tô tiếp".
- **Phải:**
  - Thẻ **"Tranh hôm nay"**: mỗi ngày một trang theo cấp, có thưởng thêm.
  - Hàng nút: **Phòng tranh** (n bức), **Thế Giới Sống** (từ GĐ7), **Trò chơi màu** (từ GĐ5).
- **Dưới:** **Kệ sách tô**, mỗi cuốn có bìa và vòng tiến độ (đã tô x/12). Bấm vào là mở lưới trang. Trang chưa tô hiện nét, trang đã tô hiện ảnh của bé.

### 4.2 Màn tô (Studio)

```
┌────┬──────────────────────────────┬──────────────┐
│Công│                              │ Bảng màu 24  │
│ cụ │      TRANG 730×730           │ + da 6 tông  │
│ 88 │  (pinch/2 ngón để phóng to)  │ + màu tự pha │
│ px │                              │ Kiểu tô:     │
│    │                              │ đặc/chuyển/  │
│ ↶ ↷│                              │ hoa văn      │
└────┴──────────────────────────────┴──────────────┘
```

- **Công cụ:**
  - Xô màu (mặc định). Bút sáp. Bút dạ. Màu nước. Kim tuyến. Bút cầu vồng.
  - Tẩy. Kính lúp (phóng to vùng nhỏ). Đũa thần (gợi ý màu gốc của vùng).
  - Hoàn tác / Làm lại. Xoá hết (phải giữ 1 giây mới xoá).
- **Kiểu tô cho xô màu:**
  - Màu đặc.
  - Chuyển màu (2 màu, toả ra từ điểm chạm).
  - Hoa văn: chấm bi, sọc, caro, sao, tim, vảy cá, gạch, mây.
- **Phản hồi:**
  - Màu loang tròn từ điểm chạm trong 280 ms, có lấp lánh và tiếng "bóp" cao thấp theo sắc màu.
  - Khi đổi màu, đọc tên màu tiếng Việt và tiếng Anh (cách nhau ít nhất 1,5 s, không đọc mỗi lần chạm).
- **"Ngón tay thần kỳ"** (bật sẵn ở cấp Mầm): bé tô bút sáp phủ được ≥ 60% một vùng thì phần còn lại tự lấp đầy cùng màu và cùng chất liệu.
- **Tô xong (≥ 95% vùng):**
  - Bức tranh nảy nhẹ, pháo giấy, Gấu khen kèm số màu bé dùng ("Bé dùng 7 màu: đỏ, vàng…").
  - Nút "Xem lại cách bé tô" (tua nhanh), "Lưu vào Phòng tranh", "Đưa vào Thế Giới Sống" (nếu là hình con vật hoặc xe).

### 4.3 Các chế độ

| Chế độ | Cách chơi | Chấm | GĐ |
|---|---|---|---|
| **Tô tự do** | Như 4.2 | Hoàn thành ≥ 95% vùng | 2–3 |
| **Tô theo số** | Mỗi vùng có số, bảng màu đánh số. Tô đúng thì hiện màu gốc, sai thì rung nhẹ, không phạt. Vùng nhỏ chỉ hiện số khi phóng to | Số vùng đúng ngay lần đầu | 5 |
| **Toán tô màu** | Vùng ghi phép tính (`3+4`, `6×7`), bảng màu ghi đáp số. Phép tính sinh theo lớp bằng engine Ôn Luyện | Số phép đúng. Ghi vào thống kê kỹ năng | 5 |
| **Nghe và tô** | Gấu đọc "Tô mái nhà màu đỏ". Bé tô đúng vùng đúng màu | Số lệnh đúng. Thay hoạt động cũ của Mầm non | 5 |
| **Tranh điểm ảnh** | Lưới ô vuông tô theo số. Hình 16×16 đến 32×32 viết dạng chuỗi | Như Tô theo số | 5 |
| **Hoa văn vô tận** | Mandala, Kính màu (Voronoi), Gạch hoa (hoạ tiết gạch bông), sinh theo seed | Tự do | 6 |
| **Tô đối xứng** | Tô nửa trái, nửa phải tự tô theo kiểu gương. Biến thể khó: bé tự tô cho khớp | Biến thể khó: số vùng khớp | 6 |
| **Thế Giới Sống** | Bể cá, Vườn bướm, Phố xe, Bầu trời. Sinh vật bé tô cử động. Chạm vào thì sinh vật phản ứng và đọc tên kèm tên bé | Không chấm. Mở cảnh mới theo số sinh vật | 7 |
| **Vẽ rồi tô** | Bé tự vẽ nét dày và đóng dấu hình, rồi chuyển sang tô. Tách vùng ngay trên máy | Tự do | 8 |

### 4.4 Phần thưởng (D6). Số cụ thể đặt trong `rewards.ts` để chỉnh

- **Lần đầu tô xong một trang:** cấp Mầm 1★, Chồi 2★, Họa sĩ 3★, đi qua `processGameReward` nên có gacha như các game khác. Tô lại thì không có sao, nhưng vẫn lưu và vẫn tính vào huy hiệu.
- **Tranh hôm nay:** +1★.
- **Chế độ trò chơi:** huy chương theo tỉ lệ đúng (≥ 90% vàng, ≥ 60% bạc).
- **Huy hiệu:**
  - Họa sĩ cầu vồng: một bức dùng ≥ 12 màu.
  - Nhà hoa văn: dùng ≥ 5 hoa văn.
  - Kiên nhẫn: xong một bức ≥ 100 vùng.
  - Nhà sưu tầm: xong cả một cuốn.
  - Người gác bể: có 10 sinh vật trong Thế Giới Sống.
  - Tô theo số không sai.

## 5. Nội dung

### 5.1 Kệ sách v1: 8 cuốn × 12 trang = 96 trang tuyển chọn, thêm 4 bộ sinh tự động

| Cấp | Cuốn | Gợi ý trang |
|---|---|---|
| Mầm | Bạn thú cưng & nông trại | mèo, chó, gà con, vịt, lợn, bò, trâu, thỏ… |
| Mầm | Đại dương tí hon | cá, rùa, cua, sao biển, bạch tuộc, cá voi… (có loài đi được vào Bể cá) |
| Mầm | Xe cộ quanh em | ô tô, xe buýt, tàu hoả, máy bay, thuyền, xe cứu hoả… |
| Mầm | Quả ngon bánh ngọt | dưa hấu, chuối, xoài, bánh sinh nhật, kem, bánh chưng… |
| Chồi | Rừng xanh & khủng long | khủng long, voi, hổ, khỉ, chim, bướm… |
| Chồi | Tết & Trung Thu | cành đào, bánh chưng, múa lân, đèn ông sao, đèn cá chép, mâm ngũ quả, áo dài, nón lá… |
| Chồi | Vũ trụ diệu kỳ | tên lửa, phi hành gia, các hành tinh (nối sang Hệ Mặt Trời) |
| Họa sĩ | Việt Nam tươi đẹp | Chùa Một Cột, Khuê Văn Các, cầu Thê Húc, phố Hội An, vịnh Hạ Long, ruộng bậc thang |
| Sinh tự động | Mandala · Kính màu · Gạch hoa · Điểm ảnh | Không giới hạn số trang, theo seed, có 3 cấp |

**v2:** Tranh Đông Hồ với bảng màu truyền thống điệp, son, vàng hoè, chàm (phải kiểm giấy phép bản quét trước). Khoa học có nhãn cho Nghe và tô: tế bào, vòng đời bướm, vòng đời ếch, cây.

### 5.2 Quy chuẩn phong cách (D4, D5)

Viết thành `docs/coloring-studio/art-style.md` ở GĐ0. Mọi trang phải đạt:

- **Nét:** đen thuần, dày đều trong một trang, đúng dải của cấp (mục 3). Đầu nét tròn. **Mọi hình đều khép kín.**
- **Không có:** đổ bóng, gạch bóng, vùng xám, chữ, số, chữ ký, watermark, khung viền trang.
- **Bố cục:** vuông 1:1, nền trắng, chủ thể ở giữa, chừa lề 6%. Cấp Chồi và Họa sĩ có cảnh nền đơn giản.
- **Nhân vật:** tròn trịa, mắt to, vui vẻ. Không đáng sợ, không vũ khí. Người có nhiều màu da.

Khung prompt (tiếng Anh vì mô hình ảnh hiểu tốt hơn). Lưu vào `docs/coloring-studio/art-prompts.json` theo lối `preschool-thumbnails-prompts.json`:

```
Children's coloring page of {subject}. Cute friendly rounded cartoon style, clean bold black
outlines of uniform thickness, every shape fully closed, {tier detail}. Pure white background,
no shading, no hatching, no gray tones, no text, no letters, no numbers, no watermark, no border.
Square 1:1, subject centered with generous margin, crisp vector-like lines.
tier detail —
  Mầm:    "very thick lines, only 6 to 20 large simple shapes, no background"
  Chồi:   "thick lines, about 20 to 60 shapes, a simple background with a few elements"
  Họa sĩ: "medium lines, a detailed scene of about 80 to 200 shapes, decorative patterns"
```

**Màu gợi ý** (cho Đũa thần và Tô theo số):

1. Đưa ảnh nét cho mô hình ảnh với yêu cầu "tô màu phẳng, giữ nguyên nét".
2. Lấy màu xuất hiện nhiều nhất bên trong mỗi vùng đã co 3 px. Cách này chịu được việc mô hình xê dịch nét một chút.
3. Lượng tử về bảng 24 màu theo ΔE2000.
4. Vùng nào lấy màu không chắc thì sửa tay trong công cụ biên soạn (mục 8).

### 5.3 Quy trình sản xuất (script `scripts/coloring-build.mjs`)

```
nguồn (PNG từ AI | SVG mở)
 → chuẩn hoá: 2048², xám, ngưỡng 160, bỏ mảnh vụn
 → nối đầu nét: khe ≤ 24 px (mục 6.2)
 → potrace → line.svg
 → tách vùng (nong 3 px) → bỏ vụn < 168 px hoặc bán kính nội tiếp < 4 px → lan nhãn xuống dưới nét
 → thống kê: diện tích, bán kính nội tiếp, điểm đặt số = điểm xa nét nhất, khung bao, láng giềng
 → màu gợi ý (5.2) → validator (5.4)
 → ghi public/coloring/pages/<book>/<page>.{svg, bin, json} + thumbs/<page>.webp
 → bảng xem trước scripts/coloring/contact-<book>.png (vùng tô màu giả, vùng lỗi viền đỏ) để người duyệt
```

Ước lượng công: tỉ lệ chấp nhận khoảng 1/3, nên 96 trang cần khoảng 300 lần sinh ảnh. Duyệt khoảng 1 phút/trang.

### 5.4 Validator (chạy trong `coloring-build --check` và `content.test.ts`)

- Số vùng nằm trong dải của cấp. Mọi vùng không phải nền có bán kính nội tiếp ≥ ngưỡng của cấp.
- Độ dày nét (gấp đôi khoảng cách lớn nhất trên khung xương nét) nằm trong dải của cấp.
- **Nghi rò:** vùng không phải nền mà chạm mép trang, hoặc chiếm > 35% trang → báo lỗi và tô viền đỏ trên bảng xem trước.
- Điểm ảnh xám (luma 60–200, không thuộc viền khử răng cưa của nét) > 1,5% → báo "có tô bóng".
- Mỗi vùng có màu gợi ý. Trang nào dùng cho Nghe và tô thì các vùng được nhắc tới phải có tên.
- Dung lượng: `svg` ≤ 80 KB gzip, `bin` ≤ 40 KB, `json` ≤ 12 KB.
- Có mục ghi công (nguồn, tác giả, giấy phép) trong `credits.json`.

## 6. Kỹ thuật

### 6.1 Định dạng trang

- `<page>.svg`: lớp nét, dạng path tô đen do potrace sinh.
- `<page>.bin`: bản đồ nhãn. **RLE nhị phân + gzip**, giải nén bằng `DecompressionStream('gzip')`. Bố cục: header `{magic 'RGN1', w, h, n}`, sau đó từng dòng là chuỗi cặp `(nhãn u16, độ dài u16)`.
  - Lấy bin thay vì PNG để tránh việc trình duyệt chỉnh màu hoặc nhân trước alpha làm sai giá trị nhãn khi `getImageData`.
  - Đuôi `.bin` đã có sẵn trong `globPatterns` nên đi được vào bộ offline.
- `<page>.json`:
  ```
  {
    id, rev, tier, book,
    regions: [{ id, area, inr, anchor: [x, y], bbox, color, name?, decor?, bg? }],
    animate?: { kind: 'swim' | 'fly' | 'walk' | 'drive' | 'float', axis, hinge? },
    credits
  }
  ```

### 6.2 Khép khe hở: nối đầu nét, không nong to

Spike cho thấy nong toàn cục 16 px nuốt 6 vùng nhỏ (mục 2.2). Cách làm:

1. Làm mảnh mặt nạ nét thành khung xương 1 px (Zhang–Suen).
2. Tìm các điểm đầu mút (pixel chỉ có 1 láng giềng).
3. Với mỗi đầu mút, tìm điểm nét gần nhất trong hình nón ±35° theo hướng kéo dài của nét, xa không quá 24 px, và không thuộc chính nhánh đó trong vòng 30 px.
4. Vẽ đoạn nối dày bằng nét.

Sau đó vẫn nong 3 px để bịt lỗ khử răng cưa. Mọi đoạn nối được tô xanh trên bảng xem trước để người duyệt.

### 6.3 Lớp vẽ trong màn tô

```
giấy (CSS, texture nhẹ)
  → paint canvas 2048² (màu, bút)
  → fx canvas (loang, lấp lánh kim tuyến)
  → line SVG (mix-blend multiply)
  → UI overlay (số vùng, viền gợi ý)
```

- Thu phóng và kéo bằng transform CSS trên cả chồng lớp, dùng `react-zoom-pan-pinch` có sẵn, tối đa 4×.
- Bản đồ nhãn giữ trong RAM dạng `Uint16Array(2048²)` để tra cứu O(1) khi chạm, kèm chỉ mục runs theo vùng để tô.
- **Xô màu:** ghi runs của vùng vào `ImageData`, rồi `putImageData` đúng khung bao. Hiệu ứng loang vẽ trên fx canvas bằng mặt nạ vùng ∩ hình tròn r(t), xong mới ghi hẳn xuống.
- **Bút cắt theo vùng:** nét vẽ vào canvas tạm cỡ khung bao, `destination-in` với mặt nạ vùng, rồi ghép xuống paint. Giữ LRU 3 mặt nạ vùng.
- **Chạm, kéo và chống tì tay:**
  - Ngón đầu tiên vẽ. Ngón thứ hai chạm xuống thì huỷ nét đang vẽ và chuyển sang pinch.
  - Bật `touch-action: none`.
  - Ở chế độ xô màu: di chuyển < 10 px CSS và giữ < 400 ms thì tính là chạm.
- **Kim tuyến:** mỗi vùng kim tuyến giữ 40 điểm lấy ngẫu nhiên từ runs của vùng và vẽ sao nhấp nháy trên fx canvas. Dừng khi tab bị ẩn.
- **Hoa văn:** dùng `createPattern` từ ô 64–128 px trang, cũng cắt bằng mặt nạ vùng.

### 6.4 Nhật ký thao tác, hoàn tác, lưu

- Thao tác có ba loại:
  ```
  { t: 'fill',   r, style }
  { t: 'stroke', r, brush, color, size, seed, pts: Int16Array }
  { t: 'erase',  r, ... }
  ```
- **Mọi thao tác chỉ thuộc về 1 vùng (D2)**, nên hình dạng của vùng r chỉ phụ thuộc vào các thao tác trên r.
  - Hoàn tác = bỏ thao tác cuối → xoá vùng r → phát lại các thao tác của r.
  - Chi phí chỉ tỉ lệ với số thao tác của vùng đó, không phải cả bức.
- **Bút sáp và màu nước dùng nhiễu theo seed** nên phát lại cho ra đúng hình cũ. Nhờ đó có "Xem lại cách bé tô".
- **Lưu tự động:** 1,5 s sau thao tác cuối, và khi có `visibilitychange` hoặc `pagehide`. Lưu nhật ký thao tác + ảnh paint WebP (để mở lại nhanh) + ảnh thu nhỏ 320 px.

### 6.5 Thế Giới Sống (GĐ7)

- **Ảnh của sinh vật:** ghép paint + nét, cắt theo hình bóng. Hình bóng là hợp của mọi vùng không phải nền, lấy từ bản đồ nhãn.
- **Dựng cảnh:** một canvas R3F. Mỗi sinh vật là một mặt phẳng có vertex shader:
  - **bơi:** sóng sin, biên độ tăng dần về phía đuôi;
  - **bay:** gập cánh quanh trục thân (`hinge`);
  - **đi:** nảy theo bước;
  - **xe:** lắc nhẹ và bánh xe quay.
- **Giới hạn:** mỗi cảnh tối đa 24 sinh vật, texture 512². Tạm dừng vòng vẽ khi `document.hidden`.

## 7. Tính toán

### 7.1 Hình học màn hình

**Tablet ngang 1180×820:**
- Header `HubShell` khoảng 64 px, lề 2×12, nên trang cao khoảng 730 px.
- Bề ngang: công cụ 88 + trang 730 + bảng màu 300 + lề 3×12 = 1154 ≤ 1180 ✓.
- 1 px CSS = 2048/730 ≈ **2,8 px trang**.
- Ở DPR 2, trang chiếm 1460 px thiết bị < 2048, nên màu vẫn sắc tới thu phóng 1,4×. Từ đó trở lên, mép màu mềm đi nhưng nằm dưới nét SVG nên không thấy.

**Tablet dọc 820×1180:** trang 788 px, bảng màu 2 hàng ở dưới, công cụ thành một hàng ở trên.

**Điện thoại 390×844:** trang 358 px (1 px CSS ≈ 5,7 px trang). Cấp Họa sĩ bắt buộc phải phóng to.

**Mục tiêu chạm:** ≥ 44 px CSS (HIG) cho nút. Vùng cấp Mầm có đường kính nội tiếp ≥ 40 px CSS nên không cần phóng to. Chạm trúng nét thì lấy vùng gần nhất, vì nhãn đã lan xuống dưới nét.

### 7.2 Hiệu năng (đo trên máy dev, tablet tầm trung giả định chậm hơn 4 lần)

| Việc | Máy dev | Ước tablet | Ngân sách |
|---|---|---|---|
| Giải nén `.bin` + dựng chỉ mục runs | chưa đo (gzip 18,6 KB) | ≤ 30 ms | mở trang ≤ 600 ms |
| Tô một vùng vào bộ đệm | ≤ 1,8 ms | ≤ 8 ms | chạm → thấy màu ≤ 100 ms |
| Tách vùng tại chỗ (Vẽ rồi tô) ở 2048² | 150 ms | 600 ms (worker) | ≤ 1 s, chạy trong worker |
| Vector hoá potrace (chỉ lúc build) | 0,4–0,7 s/trang | — | — |

`putImageData`, cắt nét theo vùng và ghép lớp **chưa đo trong trình duyệt** (trang đo [bench.html](coloring-studio/spike/bench.html) không chạy được trong khung xem file local). GĐ2 phải đo bằng `performance.now` ở 1180×820.

### 7.3 Bộ nhớ (một trang đang mở)

| Thành phần | Dung lượng |
|---|---|
| Nhãn `Uint16Array` | 8 MB |
| Paint RGBA 2048² | 16 MB |
| fx canvas | 16 MB |
| ≤ 3 mặt nạ vùng | ≤ 3 × 16 MB, thường nhỏ hơn nhiều |
| Ảnh chụp để hoàn tác | **không có** (dùng phát lại theo vùng) |
| **Tổng** | khoảng 50–90 MB |

iOS Safari giới hạn tổng bộ nhớ canvas, nên phải giải phóng canvas khi rời trang (mục 11).

### 7.4 Dung lượng

**Mỗi trang:**

| Thành phần | Dung lượng |
|---|---|
| `svg` | khoảng 20 KB gzip, 50 KB thô, ước theo trang 60 vùng |
| `bin` | khoảng 19 KB |
| `json` | khoảng 4 KB |
| Ảnh thu nhỏ | khoảng 10 KB |
| **Tổng** | khoảng **55–80 KB** (cấp Họa sĩ lên tới khoảng 150 KB) |

**Cả kho:** 96 trang ≈ 6–8 MB, tức bộ offline tăng khoảng 10% so với 74 MB hiện nay. Trang chỉ tải khi mở.

**Mỗi tranh của bé:**

| Thành phần | Dung lượng |
|---|---|
| Nhật ký thao tác (200 lần tô, 50 nét × 120 điểm × 4 B) | khoảng 25 KB |
| Ảnh paint WebP | khoảng 60–150 KB |
| Ảnh thu nhỏ | khoảng 12 KB |

300 tranh mỗi bé ≈ 30–50 MB IndexedDB. Đặt trần 300 tranh. Khi chạm trần, hỏi bé có muốn bỏ ảnh paint của các tranh cũ không; nhật ký thao tác vẫn giữ nên vẫn dựng lại được tranh.

**Hồ sơ:** `profile.coloring` khoảng 3 KB với 200 trang.

## 8. Kiến trúc đích

```
src/coloring/
  content/   catalog.ts (sách, cấp), credits, loader (fetch + giải nén .bin)
  engine/    regionMap.ts (giải RLE, tra nhãn, runs theo vùng) · ops.ts (nhật ký, áp dụng, hoàn tác theo vùng)
             completion.ts · palette.ts (24 màu + da + ΔE) · byNumber.ts · mathColoring.ts (dùng services/study)
             generators/{mandala,stainedGlass,tiles,pixel,symmetry}.ts · labeling.ts (tách vùng tại chỗ)
  render/    CanvasStack.tsx · brushes/{crayon,marker,watercolor,glitter,rainbow}.ts · patterns.ts · fx.ts · export.ts
  progress/  model.ts · progress.ts (persistColoring) · artworkRepo.ts (IndexedDB 'coloring-studio')
  ui/        ColoringPage.tsx (route) · Lobby · BookShelf · Studio · Palette · Toolbar · Gallery · Replay
             modes/{ByNumber,MathColor,ListenColor,Pixel}.tsx · living/ (GĐ7) · __author/ (công cụ biên soạn, chỉ DEV)
  workers/   label.worker.ts
scripts/coloring-build.mjs · scripts/coloring/ (nguồn, cache, bảng xem trước)
public/coloring/{pages,thumbs,books}/
```

- **Engine thuần**, test bằng vitest trong Node (như Đố Vui và Rồng Thần). React chỉ ở `render/` và `ui/`.
- **Công cụ biên soạn** `/coloring/__author` (chỉ chạy ở DEV): xem vùng, đặt tên vùng cho Nghe và tô, sửa màu gợi ý, đánh dấu vùng trang trí hoặc nền, khai báo `animate`. Kết quả xuất ra JSON để chép vào nguồn.
- **Sảnh chính:** thêm `'coloring'` vào `ModeId`, `modes` và `preschoolModes`, cập nhật `catalog.test.ts`. Ảnh thẻ `hub/art/coloring.webp` sinh theo phong cách đất nặn của sảnh.
- **Lưu hồ sơ:** `StudentProfile.coloring?: ColoringProgress`. Ghi bằng `persistColoring(profiles, owner, action, write)`, một lần ghi duy nhất.

## 9. Thứ tự thi công

| GĐ | Nội dung | Nghiệm thu | Cỡ |
|---|---|---|---|
| **0** | **Duyệt phong cách:** viết `art-style.md` và `art-prompts.json`, sinh 12 trang mẫu (3 cấp × 4 chủ đề), chạy qua spike, làm bảng xem trước. **Chủ dự án duyệt.** | Bảng xem trước có 12 trang đạt validator. Chủ dự án chốt phong cách | S |
| 1 | `scripts/coloring-build.mjs` (chuẩn hoá, nối đầu nét, potrace, tách vùng, màu gợi ý, validator, bảng xem trước). `engine/regionMap` + `ops` + `completion` kèm test | `node scripts/coloring-build.mjs --check` xanh. `npx vitest run src/coloring` xanh | M |
| 2 | Studio cốt lõi: chồng lớp, xô màu loang, bảng 24 màu đọc tên, hoàn tác/làm lại, thu phóng, chọn vùng gần nhất khi chạm nét, lưu tự động IndexedDB, Phòng tranh tối giản. Route `/coloring`, thẻ ở sảnh | Đo ở 1180×820: chạm → màu ≤ 100 ms, mở trang ≤ 600 ms. Chụp màn hình ở 3 kích thước. Không vùng nào rò | L |
| 3 | Bút sáp, bút dạ, màu nước, kim tuyến, cầu vồng (cắt theo vùng), tô chuyển màu, hoa văn, tẩy, Ngón tay thần kỳ, đũa thần | Test phát lại cho ra đúng từng pixel (theo seed). Pinch giữa chừng không để lại vết | M |
| 4 | Sảnh Xưởng vẽ, Kệ sách, Tranh hôm nay, phần thưởng và huy hiệu, `profile.coloring`, **96 trang nội dung v1**, thay hoạt động tô màu Mầm non | `catalog.test.ts` và `progress.test.ts` xanh. `npm run build` xanh. Duyệt cả 8 bảng xem trước | L |
| 5 | Tô theo số, Toán tô màu, Nghe và tô (công cụ biên soạn đặt tên vùng), Tranh điểm ảnh | Test sinh phép tính đúng lớp. Mỗi trang Nghe và tô có ≥ 4 vùng có tên | M |
| 6 | Bộ sinh Mandala, Kính màu, Gạch hoa, Đối xứng (seed, 3 cấp) | Cùng seed ra cùng trang. 1000 seed liên tiếp đều qua validator | M |
| 7 | Thế Giới Sống: 4 cảnh, khai báo `animate` cho khoảng 30 trang con vật/xe | 24 sinh vật đạt ≥ 50 fps trên máy dev. Không mất WebGL context khi đổi tab | L |
| 8 | Xem lại quá trình tô, xuất PNG và chia sẻ (Web Share), in trang nét, Vẽ rồi tô (worker tách vùng) | Tách vùng tại chỗ ≤ 1 s ở 2048². In ra A4 rõ nét | M |

**v1 phát hành sau GĐ4.** Sau đó GĐ5–6 thành v1.5, GĐ7–8 thành v2. AI vẽ theo lời bé (Gemini image) để ngoài phạm vi. Muốn làm thì phải tách resolver mô hình ảnh khỏi `geminiClient` (hiện chỉ xếp hạng mô hình văn bản), có công tắc cho phụ huynh, và sinh thất bại thì sinh lại tối đa 2 lần.

## 10. Giao diện và khả năng tiếp cận

- Nút công cụ ≥ 56 px. Ô màu ≥ 48 px. Màu đang chọn có viền dày và hiện to ở góc trang.
- Mọi nút có `aria-label` tiếng Việt. Bé chưa biết chữ vẫn chơi được nhờ biểu tượng và giọng đọc.
- `prefers-reduced-motion`: tắt nảy và pháo giấy. Màu vẫn loang nhưng nhanh hơn (120 ms).
- Có 6 tông màu da. Tên màu đọc cả tiếng Việt và tiếng Anh (khớp với mục Màu Sắc Mầm non).
- Không có đếm giờ, không có phạt, không có quảng cáo hay link ra ngoài.

## 11. Bẫy

- **iOS Safari giới hạn tổng bộ nhớ canvas.** Khi rời trang phải đặt `width = height = 0` cho mọi canvas. Không giữ quá 6 canvas lớn.
- **Không lưu nhãn dạng PNG rồi đọc bằng `getImageData`.** Quản lý màu hoặc nhân trước alpha có thể làm lệch giá trị nhãn. Dùng `.bin`.
- **Đuôi file:** `.rgn` không có trong `globPatterns` nên không vào bộ offline. Dùng `.bin`, hoặc thêm đuôi vào [vite.config.ts](../vite.config.ts).
- **Nong nét to để khép khe là nuốt vùng nhỏ** (spike 2.2). Nối đầu nét, rồi để người duyệt.
- **Lọc theo diện tích không bắt được lát mỏng.** Phải lọc thêm theo bán kính nội tiếp.
- **Ngón thứ hai chạm xuống giữa nét vẽ là đang pinch.** Huỷ nét, đừng để lại vết.
- **Đọc tên màu mỗi lần chạm thì thành spam.** Chỉ đọc khi đổi màu, cách nhau ≥ 1,5 s, `cancelSpeech` trước khi đọc.
- **CSS của sảnh:** `.discovery-hub button { font: inherit }` trong `hub.css` xoá cỡ và độ đậm chữ của nút. Viết bộ chọn có phạm vi `.cs-root .cs-btn`.
- **`Grade.Preschool = 0` là falsy.** Dùng `isPreschool`.
- **Đi thẳng URL `/coloring` có thể mất học sinh đang chọn.** Kiểm như Đố Vui.
- **Thế Giới Sống:**
  - Tab cũ có thể mất WebGL context (bẫy Xưởng Hành Tinh).
  - Đo fps khi trang bị ẩn sẽ ra số sai (bẫy Tế Bào).
  - Phải dừng `useFrame` khi `document.hidden`.
- **Giấy phép:**
  - Tranh OpenMoji là CC BY-SA nên trang phái sinh cũng CC BY-SA, ghi công trong `credits.json` và có trang Ghi công.
  - potrace là GPL: chỉ để trong script build, không bao giờ import vào `src/`.
  - Tranh AI: lưu prompt và nguồn sinh vào `art-prompts.json`.
- **Tranh AI hay có lỗi:** chữ hoặc chữ ký lạc vào, vùng xám, gạch bóng, nét đứt. Validator bắt vùng xám và nghi rò. Người duyệt bắt chữ.

## 12. Script đo (để kiểm lại số ở mục 2)

```bash
node docs/coloring-studio/spike/regions.mjs docs/coloring-studio/spike/scene.svg 2048 6
```

- Dùng `MININR=4` để lọc thêm theo bán kính nội tiếp.
- Đổi tham số cuối thành 16 để thấy nong toàn cục nuốt vùng nhỏ.
- `sheet.mjs <thư mục có black/ và color/> <out.png>` dựng bảng xem trước OpenMoji.
- `vectorize.cjs <file>` đo potrace. Cần cài `potrace` riêng, không đưa vào `package.json` của app.

## 13. Tiêu chí nghiệm thu cuối (v1, sau GĐ4)

1. 96 trang đạt validator. Chủ dự án đã duyệt cả 8 bảng xem trước.
2. Không thể làm màu ra ngoài vùng bằng bất kỳ công cụ nào. Có test kéo nét ngẫu nhiên 10 000 lần, đếm pixel ngoài vùng phải bằng 0.
3. Ở 1180×820: chạm → thấy màu ≤ 100 ms, mở trang ≤ 600 ms. Chạy được ở 820×1180 và 390×844.
4. Thoát giữa chừng rồi vào lại thì tranh còn nguyên. Hoàn tác và làm lại 50 bước đều đúng.
5. Sao chỉ cộng một lần cho mỗi trang. Có test hai lần hoàn tất liên tiếp trước khi render không mất sao (bài học `persistRiddle`).
6. `npx vitest run` và `npm run build` xanh.

## 14. Nhật ký lệch plan

### 14.1 Phạm vi đã triển khai ngày 14/10/2026

Chủ dự án duyệt mẫu cá ImageGen, cho phép giữ chấm/vùng nhỏ và yêu cầu triển khai với ít nhất 40 mẫu. Đợt này có **40 tranh khác nhau, 8 cuốn × 5 trang**, không phải đổi tên hay đổi màu cùng một hình. Mốc 96 trang ở kế hoạch gốc chưa được sản xuất đủ.

| Cuốn | Năm trang |
|---|---|
| Đại dương | Cá, rùa, bạch tuộc, cá voi, cá ngựa |
| Khu vườn | Bướm, ong, bọ rùa, ốc sên, hoa |
| Thú cưng | Mèo, chó, thỏ, hamster, chim |
| Hoang dã | Sư tử, voi, hươu cao cổ, gấu trúc, khủng long |
| Chuyến đi | Tàu hoả, tên lửa, xe buýt, thuyền buồm, khinh khí cầu |
| Cổ tích | Lâu đài, kỳ lân, rồng, nhà nấm, robot |
| Việt Nam | Sen, đèn lồng, trâu, Tết, làng quê |
| Niềm vui | Bánh kem, kem, trái cây, picnic, đồ chơi |

- Module riêng trong sảnh mọi lớp; lối vào Màu Sắc Mầm non chuyển sang Nghe và tô.
- 30 màu gồm 24 màu chính + 6 màu da; đọc Việt/Anh, màu tự pha. Đổ màu loang 280 ms, chuyển hai màu tại điểm chạm, 8 hoa văn, 5 chất liệu bút + tẩy, trợ giúp tô kín, gợi ý màu.
- Khóa mỗi nét vào vùng bắt đầu, chọn vùng gần nét đen, thu phóng/kéo, hoàn tác/làm lại tối đa 50 mốc trong phiên, giữ 1 giây để xoá rồi vẫn hoàn tác được.
- Lưu nhật ký trước ảnh thu nhỏ vào IndexedDB, theo học sinh; phát hiện tab ghi đè bản cũ. Tô tiếp, phòng tranh, xem lại, xuất PNG 2048²/SVG, Web Share và in A4.
- Tô tự do, theo số, toán theo lớp, nghe và tô; đã đặt tên 4 vùng lớn mỗi tranh, tổng 160 tên. Bài toán ghi tiến bộ vào Study và lịch sử chơi. Sao hoàn thành tranh chỉ trao khi đủ 95%; một bài Nghe và tô ngắn không được tính thành cả bức tranh.
- Tranh hôm nay theo ngày địa phương, sao/huy hiệu, 5 bộ sinh có seed và 3 cấp: mandala, kính màu Voronoi, gạch hoa, điểm ảnh, đối xứng.
- Vẽ rồi tô: nét bút và dấu hình, worker tách vùng kín; cảnh Thế Giới Sống gồm biển/vườn/trời/đồng cỏ, dùng 4 nền ImageGen, tối đa 24 tác phẩm mỗi cảnh, tạm dừng khi ẩn trang/giảm chuyển động.
- Công cụ biên soạn vùng trong mục DEV của Studio: tên, vùng nền, chi tiết nhỏ, nghe và tô, màu gợi ý, xuất JSON.

### 14.2 Quyết định khác thiết kế ban đầu

1. **Không sửa nét tranh hay xoá chấm nhỏ.** Nhị phân hoá ở 2048², giữ toàn bộ thành phần trắng, truy vết đường biên pixel thành SVG. Vùng diện tích <16 pixel được giữ nhưng không bắt buộc để hoàn thành. Không chạy nong nét/khép khe/potrace. Nét hở vốn có sẽ thành một vùng chung và cần kiểm duyệt nội dung, thuật toán không tự hiểu bộ phận con vật.
2. **Renderer SVG clipPath**, cùng đường biên với bản đồ nhãn Uint16, thay cho Canvas tô trực tiếp. Mỗi vùng độc lập có ID, đường path và clip. Canvas chỉ dùng lúc sinh bản đồ từ hình học, vẽ nguồn, xuất PNG. SVG truy vết có thể thấy bậc pixel khi phóng cực lớn.
3. Runtime dùng `<id>.page.bin` (JSON đường nét + vùng nén gzip), `<id>.bin` (bản đồ nhãn RLE/gzip), thumbnail WebP. Kho 40 tranh khoảng 5,3 MB trước 4 nền cảnh, thay vì khoảng 69 MB JSON/SVG không nén. Ảnh nguồn và prompt nằm ngoài public, không bị đưa vào gói offline.
4. Cấp tranh ảnh hiện phân theo số vùng cần tô: ≤60 Mầm, ≤120 Chồi, còn lại Họa sĩ. Đây **không phải** validator bán kính chạm tối thiểu của thiết kế gốc; một số vùng nhỏ cần phóng to. Các bộ sinh vẫn có 3 cấp rõ ràng.
5. Màu gợi ý được gán xác định theo ID, có thể chỉnh bằng trình biên soạn; chưa phải màu lấy từ ảnh tham chiếu AI. Phần toán dùng bộ sinh đáp án 1–8 để khớp bảng màu, dùng skill/progress chung của Study nhưng không gọi nguyên bộ sinh câu hỏi Study.
6. Hoàn thành khi tô bằng bút được ước lượng qua lưới điểm mẫu theo vùng; không đo phủ từng pixel mỗi khung hình. Nhật ký và kết quả phát lại vẫn lưu chính xác theo seed.
7. Thế Giới Sống dùng ảnh trong suốt chuyển động CSS 2D nguyên tác phẩm. **Chưa có lưới biến dạng đuôi/vây, R3F, hoặc chuyển động riêng từng bộ phận** như mục 6.5. Các cảnh hiện mở sẵn; chưa có tiến trình mở khoá cảnh hoặc huy hiệu đếm 10 sinh vật.
8. Tác phẩm chỉ lưu trên thiết bị, tối đa 300 tranh/học sinh; hồ sơ đồng bộ chỉ giữ tiến độ và phần thưởng. Chưa có đồng bộ file tranh lên đám mây. Xung đột tab giữ dữ liệu hiện tại và hướng dẫn xuất ảnh, không tự ghi đè.
9. Sau tải lại, hoàn tác lùi theo thao tác đã lưu; các nhóm thao tác đối xứng của phiên trước không còn gộp thành một bước. Mốc undo nhóm 50 bước chỉ giữ trong phiên.
10. GĐ0 đi tiếp theo việc chủ dự án duyệt mẫu cá và yêu cầu sản xuất, không có lần duyệt riêng 12 trang. Đã xem cả 8 bảng contact sheet bằng hình; không gọi đó là chủ dự án đã duyệt cả 40 tranh.

### 14.3 Tệp và cách bảo trì

- `src/coloring/`: mô hình, engine, renderer, worker, persistence, UI và tests.
- `scripts/coloring/catalog.json`: danh mục 40 trang; `sources/`: 40 nguồn + bìa + 4 nền cảnh; `prompts.json` và `scene-prompts.json`: nguồn/prompt ImageGen.
- `scripts/coloring/region-names.json`: tên vùng nghe và tô; `contact-*.png`: 8 bảng duyệt; `build-report.json`, `verification.json`: kết quả kiểm tra.
- `scripts/coloring/pages/`: JSON/SVG trung gian tự sinh, đã bỏ qua Git; xoá bộ cache này không ảnh hưởng runtime đã đóng gói.
- `public/coloring/`: chỉ asset cần chạy. Nút Xuất SVG cung cấp tài liệu SVG có vùng tô độc lập; SVG trung gian từ pipeline chỉ là lớp nét.
- `coloring-preview.html`: bản xem thử ở Vite dev, dùng đúng HubShell, hồ sơ thử riêng `coloring-preview`; không trao sao vào hồ sơ thật. Ứng dụng chính đi qua `/coloring` và StudentContext.

```bash
node scripts/coloring-build.mjs
node scripts/coloring-build.mjs --check
node scripts/coloring/contact-sheets.mjs
node scripts/coloring/verify.mjs
node node_modules/vitest/vitest.mjs run src/coloring src/components/hub/catalog.test.ts --maxWorkers=2
node node_modules/vite/bin/vite.js build
```

Máy hiện tại có npm/npx global lỗi đường dẫn CLI; gọi entry Node trực tiếp như trên. Không chạy build nặng song song full suite trên máy đang bận vì các test thời gian của game khác dễ timeout.

### 14.4 Kiểm chứng và phần chưa đo

- 40 nguồn riêng biệt; mỗi trang có ít nhất 4 vùng nghe được đặt tên. Đối chiếu SVG với bản đồ nhãn trên **167.772.160 pixel: 0 sai lệch**.
- Test 10.000 nét ngẫu nhiên trên 40 trang, 6 công cụ, ảnh kiểm tra 512²: **0 pixel màu thoát clip vùng**. Phát lại cùng seed trùng byte ảnh kiểm tra.
- 1.000 seed cho mỗi bộ sinh/cấp được kiểm tra đường kín, tọa độ hữu hạn, vùng/neo hợp lệ, khả năng lặp lại và đối xứng.
- Worker core tách vùng và truy vết hai hình kín ở 2048²: **641 ms** trên máy dev (không gồm thời gian người vẽ hay truyền dữ liệu worker). Không suy ra mọi nét vẽ phức tạp đều dưới 1 giây.
- Browser đã kiểm tra: đổ/chuyển màu, kéo nét qua biên vẫn bị cắt, nghe sai/đúng màu, undo/redo, giữ xoá rồi khôi phục, lưu/rời/mở lại trùng nét, tự vẽ và đưa vào cảnh; layout ở 1180×820, 820×1180, 390×844. Không ghi dữ liệu học sinh thật.
- Build production thành công. Toàn suite trước lần sửa cuối: **116 file / 2.373 tests đạt**. Lần chạy toàn suite đồng thời build bị timeout ở test game MathRacing/CoVua, đã dừng; không coi lần đó là đạt. Kết quả kiểm tra cuối của module được ghi thêm bên dưới.
- Typecheck toàn repo còn lỗi có sẵn tại `modules/farm/src/ui/renderSnapshot.ts:26` (`object[]` không khớp `Obstacle[]`), ngoài module này.
- Chưa đo đủ chỉ tiêu ≤100 ms phản hồi, ≤600 ms mở trang, ≥50 fps với 24 tác phẩm trên tablet thật. Chưa xác nhận đa chạm trên thiết bị thật, Web Share sang ứng dụng ngoài hay in giấy vật lý. Công cụ chờ download trong trình duyệt nhúng bị treo; không tuyên bố đã nghiệm thu việc nhận file PNG qua công cụ đó.
- Kiểm tra cuối sau sửa thưởng/chuyển màu: **30 tests / 5 files đạt**, gồm toàn `src/coloring` và hub catalog; production build đạt; validator đủ 40 trang; `git diff --check` không báo lỗi khoảng trắng. Typecheck chỉ còn lỗi farm nêu trên. Tổng `public/coloring`: **126 files / 5.783.484 bytes**.
- Ảnh kiểm tra giao diện: [sảnh](coloring-studio/lobby.jpg), [điện thoại sau hoàn thiện](coloring-studio/phone-final.jpg), [tablet dọc](coloring-studio/tablet-portrait.png). Màn điện thoại có clientWidth = scrollWidth = 375 px (viewport đặt 390×844, có thanh cuộn).

- Kiểm tra trước push sau hợp nhất cập nhật Học bài/tài khoản từ origin/main: **54 tests / 7 files đạt**, bao gồm coloring, hub catalog, account và lesson progress. Tích hợp lưu phần thưởng chuyển sang saveProfilesStrict để phản ánh đúng lỗi ghi hồ sơ.
