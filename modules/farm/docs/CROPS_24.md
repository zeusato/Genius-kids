# Bộ 24 giống cây — 18/09/2026

Đại ca yêu cầu tăng từ 12 lên 24 giống, đa dạng hình dáng và nhóm sản phẩm; thời gian dài nhất 24 giờ. Đã triển khai trong module độc lập. Giữ thông số của 12 giống cũ, kể cả trà 8 giờ.

## Mười hai giống bổ sung

Thời gian là một vụ chưa tưới/tăng tốc. Giá bán tính cho một sản phẩm, giá hạt tính cho một ô.

| Giống | Nhà chính | Thời gian | Giá hạt (xu) | Thu/vụ | Bán/món (xu) |
|---|---:|---|---:|---:|---:|
| Xà lách | 2 | 2 phút 30 giây | 6 | 3 | 9 |
| Củ cải đỏ | 3 | 4 phút | 9 | 3 | 13 |
| Hành tây | 4 | 10 phút | 18 | 4 | 22 |
| Khoai tây | 6 | 20 phút | 26 | 5 | 30 |
| Dưa leo | 8 | 45 phút | 32 | 5 | 38 |
| Cà tím | 10 | 1 giờ 30 phút | 45 | 4 | 52 |
| Ớt | 11 | 3 giờ | 55 | 5 | 65 |
| Dưa hấu | 13 | 5 giờ | 85 | 3 | 120 |
| Dứa | 15 | 6 giờ | 95 | 4 | 135 |
| Hoa hồng | 18 | 12 giờ | 120 | 5 | 150 |
| Cà phê | 22 | 16 giờ | 160 | 6 | 180 |
| Nghệ tây | 25 | 24 giờ | 240 | 5 | 480 |

Giữ luật tưới hiện hành: một lần mỗi vụ, giảm 10% thời gian gốc. Nghệ tây tưới ngay sau gieo còn 21 giờ 36 phút; không tăng sản lượng. Đây là thời gian gameplay, không mô phỏng thời gian trồng thực tế.

## Tích hợp và hình ảnh

- Catalog `src/core/content.ts` là nguồn dữ liệu. Kho hàng, bán hàng, gieo/thu và hệ thống đơn hàng dựa trên sản phẩm đã khám phá nhận các giống mới. Chưa thêm công thức chế biến dành riêng cho 12 giống mới; giá là cân bằng ban đầu, chưa kết luận tối ưu kinh tế dài hạn.
- `src/render/cropVarieties.ts` có dáng cây riêng từ giai đoạn phát triển: xà lách cuộn lá, củ cải rễ trắng, hành củ vàng, khoai bụi thấp, dưa leo giàn, cà tím quả tím, ớt nhọn, dưa hấu dây bò/quả sọc, dứa chùm lá, hồng nhiều lớp cánh, cà phê quả đỏ, nghệ tây hoa tím/nhụy cam. Hạt và mầm nhỏ dùng mẫu chung hiện có.
- Mô hình dùng chung giữa ruộng và thumbnail. Mesh được bake/cache bằng pipeline hiện có. Icon sản phẩm mới trong `ExtraCropIcon.tsx` có hình riêng, dùng cả hiệu ứng thu hoạch; không dùng icon hộp chung.
- Cửa hàng và popup đổi giống sắp theo cấp Nhà chính rồi thời gian. Hiển thị chính xác phút/giây; giống dài nhất hiện “24 giờ”. Ảnh menu 320 × 240 tải theo vùng nhìn.
- QA Home 25 vẫn có 120 luống, nay 5 luống cho mỗi giống trong bộ 24.

## Bảo toàn bản lưu

Giữ schema 2, tăng contentVersion 2 → 3. Khi đọc bản lưu cũ đầy đủ, thêm 12 khóa kho mới bằng 0, giữ tiền, luống và thời hạn đang chạy, công trình, việc đang làm, revision và receipts. Không sửa đối tượng đầu vào, không đổi seed hoặc reset vườn. Kho cũ thiếu vật phẩm cũ vẫn bị từ chối; phiên bản tương lai vẫn bị từ chối. Luồng import bản lưu và IndexedDB đều đi qua validation này. Migration legacy v1 tiếp tục qua luồng hiện có.

## Kiểm chứng

- Bổ sung 16 test: catalog đủ 24/max 24 giờ, cấp mở khóa và gieo–lưu–chín offline–thu–bán từng giống, tưới một lần, migration/import, lưu IndexedDB v2 rồi thực hiện lệnh và đọc lại v3.
- Nhóm crop/model/persistence/showcase: 27/27 đạt. Test model duyệt đủ 24 giống × 5 giai đoạn.
- Browser QA riêng `?lab=qa&session=crops24-review`: 24/24 thumbnail tải đúng kích thước; chọn nghệ tây từ cửa hàng và mở popup đổi giống giữ đúng lựa chọn; không trừ xu khi chỉ chọn. Log error rỗng lúc kiểm. Không reset DB của Đại ca.
- Ảnh: [rau và quả](screenshots/art-pass-2026-09-18/crops24-vegetables.png), [giống dài ngày](screenshots/art-pass-2026-09-18/crops24-long-duration.png).
- Kết quả toàn suite/typecheck/build cuối xem [VERIFICATION](VERIFICATION.md). Chưa kiểm điện thoại thật hoặc tuyên bố đạt ngân sách FPS.
