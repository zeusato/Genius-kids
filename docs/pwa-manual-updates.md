# Cập nhật chủ động và tải offline

## Cách dùng

Tại màn hình chọn học sinh, bấm **Cập nhật** ở góc trên trái:

1. **Kiểm tra cập nhật** đọc `version.json` trực tiếp từ máy chủ, bỏ qua HTTP cache. Có bản mới sẽ hiện mã build và nút **Tải bản mới**.
2. **Tải bản mới** yêu cầu trình duyệt kiểm tra service worker ngay, hiển thị số tệp thực sự đã lưu. Tệp có cùng revision được tái sử dụng.
3. **Áp dụng và tải lại** chỉ khả dụng sau khi worker mới cài đặt thành công. Chỉ reload khi đúng phiên bản đã nắm quyền điều khiển; không có phần trăm giả hoặc reload bắt buộc sau 4 giây.
4. **Tải toàn bộ nội dung offline** tải phần còn thiếu của bộ nội dung đi kèm bản build. Có tạm dừng và tải tiếp; mở lại app sẽ kiểm tra Cache Storage để phục hồi tiến trình.

Đóng bảng cập nhật không hủy tải. Đóng app hoặc để hệ điều hành đình chỉ app có thể ngắt tải; khi mở lại, bấm tải tiếp. AI, dịch vụ trực tuyến và tài nguyên ngoài bản build vẫn cần mạng. Việc cài biểu tượng PWA lên màn hình chính độc lập với tải nội dung offline.

## Cấu trúc

- `vite.config.ts`: dùng `injectManifest`; sinh mã build thống nhất cho JS, worker và `version.json`. Manifest có revision, SHA-256 integrity và dung lượng chưa nén. `version.json` không nằm trong cache ứng dụng.
- `pwa/sw.ts`: chỉ cài trước JS, CSS, HTML, font, icon và logo. Media nằm trong cùng manifest có revision, tải khi sử dụng hoặc theo nút tải toàn bộ. Giữ namespace cache Workbox để dùng lại dữ liệu từ phiên bản trước.
- `pwa/download.ts`: tối đa 4 tệp đồng thời; mỗi tệp có thời hạn 60 giây. Kiểm tra HTTP, nội dung sai kiểu và integrity; chỉ tăng tiến trình sau khi `cache.put` thành công. Retry bỏ qua tệp đã lưu đúng revision. Tệp lỗi không làm mất cache bản đang chạy.
- `services/updateService.ts`: trạng thái dùng chung, kiểm tra thủ công, kiểm tra nhẹ lúc mở app/trở lại tab/có mạng và mỗi giờ; đăng ký một lần, hỗ trợ nhiều tab. Trình duyệt vẫn có quyền tự kiểm tra worker theo vòng đời PWA; giao diện theo dõi cả đợt cài đặt tự động đó.
- `src/components/UpdateNotification.tsx`: hai phần riêng cho cập nhật ứng dụng và nội dung offline; hiển thị mã bản đang mở để test production, hỗ trợ bàn phím và đóng/mở lại khi đang tải.

Phần trăm tính theo số tệp đã lưu, bao gồm tệp dùng lại. MB là tổng dung lượng nội dung đã lưu theo manifest, không phải số byte truyền qua mạng có nén. Chỉ báo đủ offline sau khi mọi tệp của manifest hiện tại đã có trong cache. Trình duyệt/người dùng vẫn có thể xóa bộ nhớ; mở bảng sẽ kiểm tra lại. `navigator.storage.persist()` là yêu cầu lưu bền vững theo khả năng trình duyệt, không phải cam kết giữ cache vĩnh viễn.

Khi kích hoạt thành công, Workbox dọn revision cũ. Các tab đang mở không bị ép reload; tab dùng code cũ nên áp dụng bản mới trước khi tiếp tục chuyển sang màn hình chưa mở. Không đụng tới hồ sơ học sinh, IndexedDB hoặc localStorage của ứng dụng.

## Triển khai

Build/deploy toàn bộ `dist` như workflow GitHub Pages hiện có, gồm `sw.js`, `version.json` và các tài nguyên. Không triển khai riêng `sw.js` trước các tệp của nó. Integrity sẽ từ chối tài nguyên khác phiên bản nếu đợt triển khai đang dở hoặc CDN chưa đồng nhất; người dùng có thể thử lại.

Người đang dùng bản cũ cần nhận bản chuyển đổi này một lần qua hộp cập nhật cũ; worker mới vẫn nhận lệnh `SKIP_WAITING` của Workbox. Từ lần sau dùng nút kiểm tra/tải ngay. Bản build hiện tại giảm phần bắt buộc trước kích hoạt từ bộ nội dung khoảng 74,4 MiB xuống khoảng 8,4 MiB; đây là dung lượng chưa nén, không phải phép đo thời gian tải trên production.

PWA tắt trong `vite dev`; kiểm thử bằng production build và preview qua localhost hoặc HTTPS.

## Kiểm chứng

- TypeScript `--noEmit`: qua.
- Toàn bộ **701 test / 52 file**: qua với `vitest run --maxWorkers=2`. Lần chạy mặc định có một test mô phỏng rival MathRacing vượt timeout khi máy chạy đồng thời nhiều tác vụ; chạy lại toàn bộ với 2 worker qua, không sửa test game.
- 18 test PWA trên mã cuối: kiểm tra nhẹ không tự tải, khởi tạo một lần, cache revision, tải tiếp, HTTP lỗi, HTML trả sai, quota, giới hạn song song, cài đặt lỗi, chỉ ready sau installed, kích hoạt đúng phiên bản, timeout không reload và từ chối bản waiting cũ. Test bổ sung sau lần chạy toàn bộ xác nhận CDN phục vụ worker cũ hơn metadata sẽ hiện lỗi có thể thử lại, không kẹt ở trạng thái đang tải.
- Browser trên server thử nghiệm phục vụ các bản build liên tiếp: nâng cấp từ worker cũ; báo có bản mới sau một request `version.json`; tải bị HTTP 503 rồi tải tiếp thành công; tiến trình thực; kích hoạt và hiện toast thành công đúng mã bản.
- Tải offline: tạm dừng tại 538/570 tệp trên bản trung gian; reload vẫn giữ 538 tệp; tiếp tục tới 570/570. Khi server thử nghiệm trả 503 cho toàn bộ request, reload vẫn mở được màn hình chính và bảng nội dung đã lưu.

- Cài mới trên origin riêng: tự tải đúng 218 tệp ứng dụng; tải toàn bộ hoàn tất **568/568 tệp**, mọi entry có integrity và byteSize. Đã xem giao diện thực tế trên trình duyệt.

Chưa kiểm thử trên thiết bị iOS/Android thật hoặc mạng production. Bản trung gian có 2 entry icon lặp do Vite bổ sung tự động; bản cuối loại trùng để số tệp phản ánh danh sách duy nhất.
