# Phố Nhỏ Tỉ Phú — nguồn mỹ thuật

Ngày: 15/09/2026.

## Ảnh Flow

- Project: https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5
- Bìa: https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5/edit/13fd1786-478e-47c7-aaf8-9b2969491e31
- Media bìa: `263749f4-d0dd-4402-a7e5-12a9b66d7126`.
- Tranh sự kiện: https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5/edit/4a45c769-33e3-4bc9-b575-38ab96c3461f
- Media tranh: `17d4de54-1d21-41d2-bd8c-8b3e98640862`.
- Xuất đúng ảnh đã hiển thị qua capability `pageAssets` của trình duyệt, rồi tối ưu bằng Sharp. Không có yêu cầu mạng tới Flow trong game.
- `public/co-ti-phu/art/cover.webp`: 1600×900, khoảng 367 kB; `cover-sm.webp`: 400×225, khoảng 38 kB.
- `community-0.webp` đến `community-5.webp`, `chance-0.webp` đến `chance-5.webp`: 400×320, tổng khoảng 270 kB.
- Flow tạo bảng 5×3 dù prompt yêu cầu 4×3. Chọn 12 ô phù hợp theo thứ tự 0,1,2,3,5,6,7,8,10,11,12,14; bỏ mép phân cách và xuất từng tranh. Nội dung chữ và hiệu ứng được engine quản lý riêng.

### Prompt bìa

Premium toy photography of a miniature Vietnamese property trading board game, square wooden diorama, pastel shophouses around a complete perimeter road, warm terracotta tiled roofs, striped cream awnings, teal shutters, tiny bakery and bookshop and ice cream shop, emerald trees, central landscaped park with turquoise fountain and cream clock pavilion, charming miniature tram, four cute animal explorer figurines, exquisite crafted wood and ceramic material, rounded bevels, warm golden morning light, soft ambient occlusion, sophisticated sage cream coral palette, beautiful coherent physical 3D game art, three quarter overhead view, whole board visible, landscape 16:9, no writing no text no UI.

### Prompt tranh

Contact sheet of 12 equal square illustrations in exact 4 columns by 3 rows, no gaps, no text. Premium miniature Vietnamese ceramic toy town art, warm cream backgrounds, sage teal and terracotta colors, soft shadows, crafted materials. Read left to right top to bottom: 1 weekend market stall; 2 parcel delivery bicycle; 3 watering can and flower garden; 4 painted shop sign and paintbrush; 5 lantern street festival; 6 golden coupon with leaf seal; 7 clock tower and green start flag; 8 map and compass beside a shop; 9 straw sunhat on cobblestone path; 10 wrapped present box; 11 repair tools and bicycle wheel; 12 tiny house and construction crane. One beautiful closeup diorama centered inside each exact cell, keep all objects inside their cells. No letters no numbers no borders. Landscape composition.

## Cảnh gameplay

`games/PropertyTown/geometry.ts` dựng mesh có màu theo đỉnh, gộp chi tiết thành một geometry cho mỗi công trình và một geometry cho tiểu cảnh. Có sáu nhóm công trình, ba cấp, cửa sổ trước/sau, mái ngói, mái hiên, ban công, biển/đạo cụ riêng; nhân vật gấu/cáo/thỏ/mèo; đài phun nước, tháp đồng hồ, cây, vườn hoa, ghế, đèn, đường ray và tàu điện di chuyển.

Flow cung cấp hướng mỹ thuật, bìa và tranh thẻ. Cảnh tương tác là 3D dựng bằng mã nguồn, không phải ảnh Flow được đặt làm bàn. Ánh sáng dùng RoomEnvironment cục bộ và bóng đổ; không tải texture hoặc môi trường từ bên ngoài. Âm thanh phản hồi tạo bằng Web Audio.

## Bộ 20 thẻ hiện hành

- Flow editor: https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5/edit/65fd14dd-d873-491f-adcd-7a6010d13969
- Media: `d4079b11-e36c-441d-843c-443c5db04f99`. Ảnh gốc 1376×768, đúng 5 cột × 4 hàng.
- Xuất qua browser pageAssets; cắt mỗi ô bỏ 4 px mép, WebP 400×280 quality 88.
- Thư mục `public/co-ti-phu/art/events/`: community-0…9 và chance-0…9, tổng 20 tranh riêng. Mười ô đầu là Chuyện khu phố, mười ô sau là Cơ hội.
- Thẻ cũ ở thư mục art gốc là tài sản của bản thử luật trước, không còn dùng trong giao diện hiện tại.
- Prompt yêu cầu 20 diorama đất sét/đồ chơi 3D, nền kem, xanh ngọc/đất nung/vàng, không chữ, đúng thứ tự hiệu ứng trong cards.ts. Các cảnh: hội chợ, kiện hàng, vườn hoa, sửa biển hiệu, lễ hội, hoàn phí, ngân hàng, tài trợ, xe giao hàng, sinh nhật, cổng xuất phát, bản đồ cửa tiệm, mũ và dấu chân, rương tiền, sửa xe, nhà tù, xúc xắc, tàu điện, hóa đơn, chậu hoa vỡ.

## Kiến trúc hiện hành

`buildings.ts` dựng 18 loại công trình riêng. `architecture.ts` thêm cánh nhà, sảnh, phòng kính, mái vòm, giàn che, khán đài và các hạng mục theo từng chức năng. Mỗi loại có ba trạng thái hình học. `geometry.ts` dựng tiểu cảnh, nhân vật và đường riêng; `primitives.ts` gộp chi tiết để giảm số lần vẽ. Cổng xuất phát xoay 45° ra ngoài, nhân vật có bốn vị trí rải trên ô góc. Nền đất và ô đường nhận màu chủ sở hữu; dải màu nhóm được giữ riêng.
