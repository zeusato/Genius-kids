# Cờ Ca-rô — prompt và tài nguyên mỹ thuật

Ngày: 17/09/2026. Công cụ: **imagegen built-in** theo skill imagegen; tạo mới hai ảnh, không dùng CLI/API riêng. Hai ảnh đã được tích hợp vào game theo [kế hoạch](../caro-implementation-plan.md).

## 1. Bìa — cover-v1

- Bản gốc: [cover-v1.png](art/cover-v1.png).
- Bản tối ưu: [cover-v1.webp](art/cover-v1.webp).
- Dùng ở card Board games và màn chuẩn bị ván. Giữ toàn bộ tờ giấy trong khung; dùng vùng ảnh riêng tỷ lệ 3:2 và `object-fit: contain`, không đặt khối chữ lên ảnh.
- Kiểm tra trực quan: có cảm giác giấy/gỗ mờ, X/O dễ nhận, toàn bộ tờ giấy còn trong khung; không có chữ giả, logo hoặc lớp UI. Lưới minh họa không phải lưới 15×15 chính xác và vị trí quân không dùng làm một fixture ván chơi. Bàn thật dựng bằng SVG/HTML.

Prompt nguyên văn:

```text
Use case: illustration-story
Asset type: cover artwork for a Vietnamese children's five-in-a-row board game, landscape 1536x1024.
Primary request: a beautiful handcrafted illustration of a paper caro game on a quiet garden table, warm, inviting, carefully composed, appropriate for children aged 6 to 12.
Subject: an open square sheet of softly textured ivory graph paper, many small square cells (a five-in-a-row game, NOT a 3 by 3 tic-tac-toe board), a sparse unfinished arrangement of hand-drawn terracotta X marks and dark teal O marks. The full paper and its corners must be visible with generous breathing room.
Style/medium: refined children's picture-book gouache and colored pencil, matte natural materials, delicate visible paper grain, soft botanical details at the outer margins, gentle daylight, restrained warm cream, muted sage, terracotta and deep teal.
Composition/framing: landscape, nearly overhead with just a little illustrative perspective, the square game paper is the principal subject centered, no foreground object overlaps the game sheet. Keep every important subject in the inner 80 percent. A small pair of colored pencils beside the paper suggests creative play.
Constraints: illustration only, no UI, no lettering, no title, no numbers, no logos, no watermark, no characters or hands. The paper should feel generous and playable, marks readable, restrained decoration.
Avoid: glossy plastic, shiny 3D, neon, gradients pretending to be plastic, fake app screenshot, clutter, excessive ornaments, cropped paper, photorealism.
```

## 2. Nền — backdrop-v1

- Bản gốc: [backdrop-v1.png](art/backdrop-v1.png).
- Bản tối ưu: [backdrop-v1.webp](art/backdrop-v1.webp).
- Dùng ngoài mặt bàn, có nền CSS kem dự phòng. Nền cờ thật là lớp giấy đặc, không để vân/trang trí giảm tương phản X/O.
- Kiểm tra trực quan: nền kem hạt mịn, lá nằm ở bốn góc, giữa trống, không có lưới/quân/chữ. Một số nhánh vươn vào góc sâu hơn vùng biên yêu cầu trong prompt; vùng an toàn bảo thủ cho nội dung trung tâm là x=24–78%, y=8–92%. Trên mobile có thể ẩn ảnh nền, giữ màu kem. Không coi toàn bộ vùng 82% được yêu cầu trong prompt là vùng đã xác minh trống.

Prompt nguyên văn:

```text
Use case: illustration-story
Asset type: quiet landscape backdrop for a children's 2D caro game, 1536x1024, intended to sit behind a separate live HTML/SVG board.
Primary request: a very restrained warm ivory paper background with delicate hand-painted garden foliage ONLY at the extreme corners, matching an elegant matte gouache and colored-pencil children's picture book.
Composition/framing: top-down flat composition. The central 82 percent of the image width and the central 86 percent of the height form a completely empty and nearly uniform warm ivory field. All leaves and botanical details stay within the outermost edges and corners; their visual weight is small. Subtle paper fibers, calm indirect daylight, no directional perspective.
Color palette: warm cream #FAF6EB dominant, muted sage and tiny terracotta accents confined to the edges, soft low contrast.
Constraints: full-bleed background only; NO board, NO grid, NO game marks, NO pieces, NO characters, NO furniture, NO pencils, NO text, NO frame, NO shadows across the center, NO vignette darkening. The empty center must remain usable for a high-contrast game board and UI. No letters, logos, watermark.
Avoid: dense leaves, flowers covering center, busy textures, prominent stains, plastic, glossy 3D, neon, UI mockup.
```

## 3. Lưu và tối ưu

Ảnh tạo ra được sao chép từ thư mục generated_images của Codex vào `docs/caro/art/`, giữ PNG gốc. Script [prepare-art.mjs](prepare-art.mjs) chỉ sao chép và chuyển WebP/resize, không thay đổi sáng tạo nội dung. Metadata, nguồn và dung lượng thực tế có trong [manifest.json](art/manifest.json).

Lệnh tái tạo bản tối ưu từ hai nguồn đã chọn (không ghi đè bản đã có):

```text
node docs/caro/prepare-art.mjs <cover-source.png> <backdrop-source.png>
```

Bản chạy dùng `games/Caro/assets/cover.webp` (1200 × 800, 133.394 byte) và `games/Caro/assets/backdrop.webp` (1536 × 1024, 43.974 byte). PNG gốc chỉ nằm trong tài liệu. Bìa hiển thị trọn chủ thể bằng `contain`; nền trang trí nằm ngoài lớp giấy bàn cờ. Kết quả kiểm tra màn hình thực tế ghi trong [báo cáo triển khai](../caro-sudoku-implementation.md).
