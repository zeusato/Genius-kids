# Kỳ Viên · Cờ Tướng độc lập

Game React/TypeScript chạy riêng trong `games/CoTuong/`. Có bàn 3D, bàn 2D, hai người cùng máy, bot ba mức, chọn Đỏ/Đen, lưu và tiếp tục ván. Mọi tài nguyên chạy tại máy; bot dùng Web Worker.

## Chạy từ thư mục gốc Genius-kids

```powershell
# Phát triển, thay đổi hiện ngay, không có service worker
node node_modules/vite/bin/vite.js --config games/CoTuong/vite.config.ts
# http://127.0.0.1:4317/

# Build riêng, không build ứng dụng chính
node node_modules/vite/bin/vite.js build --config games/CoTuong/vite.config.ts

# Xem bản build/PWA
node node_modules/vite/bin/vite.js preview --config games/CoTuong/vite.config.ts --host 127.0.0.1 --port 4319 --strictPort
# http://127.0.0.1:4319/

node node_modules/typescript/bin/tsc --noEmit -p games/CoTuong/tsconfig.json
node node_modules/vitest/vitest.mjs run --config games/CoTuong/vitest.config.ts
node games/CoTuong/scripts/benchmark.mjs
node games/CoTuong/scripts/benchmark.mjs --latency
```

Không cần cài dependency mới; dùng dependency sẵn có của repository. Build ở `.build/`, cache ở `.vite-cache/`, runner benchmark ở `.bench/`; đều được ignore tại thư mục game.

## Cách chơi

- Chọn đối thủ, màu quân và mức khó; Đỏ luôn đi trước.
- Chạm quân rồi chạm ô đích được đánh dấu. Kéo nhẹ để xoay bàn 3D; cuộn/pinch để thu phóng. Có nút Nghiêng, Nhìn thẳng, Lật bàn và 2D.
- Nút Chữ Hán/Tiếng Việt đổi nhãn quân; Cài đặt có âm thanh, giảm chuyển động, đồ họa nhẹ và chế độ chuyền máy.
- Bàn 2D hỗ trợ Tab vào bàn, phím mũi tên di chuyển điểm tập trung, Enter/Space chọn quân và ô đích.
- Ván lưu sau mỗi nước và mỗi giây đồng hồ. Rời tab tự tạm dừng. Về vườn rồi bấm Tiếp tục để trở lại.
- Bản build cache toàn bộ mã, worker, font và ảnh sau lần tải online thành công. Khi bản mới tải xong, thông báo có nút **Lưu ván & cập nhật**. Bản dev dùng để kiểm thử sửa đổi tức thì.

## Luật bản đầu

`gk-xiangqi-v1`: chặn chân Mã/mắt Tượng, giới hạn sông/cung, Pháo cần đúng một ngòi để ăn quân, hai Tướng không đối mặt, không đi nước tự chiếu. Chiếu bí hoặc bí nước đều thua. Không bắt Tướng như quân thường.

Một thế (gồm bên tới lượt) xuất hiện đủ ba lần: nếu đúng một bên chiếu ở mọi nước của bên đó trong chu kỳ thì bên ấy thua; trường hợp khác hòa. Có nhận thua và đồng ý hòa ở chế độ hai người. Chưa áp dụng đầy đủ luật đuổi bắt WXF, không tự hòa do số nước không ăn quân. Giới hạn 600 ply chỉ dành cho benchmark.

## Ranh giới để ghép sau

Entry giao diện: `CoTuongGame.tsx`, export mặc định:

```tsx
<CoTuongGame owner={{ id: student.id, name: student.name, avatar: student.avatar }} onExit={onBack} />
```

- Component không nhập launcher, StudentContext, profile service hay dữ liệu Cờ Vua.
- Hai phần tử `players` luôn theo màu `[Đỏ, Đen]`; `ownerSide` là màu chủ hồ sơ. `recordOf()` trả `hostResult` theo chủ hồ sơ, kể cả khi chủ cầm Đen.
- Persistence hiện dùng `co-tuong:standalone:<owner>:draft-v1|prefs|results-v1`. `clearCoTuongData(owner)` chỉ xóa dữ liệu Cờ Tướng của người đó. Kết quả idempotent theo match ID.
- Khi ghép, thay adapter persistence bằng profile service/hook xóa hồ sơ của ứng dụng; thêm launcher/catalog/lazy route và thống kê bằng hợp đồng đã có. Dùng hai ảnh cover sẵn trong `assets/art/`.
- `preview.tsx`, `vite.config.ts`, `index.html`, manifest và service worker hiện là **host độc lập**. Không đưa host/service worker này vào host chính; để PWA chính quản lý tài nguyên game sau khi tích hợp.
- Không sửa App, HomePage, package, cấu hình gốc, PWA chính hoặc Cờ Vua trong đợt triển khai này. Không triển khai lên production chung.

## Kiểm chứng và giới hạn

Xem `reports/implementation.md`, `reports/benchmark-smoke.json`, `reports/latency.json` và `assets/README.md`.

30 test đã qua, gồm perft đến depth 4, oracle search, chu kỳ lặp thực, timeout/cancel worker, replay bản lưu, kết quả chủ cầm Đen và lỗi storage. Build/PWA và chơi khi server tắt đã được kiểm tra trên trình duyệt desktop.

**Chưa nghiệm thu sức mạnh theo toàn bộ §6 của plan:** smoke gồm 16 ván với ngân sách giảm, không phải 400 ván/cặp. Mức Khó không có cam kết Elo. Chưa chạy trên thiết bị iOS/Android thật và chưa ghép hồ sơ/launcher theo yêu cầu giữ độc lập.

Runner full suite đã chuẩn bị:

```powershell
node games/CoTuong/scripts/benchmark.mjs --acceptance
```

Lệnh này dùng 200 khai cuộc đã khóa, đổi bên, 400 ván/cặp; ngân sách fixed nodes/depth không deadline nên có thể chạy rất lâu. Gồm Khó–random/greedy/depth3/Vừa và Vừa–Dễ. Lưu riêng unfinished, tỷ lệ hoàn tất và bootstrap theo cặp khai cuộc. Báo cáo latency là phép đo deadline, chưa thay thế tournament có deadline trên thiết bị mục tiêu.
