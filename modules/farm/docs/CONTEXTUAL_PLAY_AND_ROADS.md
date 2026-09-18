# Tương tác trong game, texture và đường tự nối — 18/09/2026

Tài liệu này cập nhật yêu cầu mới nhất của Đại ca, ưu tiên hơn mô tả toolbar/side panel cũ. Giữ module độc lập, save hiện có và toàn bộ luật kinh tế. Không ghép host/Auth/Supabase.

## Đã triển khai

- **Ảnh danh mục xây dựng và giống:** mọi thẻ công trình/trang trí dùng ảnh đúng model trong game; nhà đã có dùng cấp hiện tại. 12 giống có ảnh cây trưởng thành trên đất có texture, giá, thời gian và sản lượng. Mẫu khóa vẫn rõ hình và điều kiện Home. Gieo mở bảng chọn giống bằng ảnh; nút giống đang cầm cho đổi lại. Chỉ gieo thật mới trừ xu.
- **Cách dựng thumbnail:** `src/render/catalogThumbnails.ts` dùng một WebGL renderer tạm, xếp hàng dựng PNG trong suốt 320 × 240 từ model clone, cache theo asset/cấp hoặc cây rồi giải phóng renderer khi rảnh. `CatalogPicture.tsx` chỉ tải khi gần vùng nhìn; `SeedCards.tsx` dùng chung cho cửa hàng và popup gieo. Không tạo canvas chạy liên tục trên từng thẻ; không thêm PNG tĩnh hoặc đổi save.
- **Luống đất:** thay khối hộp nâu bằng mặt đất có ảnh RGBA `tilled-soil-v1.png`, rãnh đất/cục đất và mép không đều. Mặt luống cao 0,028 đơn vị, không còn vách hộp như tấm gỗ. Tưới làm đất sẫm hơn, cây/picking theo plot ID như trước. Các luống dùng chung texture và instancing.
- **Chọn đối tượng:** nút nổi bám vật thể, có giới hạn trong viewport. Luống trống cho gieo; cây đang lớn cho tưới/chăm sóc; cây chín cho cầm liềm. Công trình có mở chi tiết và di chuyển. Vật cản có khai phá. Không tự mở bảng lớn chỉ vì chạm một đối tượng.
- **Liềm thu hoạch:** chọn cây chín → cầm liềm → kéo qua luống → thả để xác nhận batch. Bỏ qua ô không hợp lệ trong preview, ghi batch nguyên tử với expectedRevision. Liềm giữ hoạt động cho lượt quét kế, cất bằng nút hoặc Escape. Space + kéo vẫn pan; cử chỉ hai ngón hủy stroke để pan/zoom.
- **Phản hồi thưởng:** chỉ sau khi gateway lưu thành công mới tạo sản phẩm bay từ từng luống về nút giỏ/kho. Dùng đúng crop/yield của những ô được chấp nhận. Có số +N và giỏ nhún nhẹ. Giảm chuyển động dùng hiện/mờ tại luống; không bay. Thu lỗi, revision cũ, kho đầy hoặc ô trống không tạo thưởng giả. Tất cả 12 cây có icon màu riêng, không dùng hộp chung.
- **Cửa sổ game:** bỏ sidebar và việc mở nhiệm vụ sẵn lúc vào game. Xây dựng/cửa hàng/kho/nhiệm vụ/đơn hàng mở hộp giữa màn hình, nền giấy kem, header tranh mùa gặt, nút đóng và nội dung cuộn riêng. Menu chuyển mục nằm trong cửa sổ. Dialog khóa tương tác nền, giữ Tab trong cửa sổ, đóng bằng Escape/nút/bấm nền; trở lại trọn bản đồ. Các cấu trúc sản xuất, hàng đợi, nâng cấp, phiếu và xác nhận vẫn giữ.
- **Chim:** thay các thanh hình hộp bằng ba sprite chim én RGBA. Bay theo đường cong, xoay hình theo hướng bay trên màn hình, giãn khoảng cách và chao nhẹ. Không bắt chuột/raycast; giảm chuyển động giữ vị trí tĩnh. Một hình chim, chưa có spritesheet nhiều khung vỗ cánh.
- **Đường:** ảnh đá lát `road-stone-v1.png`, 16 mask bốn cạnh N/E/S/W. Sáu nhóm: riêng lẻ, đầu đường, thẳng, góc, ngã ba, ngã tư. Các đoạn nối chạm đúng biên ô, không có viền hoặc khe cắt ngang; vai đường ngoài được bo. UV theo tọa độ thế giới và mirrored repeat cho mặt đá liên tục, không lặp lại một tấm có viền trên từng ô. Đường chéo/cao độ khác không tự nối. Xây, chuyển, cất, undo và reload suy ra kết nối từ vị trí hiện tại; không thêm dữ liệu vào save. Preview đường cũng phản ánh kết nối, không render thêm khối path cũ.

## Điểm vào để sửa tiếp

| Phần | File |
|---|---|
| Điều phối công cụ, modal, thưởng sau commit | `src/Game.tsx` |
| Menu đối tượng / liềm và thành phẩm | `src/ui/SubjectMenu.tsx`, `src/ui/HarvestEffects.tsx` |
| Dialog, focus, trang nội dung | `src/ui/shared.tsx`, `src/ui/Panels.tsx`, `src/farm.css` |
| Raycast, stroke, chiếu tọa độ thành phẩm/menu | `src/render/FarmWorld.tsx` |
| Texture ruộng / chim | `src/render/CropField.tsx`, `src/render/SceneLife.tsx` |
| Kết nối đường thuần dữ liệu | `src/core/roads.ts` |
| Biên mesh và UV đường / gộp mesh, picking | `src/render/roadGeometry.ts`, `src/render/Roads.tsx` |
| So sánh 6 dạng / 16 hướng | `src/dev/RoadLab.tsx`, `?lab=roads` |

## Tài nguyên và nguồn

Các texture và tranh dưới đây dùng **built-in image_gen qua skill imagegen**, giữ nguyên PNG gốc trong repository. Thumbnail danh mục được render từ model thật trong game, không phải ảnh imagegen mới:

- `src/assets/terrain/tilled-soil-v1.png`
- `src/assets/terrain/swallow-flight-v1.png`
- `src/assets/ui/harvest-window-v1.png`
- `src/assets/terrain/road-stone-v1.png`

Prompt chính xác: [interaction-asset-prompts](interaction-asset-prompts-2026-09-18.json), [road-asset-prompt](road-asset-prompt-2026-09-18.json). Không lấy ảnh Family Island. Icon UI vẫn là SVG theo hệ icon có sẵn; ảnh mới được dùng thật trong runtime.

21 PNG của đợt mỹ thuật đến thời điểm này tổng **36.512.748 byte**. Cần tối ưu texture/VRAM trước phát hành thiết bị yếu; chưa coi đây là asset budget cuối.

## Kiểm thử thủ công và giới hạn

Kiểm trong DB QA riêng `?lab=qa&session=interaction-review`; không tác động vườn thật. Query `session` chỉ tách DB của DevLab, được giới hạn ký tự/độ dài. `?lab=mobile` chỉ là tên sandbox, không chứng minh đã kiểm viewport điện thoại.

- Chọn lúa mì: menu bám trên luống, nút thu hoạch; bốn luống đầu nhận 12 hàng; hai luống bí/cà rốt nhận thêm 5. Quan sát icon +2/+3 bay lên giỏ sau khi trạng thái lưu hoàn tất. Quét lại giữ kho 17, báo luống chưa có cây.
- Chọn đất trống → gieo bốn luống lúa mì: 180 → 168 xu; công cụ gieo vẫn hoạt động.
- Cửa hàng có banner ảnh, 12 giống và nội dung cuộn. Chuyển sang nhiệm vụ trong cùng cửa sổ; Escape đóng về bản đồ.
- Home 5, mở khu 13: 25.000 → 24.880 xu; khu chuyển thành sở hữu, khu 19 thành liền kề, sương rút theo vùng đã nhận.
- Xưởng đường đã xem sáu mẫu và đủ 16 mask. Test tự động kiểm cả mối nối hình học/UV và lệnh build/move/store/undo thật. Không dùng ảnh mẫu để thay cho logic kết nối trong game.
- Log error rỗng trong tab mới sau lần build cuối; các lỗi HMR tạm thời khi asset road chưa được chép đã được xử lý. Mobile thật, GPU/memory budget và nghiệm thu mỹ thuật với Đại ca vẫn chưa hoàn tất. Không tuyên bố đạt 60 FPS.

Ảnh kiểm: [menu cây chín](screenshots/art-pass-2026-09-18/context-harvest.png), [cửa hàng](screenshots/art-pass-2026-09-18/game-window-shop.png), [sáu dạng đường](screenshots/art-pass-2026-09-18/road-types.png), [16 mask](screenshots/art-pass-2026-09-18/road-16-masks.png), [sương trước](screenshots/art-pass-2026-09-18/fog-before.png), [sương sau](screenshots/art-pass-2026-09-18/fog-after.png). Kết quả tự động cuối ở [VERIFICATION](VERIFICATION.md).
