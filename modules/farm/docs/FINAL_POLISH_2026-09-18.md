# Rà soát và làm mềm bờ nước — 18/09/2026

Đại ca yêu cầu rà một lượt, làm mượt và ưu tiên mép nước còn cứng. Đợt này chỉnh render/giao diện, không đổi bản đồ logic, giá, hạn mức, tiến trình hoặc dữ liệu lưu.

## Cảnh nước

- `landscapeGeometry.ts`: đường bờ vẫn dùng giao điểm chung của đất/nước/bờ. Tăng làm tròn contour từ 3 lên 5 lượt; bờ thấp được vát từ mặt đất tới đúng cao độ mặt nước −0,3, bỏ mép vách đứng tối. Không hạ tâm ô xây dựng, không thay ô nước hoặc cao nguyên trong save.
- Tính khoảng cách tới đoạn bờ đã làm tròn bằng bucket không gian và cache, rồi truyền thuộc tính `shoreDistance` vào mesh. Phân biệt bờ với phần nước sâu bằng khoảng cách thực tới contour thay vì màu nhị phân ở đỉnh từng ô.
- `Landscape.tsx` pha nền đất sang cát với nhiễu nhỏ ở dải bờ. Ghép đỉnh và tính normals chung ở mặt đất/nước để bỏ các tam giác sáng tối trên dốc cát; không tăng số draw calls cho lớp chuyển tiếp.
- `waterMaterial.ts`: màu cát ướt → nước nông → nước sâu; gợn nhỏ và bọt nhẹ đứt đoạn, bỏ chấm sáng lặp theo lưới. Một shader opaque, không chồng nhiều lớp transparent. Giảm chuyển động giữ shader ở thời gian 0.
- Không sinh thêm ảnh/texture trong đợt này: đây là bề mặt động cần khớp hình học, sửa shader phù hợp hơn raster.

## Giao diện

- Rà khung 390 × 844 phát hiện thanh QA che dock. `DevLab.tsx` cho thu gọn/mở công cụ, mặc định thu gọn trên màn hình nhỏ; CSS dành khoảng trống cho dock khi QA hiện. Production không có thanh QA.
- `shared.tsx` thêm `summary` vào vòng focus của popup để điều hướng bàn phím tới các túi kho thu gọn. Đóng popup trả focus không kéo trang nhảy. Dấu + đổi thành − khi mở details.
- Kho ba cột trong khung điện thoại hiển thị hình/tên/số lượng, popup giữ nút đóng và các tab trong chiều ngang.

## Kiểm chứng và giới hạn

- Landscape/roads/showcase 16/16 đạt. Sau bước ghép normals, chạy lại toàn landscape 10/10 đạt, gồm kiểm khoảng cách hữu hạn, mặt nước phẳng, bank nối đúng đất, không còn lip nổi ở bờ thấp, world v1/v2 không bị sửa, cầu/đất và save cũ.
- Typecheck đạt. Build trước chỉnh QA đạt; kết quả build cuối xem VERIFICATION. Không chạy lại toàn bộ mô phỏng kinh tế vì không đổi gameplay.
- Browser trên QA riêng `shore-polish`: xem hồ/cầu cảng, sông/cầu, toàn đảo; mở chế độ giảm chuyển động, kiểm cảnh không lỗi shader. Log error trang game trực tiếp rỗng.
- Khung mobile có một lỗi `MutationObserver.observe` khi reload iframe trong quá trình kiểm. Không có lời gọi MutationObserver trong mã module, nhưng chưa xác định nguồn nên không quy kết là lỗi công cụ hoặc khẳng định đã sửa. Kho và dock vẫn được kiểm trực tiếp bằng ảnh. Một trang khung mới không báo lỗi tại lúc đọc log, nhưng iframe chưa hiện đầy đủ trong snapshot, nên không xem đó là chứng minh lỗi không tái hiện.
- Đây là khung viewport desktop, chưa kiểm GPU/cảm ứng trên điện thoại thật. Không tuyên bố đạt 60 FPS hoặc hoàn tất nghiệm thu mỹ thuật; đồ họa vẫn theo phong cách cách điệu hiện tại.

## Ảnh

- [Hồ sau sửa](screenshots/art-pass-2026-09-18/shore-lake-final.png)
- [Sông và cầu](screenshots/art-pass-2026-09-18/shore-river.png)
- [Dock điện thoại không bị che](screenshots/art-pass-2026-09-18/mobile-dock-polish.png)
- [Kho điện thoại](screenshots/art-pass-2026-09-18/mobile-inventory-polish.png)
- `shore-before-reload.png` là cảnh trước khi tải lại shader mới; không dùng làm ảnh kết quả cuối.
