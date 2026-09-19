# Khởi đầu, công trình ảnh và lối trang viên — 19/09/2026

## Sửa lỗi chân nhà bị nền che — sau phản hồi ảnh của đại ca

Kiểm chứng trước đó chưa đủ: kiểm biên alpha của file ảnh không phát hiện ảnh nằm xuyên mặt đất trong cảnh 3D. Đã tái hiện đúng lỗi Nhà chính/kho bị cắt phần dưới trên map đang mở.

Nguyên nhân: `SpriteBuilding` chỉ giữ hai thành phần chiếu của góc footprint lên mặt phẳng camera, bỏ mất thành phần chiều sâu. Chân ảnh vì vậy có tọa độ Y âm so với nền. Đã chuyển sang neo chân ảnh trực tiếp tại góc phía trước trên mặt đất trong `buildingSpritePose.ts`, vẫn giữ depth test để các vật thể che nhau đúng vị trí. Dùng chung cho nhà đã đặt và preview di chuyển/xoay, không đổi save.

Kiểm lại: ảnh map thật trước/sau; zoom và preview xoay; kiểm thử tọa độ chân cho 29 footprint × 4 góc × 3 độ cao × 2 kiểu căn ảnh và 3 mức zoom. Nhóm grounding/render/696 ảnh: 8/8 đạt; TypeScript và build module đạt. Đây là sửa lỗi bổ sung cho kết quả suite trước đó, không phải tuyên bố đã kiểm mọi tình huống mỹ thuật.

Đã triển khai theo 7 yêu cầu và bổ sung đường đổi theo ngoại hình Nhà chính của đại ca. Đây là trạng thái local, chưa deploy.

## Hành vi hiện tại

- World mới có 20 tài nguyên cấp 1 bảo đảm: 8 cây, 8 đá, 4 quặng, trong vùng sở hữu ban đầu. Có khoảng trống quanh từng điểm để khai phá. Không tái sinh layout của bản lưu cũ. Khóa nghề quặng ở Nhà chính 4 vẫn giữ.
- 29 công trình chức năng dùng ảnh giả 3D, 6 mốc ngoại hình × 4 góc = 696 WebP. Map, preview di chuyển/xoay, thẻ xây dựng, chi tiết và xưởng tài nguyên cùng dùng bộ ảnh này. Trang trí và địa hình vẫn dùng hình học hiện có.
- Mỗi nhà dùng một mặt phẳng ảnh và một bóng tiếp đất. Chỉ tải góc/cấp đang hiển thị, không nạp toàn bộ atlas lên GPU. Click xuyên phần alpha trong suốt; khi gieo/gặt/tưới/sắp xếp nhà được làm mờ.
- Thi công có thanh phần trăm, đồng hồ đếm ngược theo clock của save, hình búa/cưa 8 frame và giàn giáo. Chờ mẻ sản xuất được ghi riêng; giảm chuyển động dừng animation. Xong thi công thì tự bỏ badge.
- Bụi quả dùng ảnh được tạo bằng imagegen và instancing, có alpha picking/bóng tiếp đất.
- Mở phiên tài khoản luôn đọc cloud trước, kể cả cache đã liên kết còn thay đổi chưa gửi. Không upload trước khi chọn. Cloud nằm đầu, được chọn mặc định nếu có; radio và nút xác nhận riêng. Giữ cơ chế CAS/outbox/recovery cũ. Dữ liệu thực không được chỉnh trong lần kiểm này.
- Modal lời chào nhỏ có ảnh gia đình, 3 hướng dẫn thao tác và nhiệm vụ hiện tại. Lần đầu chỉ tới 3 luống thu hoạch và phần thưởng 120 xu + phiếu. Ẩn trong lúc kiểm tra/chọn bản tài khoản để không chồng modal.
- Mục tiêu Nhà chính, điều kiện công trình và nhiệm vụ nâng cấp bấm được. Dẫn tới công trình hiện có hoặc mở menu xây lọc đúng loại còn thiếu; lần ngược điều kiện mở khóa Nhà chính.

## Đường theo Nhà chính đã hoàn tất

| Cấp ngoại hình | Chất liệu |
| --- | --- |
| 1–4 | Đường đất |
| 5–9 | Đất rải sỏi |
| 10–14 | Gạch nung |
| 15–19 | Đá cuội |
| 20–24 | Lối đá lát |
| 25 | Đá trang viên xếp hình quạt |

Sáu texture được gen theo phong cách lối vườn mộc, không nhựa đường, vạch xe hoặc hình thức quốc lộ. Dùng Home level đã hoàn thành, không dùng target khi đang xây. Tất cả ô đường hiện có tự thay chất liệu, giữ vị trí/rotation/save và 16 kiểu nối. Thẻ xây/chọn đường đổi tên và ảnh tương ứng. Không thu thêm phí nâng đường.

## Tài nguyên và tái đóng gói

Dùng **built-in image_gen**, không dùng API/CLI fallback.

- Prompt công trình: [building-sprite-prompts-2026-09-19.json](building-sprite-prompts-2026-09-19.json).
- Prompt bụi quả, lời chào, búa/cưa, 6 chất liệu đường: [arrival-road-prompts-2026-09-19.json](arrival-road-prompts-2026-09-19.json).
- Atlas gốc RGBA: `src/assets/buildings/source/`; 696 ảnh game: `src/assets/buildings/runtime/` (17,28 MiB, 256×256 mỗi ảnh).
- Manifest có tọa độ nguồn, dung lượng: [building-sprite-manifest.json](building-sprite-manifest.json).
- Ảnh đường: `src/assets/roads/`; bụi: `src/assets/terrain/optimized/berry-v1.webp`; UI: `src/assets/ui/welcome-v1.webp`, `construction-tools-v1.webp`. PNG gốc giữ trong thư mục source hoặc cạnh WebP.
- `node modules/farm/scripts/package-building-sprites.mjs`: lấy 24 vùng alpha rời trong mỗi atlas, bảo toàn mái/cánh quạt dù chiều cao các hàng không đều, thêm đệm trong suốt; không vẽ lại công trình. Phụ thuộc `atlas-components.mjs`.
- `node modules/farm/scripts/package-arrival-assets.mjs`: đóng gói lại ảnh phụ từ PNG trong repo, không cần file ngoài máy.

## Kiểm chứng và giới hạn

- TypeScript module đạt.
- Full bộ engine/save/online/world/progression/render cũ và kiểm tra khởi đầu mới: **160/160**, 19 files, 199 giây.
- Bổ sung kiểm tra tài nguyên: **1/1** đạt; giải mã tất cả 696 WebP, đủ 29×6×4 URL khác nhau, 256×256, mọi biên đều alpha 0. Kiểm tra này có timeout riêng 30 giây vì phải giải mã cả bộ ảnh; lượt cuối 9,91 giây.
- Build module và host đạt. Vite vẫn cảnh báo bundle lớn; không coi build thành công là bằng chứng FPS trên điện thoại.
- Trình duyệt in-app, DB riêng `sprites-20260919`: lời chào, ảnh Nhà chính/kho, nhiệm vụ → nâng Nhà chính, nhiệm vụ bột mì → menu xây Cối xay, countdown tăng tiến, Home 4→5 đổi nhà và đường, badge biến mất, lựa chọn cloud mặc định và chuyển qua lại hai bản thử.
- Xưởng kiến trúc đã xem các góc trước/sau; 29 ảnh trên màn không lỗi tải. Phát hiện và sửa cắt sai hàng ở atlas trước khi build cuối. RoadLab xem đường đất, đường trang viên và đủ 16 dạng nối.
- Console trong lượt kiểm gameplay không có lỗi. QA lựa chọn tài khoản dùng fixture và transport test; **chưa đăng nhập Google thật để chọn/ghi cloud trong lượt này**.
- Công cụ viewport không thay đổi viewport thực (vẫn 1280×720 sau yêu cầu 390×844), đã reset override. **Chưa xác nhận responsive điện thoại hoặc đo FPS Android thật.**

Sân thử thêm nút “Thử thi công” và “Thử chọn cloud”. Chỉ có ở dev lab, không gọi cloud thật và không dùng DB người chơi. Xưởng kiến trúc `?lab=architecture`; xưởng đường `?lab=roads` có chọn đủ 6 mốc.
