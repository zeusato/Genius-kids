# Ô ăn quan — nguồn hình ảnh và cảnh 3D

Ngày: 15/09/2026.

## Ảnh bìa

- Nguồn: Google Flow, project `7b20f6a9-d1ff-4fbb-9152-27694219b8d5`.
- [Ảnh tham chiếu trên Flow](https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5/edit/a1fb4cac-3969-4708-b05b-de6b034eed41).
- Media ID: `6c2ea47b-e47c-43bf-92c0-802efe28ed3a`.
- Lấy ảnh đã hiển thị qua browser pageAssets; chuyển JPEG sang WebP bằng Sharp.
- `public/o-an-quan/art/cover.webp`: 800 × 450, 92.6 kB.
- `public/o-an-quan/art/cover-sm.webp`: 400 × 225, 27.3 kB.
- Ảnh dùng ở danh mục và sảnh; không phải ảnh chụp gameplay.

Prompt:

> Premium miniature Vietnamese O An Quan board game in a peaceful village communal courtyard, warm terracotta and pale honey wood, friendly tiny painted clay villagers with round faces and simple teal and cream traditional tunics, two larger mandarin figurines with dark traditional hats, clear overhead three-quarter view, two rows of five shallow square pits with a semicircular pit at each end, restrained banyan foliage and bamboo details around the perimeter, soft warm morning daylight, cinematic toy photography, beautiful handcrafted bevels and subtle grain, inviting calm atmosphere, full board visible, landscape 16:9 composition, no text, no labels, no UI. Game cover and art direction reference.

## Cảnh tương tác

- Mesh dân/quan và bàn: `games/OAnQuan/geometry.ts`. Dân có ba màu áo; quan có mũ cánh chuồn, áo đỏ và thẻ vàng. Mesh dùng chung, dân dùng instancing. Ô đông quân hiển thị tối đa 12 hình đại diện; số trên ô là số chính xác.
- Sân đình: `games/OAnQuan/scenery.ts`. Sân gạch so le, đình có bậc thềm/cột/cửa/mái ngói/đèn lồng, cây đa có rễ buông, tre và hàng rào, chum nước, chậu hoa, ghế gỗ, giỏ đan và lá rụng. Các vật tĩnh gộp một mesh/một vật liệu.
- Vân gỗ: vẽ bằng canvas trong dự án; không có texture mạng lúc chơi.
- Ánh sáng: môi trường RoomEnvironment của Three.js và đèn đổ bóng; chế độ nhẹ tắt tiểu cảnh và bóng động.
- Avatar và nhạc nền tái sử dụng tài nguyên sẵn có của ứng dụng. Tiếng rải/ăn tạo bằng Web Audio.

Ảnh Flow chỉ cung cấp hình bìa và hướng mỹ thuật. Tất cả ô, nhân vật và đường di chuyển trong game là geometry và dữ liệu do ứng dụng dựng.
