# Cờ Vua — tài nguyên của bản nâng cấp

Cập nhật 16/09/2026.

## Gameplay 3D

- `games/CoVua/geometry.ts`: sáu hình Staunton tự dựng (Lathe + Extrude), gộp geometry theo loại, tô các rãnh đế bằng vertex color. Mã có cổ, mõm, tai, mắt và bờm; Tượng có khe mũ thật; Xe có răng thành; Hậu có vương miện; Vua có thập tự.
- Board gỗ có cạnh vát/độ dày, texture Canvas sinh từ seed cố định, tọa độ và inlay. Không tải texture/HDR ngoài mạng.
- Cảnh phụ: bình lá và hai cuốn sách, gộp thành một mesh; chế độ nhẹ tắt cảnh phụ/bóng. Camera portrait giữ vùng bàn, cảnh phụ nằm ngoài tầm nhìn.
- `Board3D.tsx`: instancing, camera trực giao tự fit, ánh sáng phòng, render theo nhu cầu, chọn quân bằng instance raycast và chọn ô bằng raycast mặt bàn.
- `PieceIcon.tsx`: SVG tự vẽ cho bàn 2D, promotion, hướng dẫn và quân đã bắt. Không dùng glyph Unicode hay bộ ảnh quân bên ngoài.

## Font

Nunito Latin và Vietnamese, đóng gói tại `games/CoVua/assets/fonts/`. Giấy phép OFL nằm cạnh font và trong `games/CoVua/public/licenses/Nunito-OFL.txt`. Đồng bộ font với Cờ Tướng; tiêu đề serif dùng font hệ thống.

## Bìa Flow

Tái sử dụng ảnh đã tạo ngày 15/09, không tạo ảnh mới trong đợt nâng cấp này.

- Google Flow project: `7b20f6a9-d1ff-4fbb-9152-27694219b8d5` (Game Assets).
- Media ID: `a26443cd-132a-4133-8a62-56719378fa46`; bản gốc 1376×768 JPEG.
- `public/co-vua/art/cover.webp`: 800×450, 61.180 byte.
- `public/co-vua/art/cover-sm.webp`: 400×225, 21.404 byte.
- Bản standalone copy cover chính vào `games/CoVua/assets/cover.webp`, được hash và precache khi build. Ảnh xuất hiện ở lobby; không dùng thay gameplay.

Prompt nguồn:

> Premium miniature wooden chess set on a warm honey-wood board with cream and walnut squares, classic hand-turned Staunton pieces in light maple and dark walnut, cozy warm morning light, soft shadows, handcrafted bevels and subtle wood grain, inviting friendly atmosphere for children yet traditional and tasteful, clear three-quarter overhead view, whole board visible, a few pieces mid-game, cinematic toy photography, sage cream and terracotta accents, landscape 16:9, no UI, no text.

## Âm thanh và icon

- `audio.ts`: âm tổng hợp bằng Web Audio, không có file nhạc hay yêu cầu mạng.
- Icon giao diện: Lucide đang có trong dự án; icon ứng dụng SVG hình Mã tự vẽ, render PNG 192/512 bằng Sharp.
- Screenshot kiểm chứng tại `games/CoVua/reports/screenshots/` là ảnh chụp gameplay/lobby thật từ trình duyệt, không phải ảnh tạo sinh.
