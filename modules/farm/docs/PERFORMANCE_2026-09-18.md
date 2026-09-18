# Hiệu năng và độ nét — 18/09/2026

Đại ca phản ánh giật trên **Android / Chrome**. Google đăng nhập đã thành công; lượt này sửa renderer và đóng gói ảnh, không sửa Auth, gameplay, save schema hoặc dữ liệu production. Thay đổi ở workspace, **chưa deploy GitHub Pages**.

## Nguyên nhân đã xác định

- `useFarm` lấy snapshot deep clone mỗi giây. Tham chiếu heights/water/obstacles luôn mới làm các memo geometry và instance batches bị vô hiệu dù địa hình không đổi.
- Toàn bộ địa hình được dựng; cây/đá/cỏ của cả bản đồ cũng được đưa vào scene bên dưới fog. Sương là lớp che sau cùng, không phải cơ chế tải/vẽ theo vùng.
- Một Suspense ngoài cùng bao toàn scene khiến ảnh tải nối tiếp có thể hủy lần render chưa commit và dựng lại địa hình. Bộ đếm QA từng ghi 9 lần dựng trong quá trình tải; sau khi tách boundary, reload ổn định ghi 1 và không tăng theo tick.
- Pointer move dò giao điểm toàn scene ngay cả khi người chơi chỉ kéo camera.
- Cửa sổ rộng dưới 760 px mặc định light, giới hạn DPR 1; đây là heuristic kích thước, không phải đo hiệu năng. Canvas 1× dễ mềm trên điện thoại có mật độ điểm ảnh cao.
- 21 ảnh đang dùng chiếm 36.528.016 byte PNG. Host PWA còn precache toàn bộ assets theo cấu hình hiện tại; fog không ngăn việc precache ảnh.

## Thay đổi

- `ui/renderSnapshot.ts` chia sẻ tham chiếu world không đổi ở ranh giới UI bằng so sánh nội dung, giữ nguyên cách ly snapshot của gateway. Import cùng seed nhưng dữ liệu khác vẫn cập nhật đúng.
- Memo landscape theo heights, water, seed, version và vị trí cầu được generator sử dụng. Shore reeds/buildings cập nhật lại khi dữ liệu liên quan thay đổi.
- Bỏ dựng cây/đá/cỏ nằm xa vùng đã mở hơn 24 đơn vị; giữ dải đệm cho mép sương, tán cây và mở khu tiếp theo. Không xóa tài nguyên khỏi world/save. Cỏ được lọc sau tạo layout để giữ vị trí và màu khi mở thêm đất.
- Fog bỏ tính khoảng cách tới khu chưa mở; tái sử dụng mảng uniform. Vùng sâu trong sương che kín hoàn toàn thay vì alpha 0,985. Khôi phục save nhỏ hơn đóng fog ngay để không thấy khoảng trống khi scenery bị gỡ.
- Tách Suspense cho crop/road/bird khỏi địa hình. Chưa có đường và không đặt đường thì không mount renderer đường hoặc tải texture của nó qua renderer này.
- Khi kéo camera không raycast địa hình/cây; đặt đồ và quét luống vẫn giữ picking.
- Mặc định ánh sáng mềm trên mọi kích thước, lưu lựa chọn đồ họa riêng trong localStorage. Hai chế độ dùng cùng DPR `[1, 1.5]`; light tắt bóng mà không hạ riêng DPR xuống 1. Không tăng độ phân giải vượt mức soft cũ.
- Runtime dùng 21 WebP lossless, giữ PNG gốc làm nguồn. Tổng **23.798.644 byte**, giảm **34,8% / 12.729.372 byte**. Script `scripts/optimize-textures.mjs` kiểm kích thước, alpha từng pixel và RGB mọi pixel có alpha > 0 trước khi ghi. Không resize, không đổi ảnh mỹ thuật. Giảm tải mạng/dung lượng cache; không tuyên bố giảm tương ứng VRAM hay tăng FPS.
- FrameMeter chỉ trong QA/dev thêm max frame time, số lần dựng địa hình, thời gian dựng và DPR.

## Kiểm chứng

- Typecheck module đạt.
- 128/128 bài module đạt qua full run 127 bài và rerun playthrough 1 bài. Lượt full run bị chặn ghi `reports/solo-progress.json` bởi sandbox; chạy lại bài đó với quyền ghi đạt, 72,65 giây. Không phải lỗi gameplay.
- 6 bài regression mới: 60 tick giữ world reference; thay heights/water/owned/resource/bridge cùng seed vẫn cập nhật; UI không sửa được state của gateway; culling giữ mép sương và bản đồ mở toàn bộ; lựa chọn đồ họa lưu được và chịu được storage bị chặn.
- Build module đạt, JS 1.347,98 kB / 395,78 kB gzip. Bundle lớn vẫn còn cảnh báo; không thêm dependency.
- Build host/PWA đạt: Vite 31,26 giây, service worker 0,4 giây; precache 817 entry / 108.094,99 KiB toàn ứng dụng. Còn cảnh báo font chưa resolve ở build time, CSS selector, mixed static/dynamic imports và chunk lớn; không sửa các phần host đó.
- Chrome local, QA DB riêng: cảnh khởi đầu, cảnh 29 công trình Home 25 / 120 luống, mở khu 13 từ 4 lên 5 khu và trừ đúng 120 xu; reload giữ save và lựa chọn light; đổi lại soft. Đã xem viewport 390×844 rồi reset. Không sửa vườn production.
- Bộ đếm địa hình sau reload giữ 1 qua nhiều tick và thay cấu hình. Lỗi tạm thời `performanceMetrics is not defined` xảy ra giữa hai lần HMR khi đang thêm import; bản hoàn chỉnh đã sửa và typecheck/build đạt.

## Giới hạn còn lại

**Chưa nghiệm thu FPS Android.** Phiên Chrome điều khiển trên máy tính ghi khoảng 1 FPS / p95 khoảng 1 giây cả khi scene và bộ đếm địa hình đứng yên, checkbox giảm chuyển động tắt. Chưa xác định nguyên nhân nhịp frame này; không coi đó là bằng chứng tăng FPS hoặc đại diện cho điện thoại. Cần kiểm trên Android/Chrome thực tế sau deploy với thao tác kéo/zoom/gieo/thu hoạch và so sánh cùng thiết bị, cùng cảnh.

Địa hình vẫn là mesh toàn map; chưa chia chunk theo camera, chưa chạy generator trong worker, chưa làm LOD hoặc texture GPU nén. Culling theo fog không giảm scenery khi mở hết 36 khu. Dải đệm 24 đơn vị là lựa chọn bảo thủ cho camera/góc nhìn hiện tại. Texture lossless giữ độ nét nhưng bộ ảnh vẫn 23,8 MB. Host PWA precache và cấu hình triển khai giữ nguyên; cần cập nhật PWA khi phát hành để tránh dùng bundle cũ.
