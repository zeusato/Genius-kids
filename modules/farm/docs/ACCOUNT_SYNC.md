# Tài khoản và bản lưu Supabase — 18/09/2026

## Cập nhật Google OAuth trên production — 18/09/2026, 21 giờ (UTC+7)

Trạng thái này thay thế ghi chép onboarding/provider chưa bật ở phần lịch sử bên dưới.

- Production được Đại ca xác nhận là **GitHub Pages**, không phải Vercel: `https://zeusato.github.io/Genius-kids/games/farm`.
- IAM Google Cloud xác nhận `zeusato@gmail.com` có vai trò **Owner** của **Lang Mam**, project ID `peerless-rite-509010-f5`.
- Đại ca đã xác nhận chấp thuận Google API Services: User Data Policy, tạo OAuth client và chuyển ID/secret sang Supabase. Đã hoàn tất onboarding tên **Làng Mầm**, đối tượng External, email hỗ trợ/liên hệ là tài khoản Owner.
- Đã tạo Web application client **Lang Mam Web**, origin `https://zeusato.github.io`, redirect URI `https://vdgfgdvnjmlumxmbzivy.supabase.co/auth/v1/callback`. Không tạo project trùng.
- Đã nhập Client ID/Secret vào Supabase project `vdgfgdvnjmlumxmbzivy`, lưu thành công và xác nhận Google **Enabled**. Giữ tắt Skip nonce checks và Allow users without an email. Không lưu secret trong repository, tài liệu hay đầu ra công cụ.
- Redirect allowlist đã có chính xác URL farm trên GitHub Pages. Site URL vẫn là `http://localhost:3000`; lượt này không đổi cấu hình đó.
- Chrome ban đầu giữ bản PWA cũ; đã kích hoạt bản cập nhật có sẵn bằng giao diện ứng dụng. Bản mới có Games → Làng Mầm và form Google.
- Đã kiểm luồng thật: nút Google → chọn `zeusato@gmail.com` → consent chỉ tên/ảnh/email → quay về đúng route farm → hiển thị tài khoản và **Chọn nông trại**. Reload vẫn giữ phiên và hiện **Liên kết nông trại**.
- Chưa bấm liên kết/upload vườn thật, chưa kiểm đồng bộ hai thiết bị. Google Audience còn **Testing**, chưa publish ứng dụng hoặc nghiệm thu tài khoản Google khác. SMTP/email vẫn chưa nghiệm thu.

## Phạm vi đã được Đại ca duyệt

**Bổ sung tích hợp:** Đại ca đã yêu cầu ghép game vào app chính. [HOST_INTEGRATION](HOST_INTEGRATION.md) là nguồn hiện hành cho route `/games/farm`, guest save theo hồ sơ, public env của host và callback mới. Giới hạn chưa ghép route/profile trong đoạn lịch sử dưới đây đã được thay thế.

Dùng **project Supabase hiện tại** cho đăng nhập và lưu nông trại. Đại ca đã cấp `DATABASE_URL` trong env và cho phép chạy SQL tạo bảng/quyền cần thiết. Chợ người chơi, viếng thăm, kinh tế được server xác thực, tích hợp route/profile của ứng dụng chính vẫn để sau. Quyết định này thay thế phần “chưa bật Auth/Supabase” trong các kế hoạch cũ; module vẫn độc lập.

## Đã triển khai trong mã

- Google là lựa chọn chính: **Tiếp tục với Google**, email/mật khẩu thu gọn phía dưới. Chỉ yêu cầu `openid email profile`, chọn tài khoản qua Google và quay về đúng origin/path của module bằng PKCE. Không cần tạo mật khẩu game. Kiểm tra provider đã bật trước khi chuyển trang; lỗi callback hiển thị thông báo cố định, không phản chiếu nội dung lỗi ngoài vào giao diện.
- Email/mật khẩu: đăng ký, đăng nhập, xác nhận email qua Supabase, gửi thư lấy lại mật khẩu và đặt mật khẩu mới. Không lưu mật khẩu trong bảng farm.
- Cửa sổ tài khoản trong cài đặt; nút trạng thái trên đầu màn chơi. Không thêm sidebar. Dùng lại tranh trang trí của game.
- Vườn khách vẫn ở `lang-mam-independent-lab-v1`. Mỗi tài khoản có IndexedDB `lang-mam-account-v1-<user-id>` và session Auth riêng `lang-mam-auth-v1`, không dùng session của ứng dụng chính.
- Lần đầu đăng nhập trên máy: sao chép vườn khách sang cache tài khoản, **không xóa vườn khách, không tự upload**. Người chơi chọn liên kết bản trên máy hoặc dùng bản trên tài khoản. Đăng xuất trở về vườn khách, đăng nhập lại dùng đúng cache tài khoản.
- Mỗi thao tác được lưu vào máy trước. Hàng chờ upload nằm cùng transaction với save, giữ request ID/payload qua đóng tab, reload và mất mạng. Tự gửi sau thao tác khoảng 3 giây; kiểm tra định kỳ 30 giây, backoff khi lỗi. Có nút đồng bộ ngay; thử lại khi có mạng/trở về tab.
- Checkpoint thời gian không tự đánh dấu có thao tác mới. Hai thiết bị đứng chờ không tạo xung đột giả. Giờ cây/công trình vẫn được tính từ timestamp của snapshot khi mở lại.
- Cloud có revision riêng. RPC so sánh revision nguyên tử; retry cùng request không ghi hai lần. Hai bản đã thay đổi phải chọn bản giữ, không cộng tiền/hàng của hai bản. Có bản sao trước thay thế trong máy; server giữ thêm snapshot trước lần ghi gần nhất.
- `?lab=qa`, `?lab=mobile` và các xưởng không mở phiên online. Không đưa save trưng bày lên cloud.

## Tệp chính

- `src/online/google.ts`: redirect, OAuth và thông báo callback; `tests/google-auth.check.ts`: 5 kiểm tra redirect/provider/scopes/lỗi.
- `src/online/client.ts`: client Supabase riêng, transport đọc/RPC có timeout, kiểm owner và validate snapshot tải về.
- `src/online/repository.ts`: cache/outbox bền vững, CAS IndexedDB, bản phục hồi.
- `src/online/session.ts`: điều phối local/cloud và xử lý xung đột; `FarmApp.tsx` quản lý vòng đời theo tài khoản.
- `src/online/AccountPanel.tsx`: form và lựa chọn bản lưu.
- `supabase/migrations/202609180001_farm_cloud.sql`: `farm_cloud_saves`, `farm_cloud_receipts`, RLS, `farm_write_save`.
- `supabase/migrate.mjs`: migration theo checksum, transaction, không in bí mật. `verify.mjs`: kiểm DB trong transaction rồi rollback cả tài khoản/snapshot thử. `public-check.mjs`: kiểm cùng project, cấu hình Auth công khai và quyền đọc ẩn danh.

## Cấu hình và triển khai

`.env.local` của module đã được tạo từ URL/anon key của project hiện tại; tệp bị gitignore. Mẫu chia sẻ là `.env.example`. Chỉ hai biến `FARM_LAB_SUPABASE_URL` và `FARM_LAB_SUPABASE_PUBLISHABLE_KEY` được dùng phía trình duyệt. `DATABASE_URL` chỉ đọc bởi công cụ Node, không được đặt prefix `FARM_LAB_` hoặc `VITE_`.

Chạy từ root dự án:

```powershell
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install --prefix modules/farm/supabase --ignore-scripts --no-audit --no-fund
node modules/farm/supabase/migrate.mjs
node modules/farm/supabase/verify.mjs
node modules/farm/supabase/verify.mjs --local
node modules/farm/supabase/public-check.mjs
```

Công cụ đọc `DATABASE_URL` ở root `.env`/`.env.local` hoặc module `.env`/`.env.local`. Password có ký tự đặc biệt phải URL-encode. TLS kiểm chứng certificate; không tắt kiểm chứng khi gặp lỗi chứng chỉ. Driver nằm ở package riêng `modules/farm/supabase`, không sửa package của ứng dụng chính.

Nếu host trực tiếp `db.<ref>.supabase.co` chỉ có IPv6 mà máy không có đường IPv6, dùng **Connect → Session pooler**, cổng 5432. Lấy đúng chuỗi từ dashboard, không tự đoán region/host. [Tài liệu Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Auth → URL Configuration **đã thêm** `http://127.0.0.1:4328/` qua Chrome, giữ Site URL sẵn có `http://localhost:3000`. Khi triển khai thật cần thêm URL module thật. Với luồng PKCE, mở link xác nhận/đổi mật khẩu trên trình duyệt đã yêu cầu link. Đặt SMTP của project trước khi mở đăng ký rộng rãi. Không tự tắt email confirmation. [Email/password](https://supabase.com/docs/guides/auth/passwords), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

Bổ sung sau ghép host: đã thêm chính xác `/Genius-kids/games/farm` cho `http://127.0.0.1:3000`, `http://localhost:3000`, `http://127.0.0.1:3001` và `https://zeusato.github.io`. Không thay Site URL hay bật Google provider; bước chính sách Google vẫn chờ xác nhận.

## Google OAuth — trạng thái thiết lập 18/09

- Đại ca yêu cầu cấu hình Google trực tiếp trên Chrome và đã xác nhận tạo project mới **Lang Mam**, ID `peerless-rite-509010-f5`. Project đã tạo; không bật billing. Không chỉnh OAuth của project Google có trước.
- Đã điền onboarding Google Auth: tên ứng dụng **Làng Mầm**, đối tượng External, email hỗ trợ/liên hệ theo tài khoản Google đang mở. Đang chờ Đại ca xác nhận riêng checkbox **Google API Services: User Data Policy**. Chưa tạo OAuth client, chưa bật Google provider trên Supabase; không coi đăng nhập Google đã hoạt động.
- Callback cần đặt khi tạo Web client: `https://vdgfgdvnjmlumxmbzivy.supabase.co/auth/v1/callback`. Origin local: `http://127.0.0.1:4328`. Client secret chỉ nhập vào Supabase Auth → Google, tuyệt đối không đưa vào env frontend hoặc repository.
- Sau tạo client cần kiểm tra audience/testing, identity scopes, lưu ID/secret vào Supabase rồi kiểm redirect từ game. Chưa thực hiện đăng nhập thật hoặc đồng bộ hai thiết bị bằng Google.
- TypeScript và production build đạt; nhóm Google + online **17/17** đạt. Đã kiểm giao diện Google button qua Chrome. Build còn cảnh báo bundle lớn vốn có.
- Tham chiếu: [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google), [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy).

## An toàn và giới hạn

- RLS chỉ cho người đã đăng nhập đọc hàng của mình. Không cấp quyền ghi trực tiếp. Hàm SECURITY DEFINER có search_path rỗng, kiểm auth.uid trùng p_owner để tránh đổi tài khoản trong lúc request đang gửi. Anon không có quyền đọc/ghi farm.
- Bản lưu này vẫn mang `economy: local-unverified`; client/offline và backup nhập tay không phải nguồn tiền/hàng tin cậy cho trading. Khi làm chợ phải có sổ giao dịch/kho online do server kiểm chứng riêng.
- Mỗi tài khoản có một nông trại. Không merge hai tiến trình; mỗi cache giữ một bản trước thay thế, server giữ một bản trước lần ghi mới nhất. Cache còn trên máy sau đăng xuất: đây không phải chế độ xóa dữ liệu máy dùng chung.
- Công cụ DB không quản lý dashboard Auth/SMTP/redirect allowlist. Kiểm tra đăng ký/xác nhận/đổi mật khẩu bằng hộp thư thật vẫn cần thực hiện trước phát hành.

## Kiểm chứng / việc còn lại

- TypeScript đạt. Build production đạt (còn cảnh báo bundle lớn vốn có; thêm Supabase/Auth vào bundle).
- 12 bài thử mới về liên kết chủ động, checkpoint, offline/retry sau reload, thay đổi trong lúc upload, hai thiết bị, CAS, backup, tách account và snapshot hỏng đều đạt.
- Chạy lại nhóm sync/persistence/migration sau hoàn thiện: 21/21 đạt. SQL đã thực thi trong PostgreSQL nhúng PGlite: **16/16** kiểm chứng đạt (RLS, giả mạo owner, ghi trực tiếp/anon bị chặn, CAS, retry, payload hỏng, bản trước). Đây là kiểm chứng local, chưa phải triển khai Supabase.
- Full suite: 113/114 đạt; 1 bài geometry cũ vượt timeout 5 giây khi chạy đồng thời build. Chạy lại riêng toàn bộ landscape với timeout 20 giây: 10/10 đạt, không sửa logic địa hình. Chín lượt chơi Home 25 đã đạt trong full suite.
- Đã xem trực tiếp form đăng nhập/đăng ký/quên mật khẩu; không gửi email hoặc dùng tài khoản thật để thử. Vườn khách có trước vẫn hiện Home 3 và 143 xu.
- Ảnh giao diện: [account-login.png](screenshots/art-pass-2026-09-18/account-login.png). Chưa nghiệm thu email callback trên hai thiết bị thật.
- API Auth hiện tại trả 200; email login và đăng ký bật, email confirmation bật. Cấu hình DB và browser trỏ cùng project.
- **Đã áp migration trên Supabase thật qua Chrome SQL Editor**, theo yêu cầu mới của Đại ca. Project `Genius-kids`, ref `vdgfgdvnjmlumxmbzivy`; ledger ghi `202609180001_farm_cloud` lúc `2026-09-18 10:23:29.35+00`. `supabase/deploy-dashboard.sql` lưu nguyên bản SQL đã chạy, gồm checksum ledger và notify PostgREST reload schema.
- **16/16 kiểm tra database thật đạt** bằng `supabase/verify-dashboard.sql`: first write, retry, thay payload cùng ID, stale revision, owner guard, schema, direct update, receipt read, update hợp lệ, receipt cũ, RLS chéo tài khoản, lưu account thứ hai, cấm ghi chéo, cấm anon đọc/ghi, giữ snapshot trước. Tất cả dùng transaction rollback, không tạo tài khoản thật hay gửi email.
- Post-check sau rollback: `farm_saves=0`, `receipts=0`, `test_users_remaining=0`, `all_rls_enabled=true`, `migration_recorded=1`. Ba bảng mới có RLS, không đụng dữ liệu ứng dụng chính.
- DATABASE_URL trực tiếp vẫn vướng IPv6 trên máy này; **không còn chặn triển khai** vì đã chạy qua dashboard. Chỉ cần Session pooler nếu muốn dùng CLI migration/verify từ máy này về sau.
- SMTP Settings trên dashboard đang **chưa bật custom SMTP**. Chưa có thông tin nhà cung cấp gửi mail để cấu hình. Chưa kiểm tra xác nhận email/đổi mật khẩu và chuyển thiết bị bằng tài khoản người chơi thật; cần hoàn tất phần email trước khi mở đăng ký rộng rãi.

Database đã triển khai và kiểm thử trực tiếp; không đánh đồng kết quả này với nghiệm thu toàn bộ luồng email và trải nghiệm hai thiết bị thật.
