# Hồ sơ Google và đồng bộ Supabase

Triển khai ngày 04/10/2026. Google là tuỳ chọn ở màn chọn học sinh. Khách vẫn dùng `math_profiles` và các kho cục bộ hiện có.

## Dữ liệu được lưu

- Toàn bộ `StudentProfile`: thông tin học sinh, Học bài/Ôn luyện, lịch sử bài làm, sao, thành tích, bộ sưu tập, avatar, giao diện, đọc sách, trò chơi, Mầm non, tiếng Anh và các trường tiến trình khác.
- Các bản nháp và tuỳ chọn theo ID học sinh trong localStorage: cờ, Sudoku, Đố vui, Trí nhớ, Âm thanh, Lập trình, Đua xe, Rồng, Tốc độ, Bánh răng, Cá ngựa, Thành phố; sổ khám phá Vì sao, tế bào, tiến hoá, nguyên tố, hành tinh.
- IndexedDB: bài tiếng Anh đang làm/thư viện/nội dung AI đã tạo; sổ điện học và ảnh; Xưởng hành tinh (giữ nguyên typed arrays); bản Làng Mầm gắn với từng profile.
- Không gửi API key Gemini, token đăng nhập, cài đặt thiết bị, cache nội dung dùng chung, bản Làng Mầm độc lập hoặc bản Làng Mầm online vốn thuộc cơ chế tài khoản riêng của module đó.

Giới hạn mỗi bản cloud là 20 MiB/100 hồ sơ. Bản vượt dung lượng tiếp tục ở trên máy và báo lỗi đồng bộ; không cắt bỏ tiến trình để gửi. Cấu trúc sidecar được liệt kê ở `services/account/snapshot.ts`; khi một module thêm kho theo học sinh, bổ sung adapter và kiểm thử round trip ở đây.

## Luồng dữ liệu

`AccountProvider` giữ một Web Lock cho workspace. Tab khác chờ, tránh đổi tài khoản khi tab cũ còn ghi tiến trình. Khi đổi tài khoản hoặc chọn bản cloud, ứng dụng học được unmount trước khi thay kho. Guest và mỗi user ID có vault riêng trong IndexedDB `genius-profile-cloud-v1`; marker `genius-profile-switch-v1` khôi phục lần đổi dở dang nếu đóng tab hoặc hết dung lượng. Các kho gốc vẫn được dùng để chơi offline.

Trình duyệt không có Web Locks (ví dụ bản thử qua HTTP LAN) vẫn dùng được workspace khách; đăng nhập/switch cloud cần HTTPS và trình duyệt hiện đại.

Lần đăng nhập vào tài khoản trống sẽ cho **Nhập hồ sơ trên máy vào tài khoản**. Hồ sơ khách vẫn được giữ riêng. Tài khoản đã có dữ liệu sẽ tải bản của tài khoản, không tự gộp sao hay hồ sơ khách. Đăng xuất trả lại hồ sơ khách. Thay đổi chưa gửi được vẫn ở vault của tài khoản và sẽ gửi khi đăng nhập lại.

Đồng bộ khi hồ sơ chính được lưu, khi có mạng/trở lại tab/ẩn tab, và mỗi 15 giây cho các kho game độc lập. Kiểm tra bản remote không đổi chỉ tải revision; chỉ tải cả bundle khi mở tài khoản hoặc giải quyết xung đột. Đóng trình duyệt trước khi upload xong có thể khiến thiết bị khác chưa thấy cập nhật; bản trên máy được kiểm tra lại ở lần mở tiếp theo.

Mỗi request có UUID và revision dự kiến, được ghi xuống vault trước khi gửi. Mất phản hồi thì gửi lại đúng request; server không tăng revision lần nữa. Khi thiết bị khác có thay đổi, người dùng chọn bản máy hoặc tài khoản. Bản còn lại được giữ trong `backup` và tải được bằng **Tải bản hồ sơ dự phòng**. Đây là snapshot đầy đủ cùng định dạng version 1; khôi phục kỹ thuật dùng `restoreSnapshot` khi ứng dụng đã unmount, sau khi giữ bản hiện tại.

## Supabase đã cấu hình

Project `vdgfgdvnjmlumxmbzivy`:

- Migration `supabase/migrations/202610040001_profile_cloud.sql` đã chạy bằng SQL Editor trên Chrome.
- `profile_cloud_saves`: một dòng/user; RLS chỉ cho owner đọc. `anon` không đọc/ghi; `authenticated` không ghi trực tiếp.
- RPC `save_profile_bundle`: kiểm tra `auth.uid()`, version/dung lượng, khoá giao dịch, CAS revision, retry idempotent; giữ thêm `previous_payload`.
- Google provider dùng cấu hình sẵn có. Bổ sung đúng ba callback (không wildcard): `https://zeusato.github.io/Genius-kids/`, `http://127.0.0.1:3000/Genius-kids/`, `http://localhost:3000/Genius-kids/`. Các callback Làng Mầm và Site URL cũ được giữ nguyên.
- Main app dùng PKCE và session mặc định của Supabase. Route `/games/farm` dành callback cho client riêng `lang-mam-auth-v1` của Làng Mầm.

Frontend cần `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (nhận cả publishable key). Không dùng service-role key. `.env.local` trên máy này đã được cấu hình bằng public key của project và nằm trong gitignore. GitHub Pages workflow đã truyền hai biến từ repository secrets.

## Kiểm tra

- Kiểm thử service dùng fake IndexedDB: toàn bộ profile, chuyển hồ sơ cũ không mất trường dữ liệu, binary terrain/Blob, sidecar, chặn dữ liệu sai owner, đổi guest/A/B, nhập có chủ đích, offline/reload, mất response, xung đột, xoá profile, phục hồi journal, giữ backup qua reload.
- `supabase/verify-profile-cloud.sql`: 14 kiểm tra đạt trên database thật, dùng fixture trong một transaction và ROLLBACK; không thay đổi hồ sơ thật. Ảnh `supabase-checks.png`.
- Chrome: đăng nhập Google thật từ Home, callback thành công, tải trạng thái tài khoản và chạy Đồng bộ ngay; đăng xuất trở về khách. Không thêm profile thử lên tài khoản thật.
- Suite toàn repo: **3.726/3.726 test, 120/120 file đạt**, chạy `node node_modules/vitest/vitest.mjs run --maxWorkers=2 --testTimeout=60000`. Giới hạn worker tránh timeout do nhiều bài tính toán nặng tranh CPU cùng lúc.
- Production build thành công. TypeScript còn lỗi có sẵn `modules/farm/src/ui/renderSnapshot.ts:26` (`object[]` không khớp `Obstacle[]`); phần đồng bộ không thêm lỗi TypeScript.

Chưa push hoặc deploy frontend. Schema/redirect trên Supabase đã có hiệu lực; giao diện mới xuất hiện trên website sau khi đại ca xuất bản nhánh chứa thay đổi.
