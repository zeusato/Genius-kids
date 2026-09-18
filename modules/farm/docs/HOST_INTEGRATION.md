# Ghép Làng Mầm vào Genius Kids — 18/09/2026

Đại ca đã yêu cầu ghép module vào app chính. Yêu cầu này thay thế giới hạn không ghép route/menu trước đây; vẫn giữ module và sân thử độc lập để phát triển.

## Điểm vào

- Games → **Làng Mầm**, item thứ hai sau Board games, có ở mọi cấp lớp. `?play=farm` cũng chuyển về route chuẩn.
- Route `/Genius-kids/games/farm`, lazy-load qua `games/Farm/Entry.tsx`. Không nhập entry `main.tsx` hay DevLab vào app chính; không có bộ cấp tiền/Home 25 trong game thật.
- Game toàn màn hình, nút mũi tên trong header quay về Games; nhạc nền app tạm ngừng trên route farm. Không ghép điểm/xu farm vào hệ thống sao của học sinh.
- Tải lại/đi về từ OAuth: giữ hồ sơ của tab trong sessionStorage, chỉ chọn lại nếu ID còn tồn tại. Link mở ở tab chưa chọn hồ sơ hiện màn chọn hồ sơ có tranh. Không dùng ProtectedRoute vì nó chuyển về Home trước khi danh sách hồ sơ được tải và làm mất OAuth callback.
- CSS farm được giới hạn theo class, bỏ reset global `*`/`body`; margin riêng của sân thử đặt ở HTML standalone. Font FarmNunito riêng. Header có nút quay lại gọn ở màn hình nhỏ.

## Bản lưu và tài khoản

- Khách trong app chính: `lang-mam-profile-v1-<encoded profile id>`; mỗi hồ sơ một vườn. Standalone giữ `lang-mam-independent-lab-v1`; cloud cache vẫn theo Supabase user ID.
- Khi liên kết tài khoản lần đầu, chỉ lấy guest save của hồ sơ đang mở. Không tự upload; lựa chọn local/cloud giữ như module trước. Khi đã đăng nhập Google/email, nông trại thuộc tài khoản đó (một tài khoản, một vườn), không biến mỗi hồ sơ local thành một tài khoản Supabase.
- Các origin/cổng khác nhau không chia sẻ IndexedDB. Muốn mang vườn cũ từ `127.0.0.1:4328` sang app chính: xuất JSON ở bản cũ, nhập qua Cài đặt và sao lưu ở vườn đích, xem rồi xác nhận. Không tự đọc/xóa dữ liệu origin khác.
- Frontend host dùng public `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`; standalone ưu tiên hai biến `FARM_LAB_*`. Không nhúng DATABASE_URL hay Google client secret.
- Supabase client của app chính không nhận callback tại `/games/farm`; client farm dùng PKCE và storage key riêng để không tranh đổi code.
- Đã thêm redirect allowlist thật qua Chrome cho `/Genius-kids/games/farm` trên `http://127.0.0.1:3000`, `http://localhost:3000`, `http://127.0.0.1:3001` và `https://zeusato.github.io`. Giữ callback sân thử 4328 và Site URL có trước; không dùng wildcard.
- Google provider vẫn chưa bật: đang chờ chấp thuận chính sách Google ở onboarding. Chi tiết [ACCOUNT_SYNC](ACCOUNT_SYNC.md). Không coi việc ghép game là đã nghiệm thu OAuth.

## Tranh đại diện

- Built-in **imagegen**, không dùng API/CLI fallback. Ảnh đã xem và xuất WebP 800×450 (146.294 byte) + 400×225 (37.146 byte), srcset dùng theo menu hiện có.
- File dùng trong app: `public/hub/art/farm.webp`, `public/hub/art/farm-sm.webp`. Ảnh gốc giữ trong thư mục generated_images của Codex; app không phụ thuộc đường dẫn đó.
- Prompt đầy đủ tại [farm-cover-prompt.txt](farm-cover-prompt.txt). Chủ thể nhà mái ngói, cối xay, luống rau và hồ; màu ấm, tranh vẽ tay, không chữ. Dùng cả trong thẻ Games và màn chọn hồ sơ của route farm.

## Kiểm chứng

- Typecheck host và module đạt. 14/14 kiểm tra catalog; 20/20 kiểm tra host-save/online/Google đạt.
- Production build host + PWA đạt, farm tải thành chunk riêng. Các cảnh báo bundle lớn, font URL hub và Tailwind quét chuỗi config có trước còn tồn tại; không sửa ngoài phạm vi.
- Chrome trên `http://127.0.0.1:3001/Genius-kids/`: tạo hồ sơ QA riêng, thấy Board games đầu tiên/Làng Mầm thứ hai, ảnh bìa tải đúng; bấm từ menu vào game thật, thấy Home 1, 180 xu, kho 0/280. Reload giữ đúng địa hình và trạng thái. Không tác động bản lưu tại cổng 4328.
- Chưa xác nhận thiết bị mobile thật, đăng nhập Google hoặc đồng bộ hai thiết bị thật. Thao tác tự động trong canvas/game gặp timeout CDP; không dùng kết quả build thay cho nghiệm thu đầy đủ tương tác.
- Dev server kiểm tra ở cổng 3001 vì 3000 trả trang 404 của dịch vụ khác. Không đổi port mặc định dự án, không deploy/push.
