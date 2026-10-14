# Màn chọn hồ sơ và avatar — 04/10/2026

Màn chào dùng cùng Nunito, nền kem, xanh lá và minh họa với sảnh khám phá.
Câu giới thiệu mới: **Học, chơi và khám phá mỗi ngày.** Tên tab, mô tả chia sẻ và manifest PWA cũng chuyển sang Genius Kids với nội dung đa lĩnh vực.

## Thay đổi

- Hồ sơ là thao tác chính, hiển thị nhân vật, tên, cấp lớp và số sao hiện có; có trạng thái chưa có hồ sơ.
- Tạo hồ sơ trong hộp thoại: focus vào ô tên, giới hạn 50 ký tự, chặn tên trắng, chọn lớp bằng radio, gửi bằng biểu mẫu. Sau khi tạo, focus chuyển sang hồ sơ mới.
- Đăng nhập Google giữ nhận diện chính thức. Đồng bộ, nhập hồ sơ khách, tải bản dự phòng và xử lý xung đột giữ nguyên hành vi.
- Tiện ích cập nhật/offline, trợ lý AI, nhạc, âm thanh, cài ứng dụng và lối mở DevTools được giữ lại.
- 20 avatar mới tạo bằng image_gen, WebP 384 × 384; tổng 252.668 byte. Giữ nguyên ID, nhân vật, giá và quyền sở hữu. Bộ ảnh và prompt nằm tại `public/avatars/explorers/`.

## Kiểm tra

- Production build thành công; đủ 20 ảnh trong `dist` và danh sách cache offline.
- 31 kiểm thử qua: `services/profileService.test.ts`, `services/account/account.test.ts`, `src/components/hub/catalog.test.ts`.
- Trình duyệt: màn chưa có hồ sơ, tạo hồ sơ Lớp 2 và Mầm non, focus ô tên/thẻ mới, chọn hồ sơ vào đúng danh mục, tải đủ 20 avatar trong cửa hàng và giữ đúng avatar đã sở hữu.
- Kiểm tra trực quan các khung 320 px, 390 px, 768 px và màn desktop; nút Google vẫn giữ Google Sans và logo chính thức.
- `tsc --noEmit` vẫn có đúng lỗi có sẵn ở `modules/farm/src/ui/renderSnapshot.ts:26` (`object[]` không tương thích `Obstacle[]`). Không phát sinh lỗi TypeScript mới trong phần này.

Không có thay đổi schema hoặc dữ liệu tài khoản trong đợt làm lại giao diện này.
