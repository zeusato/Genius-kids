# Hòa trộn cây/đá với nền — 18/09/2026

Đại ca phản hồi sprite có viền sáng và bóng đĩa phẳng, trông như ảnh dán lên đất. Đợt này chỉ sửa render và ảnh bạch dương, giữ nguyên save, tọa độ tài nguyên, luật khai phá và camera.

## Đã sửa

- `render/cutoutMaterials.ts`: giữ độ phủ alpha của PNG, bỏ cách cắt alpha rồi biến toàn bộ pixel còn lại thành đặc. Dùng alpha-to-coverage trên context có MSAA; fallback alpha hashing trên context không có MSAA. Vật liệu vẫn ghi depth, tránh lỗi sắp xếp cây trong các nhóm instancing. Chế độ làm mờ cây khi sắp xếp giữ blending riêng như trước.
- `Landscape.tsx` và `GroundCover.tsx`: dùng cùng xử lý cho cây, đá/quặng và ba loại cây thấp. Vẫn gộp instance theo mẫu, không thêm canvas hoặc draw call cho từng vật thể.
- Bóng nền dùng hai vùng suy giảm liên tục: vùng sát gốc đậm hơn, vùng tán rộng và nhạt, tan hoàn toàn trước biên plane. Bỏ đĩa circle 16 cạnh có opacity đều. Đây là bóng tiếp đất giả lập, chưa phải bóng tán cây chính xác theo hình lá hoặc chu kỳ mặt trời.
- Bạch dương dùng `src/assets/terrain/birch-v2.png`: tán rõ khối hơn, bớt mép lá vụn sáng. Giữ thân trắng, dáng phân nhánh, một góc nhìn và alpha thật. Ảnh gốc v1 giữ tại chỗ làm nguồn; loại khỏi glob runtime để không đóng gói thừa.

## Nguồn ảnh

Dùng **built-in image_gen**, chế độ edit qua skill imagegen. Input: `src/assets/terrain/birch-v1.png`. Output gốc được chép nguyên vào `src/assets/terrain/birch-v2.png`; không dùng Python chỉnh ảnh. Kích thước 1145 × 1374 RGBA, 1.123.874 pixel hoàn toàn trong suốt. Prompt nguyên văn:

> Use case: precise-object-edit. Asset type: transparent RGBA tree sprite for an isometric cozy farming game. Edit target: the attached birch tree sprite. Keep a recognizable slender white birch with two branching trunks and a few exposed roots, full crown and full roots inside canvas, fixed slightly elevated three-quarter view, centered single isolated tree, matching its current overall proportions and footprint. Correct the cutout and lighting: remove ALL yellow, lime and white fringe, glow and bright outline around foliage and branches. No rim lighting or backlight. Edge leaves must have natural mid-green or dark olive RGB, with clean actual alpha transparency and subtle antialiasing, no baked white matte. Give foliage a gently stylized hand-painted game look with coherent rounded clusters, enough solid leaf mass to read when the sprite is 180px high; avoid hundreds of hairline pale floating leaves. Soft warm daylight from upper-left/front, quiet shaded edges, white bark with gray-brown markings but no pure glowing white. Natural moss green and olive palette, not neon yellow. Root colors earthy brown and muted moss, roots touch bottom ground anchor without grass pedestal. Background genuinely fully transparent, no solid background, no checkerboard pixels, no ground disc, NO cast shadow (engine supplies it), no text, no border, no extra objects. Preserve the single tree identity, camera and full silhouette framing; primarily correct clean edges and integration lighting.

## Kiểm chứng và giới hạn

- Module typecheck đạt; landscape 9/9 test đạt (3,33 giây), gồm RGBA của đủ 14 mẫu hiện hành và không đổi phân bố/save. Build và browser được ghi ở [VERIFICATION](VERIFICATION.md).
- Xem trực tiếp rừng ven hồ trong QA riêng `?lab=qa&session=blend-review`, nhiều cây chồng nhau và zoom gần; không reset DB của Đại ca. [Ảnh cận cảnh](screenshots/art-pass-2026-09-18/foliage-blend-close.png).
- Context không MSAA chưa được kiểm trên phần cứng thực; không coi chế độ đồ họa nhẹ là bằng chứng kiểm fallback này. Cây vẫn là ảnh cố định có ánh sáng vẽ sẵn; phong cách giữa sprite và mesh công trình chưa phải một bộ asset thống nhất hoàn toàn. Chưa chứng nhận hiệu năng điện thoại hoặc mỹ thuật cuối.
