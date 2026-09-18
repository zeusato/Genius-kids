# Địa hình v2 và tài nguyên 2.5D — bàn giao 18/09/2026

Đây là trạng thái triển khai sau khi Đại ca duyệt làm theo review địa hình và yêu cầu nhiều biến thể cây/đá. Tài liệu này cập nhật các quy định cũ về camera xoay và bắt buộc mọi object là mesh 3D.

## Đã chạy trong module

- Camera orthographic cố định hướng/nghiêng; pan, zoom, về Home, toàn cảnh và điểm tham quan hồ/rừng/cao nguyên. Chuột phải pan; Q/E và twist không xoay cảnh. Vật thể công trình vẫn xoay được.
- Một mẫu `lake-valley-v2` 96 × 96: vùng Home bằng phẳng; hồ nối suối/sông; hai điểm cầu; cụm rừng tài nguyên; một cao nguyên liền mạch có dốc lên. Đồi không lặp theo chunk. Seed thay đổi trong giới hạn bố cục; sáu nhãn family chưa phải sáu layout độc lập.
- Mesh đất/bờ/nước chia sẻ đường biên và được làm mềm chung. Mặt nước có màu nông/sâu, chuyển động nhẹ; có lau sậy, màu cỏ biến thiên và viền đất tự nhiên ngoài lưới logic. Viền ngoài chỉ để ngắm, không xây thêm ngoài 96 × 96.
- 7 cây: sồi, bạch dương, thông, tre, chuối, phong, mận hoa. 7 đá/quặng: đá rêu, granite, sa thạch, đá phiến, đá vôi, cuội, sắt. Phân bố ổn định theo seed/toạ độ, ưu tiên loài phù hợp vùng cao/ven nước. Biến thể hình ảnh vẫn trả tài nguyên theo loại gameplay, không tạo 14 loại nguyên liệu mới.
- 14 PNG alpha tạo bằng imagegen tích hợp, đặt tại `src/assets/terrain`. Sprite cố định, có bóng nền, neo phần gốc nhìn thấy xuống đất; raycast bỏ vùng ảnh trong suốt. Tán cây mờ, raycast bỏ vật cản tự nhiên trong công cụ ruộng/sắp xếp để thao tác phía sau.
- Xưởng tài nguyên có bảng đủ 14 mẫu để so sánh. Hợp đồng `SpriteViews` yêu cầu đủ bốn ảnh cho vật thể sprite được xoay; bộ công trình hiện vẫn dùng 3D, chưa được chuyển hàng loạt thành sprite.
- Xây/di chuyển/khai phá mới phải có đường tiếp cận; không còn đặt đồ ở bờ chưa có cầu chỉ vì đã sở hữu khu. Thi công cầu phải tới được ít nhất một bờ.

## Save và cách xem

Không reset hoặc tự tái sinh thế giới đã lưu. `world.version=1` tiếp tục dùng nguyên heights/water/obstacles/bridges; chỉ đổi renderer và giao diện. `world.version=2` có `templateId`. Snapshot cũ có tài sản ở bờ chưa tiếp cận vẫn load; hành động mới dùng luật tiếp cận mới. `generateLegacyWorld` giữ để regression.

Vườn đang chơi: <http://127.0.0.1:4328/>. Xem map mới trong dev ở <http://127.0.0.1:4328/?lab=qa>, chọn **QA Home 1** hoặc **QA Home 25**; DB QA tách riêng. Trong Cài đặt của save địa hình cũ có **Mở sân thử thung lũng**. Không yêu cầu người chơi xoá save để xem thay đổi.

Ảnh thật: [toàn cảnh](screenshots/terrain-v2/overview.png), [bờ hồ](screenshots/terrain-v2/lake.png), [cao nguyên](screenshots/terrain-v2/plateau.png), [14 tài nguyên](screenshots/terrain-v2/assets.png). Đây là screenshot renderer/asset, không phải concept thay cho bản chạy.

## Mã chính

- `core/world.ts`: bố cục v2, legacy generator, validator, reachability.
- `core/scenery.ts`: catalog/seed variant và hợp đồng hướng ảnh.
- `render/landscapeGeometry.ts`: hình học bờ/đất/nước, vùng ngoài logic.
- `render/Landscape.tsx`: shader, sprite instancing, alpha picking, neo gốc/bóng.
- `render/FarmWorld.tsx`: camera, thao tác, bỏ hit tài nguyên trong công cụ ruộng.
- `render/naturalAssets.ts`: Vite asset URLs; `Game.tsx`: gallery/điểm tham quan.
- `tests/landscape.check.ts`: regression địa hình, access, save, hình học, catalog asset.

## Kiểm chứng và giới hạn

Bộ suite cuối: **71/71 test, 8/8 file, 303,82 giây**. Giữ đầy đủ 6.000 seed, 120 seed topology, chín lịch chơi solo tới Home 25, migration và thao tác kinh tế. Tăng timeout hai bài dài cho generator phong phú hơn; không giảm số seed/scenario hoặc bỏ guard tối đa lệnh chống deadlock. Typecheck module/host đạt. Production build đạt, còn cảnh báo chunk JavaScript lớn.

Sau chỉnh cuối mép cao nguyên/camera/picking, kiểm lại 7/7 bài landscape, typecheck module và build đạt. Trình duyệt kiểm khai phá nhận đúng 12 gỗ sau trả 10 xu và sprite được dọn; quét nhiều ô ruộng nhận 14 hàng, giữ công cụ Thu. Xem VERIFICATION để biết giới hạn thử viewport mobile.

Đây là một mẫu cảnh quan đã dựng, chưa chứng nhận mỹ thuật cuối cùng hoặc đủ sáu họ địa hình. Vách cao nguyên vẫn là mesh, cần tiếp tục duyệt độ tự nhiên ở cận cảnh. Công trình procedural và sprite có thể còn lệch chất liệu; bộ bốn hướng cho công trình cần một đợt mỹ thuật riêng. Chưa thay toàn bộ cây mùa vụ/decor.

14 PNG gốc khoảng 23,7 MB; chưa nén texture/atlas và chưa đo cold start/VRAM trên điện thoại mục tiêu. QA desktop Home 25 quan sát khoảng 36–47 FPS trong môi trường đang chạy nhiều công cụ; không so trực tiếp với benchmark 0.2 và không báo đạt mục tiêu 60 FPS. Chưa nghiệm thu touch hai ngón hoặc GPU điện thoại thật.

Module tiếp tục độc lập; chưa ghép host, Auth, Supabase hoặc trading. Không commit/push. Tài liệu review và ảnh cũ giữ làm lịch sử, không dùng để mô tả bản hiện tại.
