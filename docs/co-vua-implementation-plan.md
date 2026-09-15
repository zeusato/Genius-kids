# Cờ Vua — kế hoạch triển khai và nghiệm thu

Cập nhật: **16/09/2026**. Trạng thái: **đã nâng cấp bản độc lập; chờ duyệt hình ảnh và nghiệm thu tích hợp**.

Tài liệu này thay thế plan prototype ngày 15/09. Các lỗi phát hiện và căn cứ nằm trong [bản review](co-vua-review-2026-09-15.md); kết quả thực tế nằm trong [báo cáo triển khai](co-vua-implementation-report.md).

## 1. Phạm vi đã chốt

- Hai người dùng chung thiết bị hoặc người đấu máy Dễ / Vừa / Khó.
- Chủ ván chọn cầm Trắng hoặc Đen. Players luôn được đánh chỉ số theo màu; `ownerSide` xác định kết quả của chủ.
- Không undo, không gợi ý chiến thuật. Chỉ hiện nước hợp lệ của quân đang chọn và báo chiếu.
- Chạy độc lập trong `games/CoVua/`, có entry/build/PWA riêng. **Chưa ghép launcher, profile, achievement hay PWA của ứng dụng chính.**
- Đồng bộ quy ước với Cờ Tướng: lobby, màu quân, worker token/revision/version, pause, lưu trước animation, thông báo lỗi và retry, reduced motion, chế độ nhẹ, 2D dự phòng. Hai engine giữ luật riêng.

## 2. Hướng mỹ thuật và trải nghiệm

**Phòng cờ buổi sáng**: giấy ngà, gỗ óc chó và maple, xanh lá trầm, chi tiết đồng dịu. Cờ Tướng giữ khu vườn riêng; không sao chép cảnh nền.

- Quân Staunton là mesh riêng theo sáu loại: Mã có cổ/mõm/tai/bờm; Tượng có khe mũ; Xe có răng thành; Hậu có vương miện; Vua có thập tự. Hình học gộp và instancing theo màu/loại.
- Bàn có độ dày, cạnh vát, vân gỗ, tọa độ và đường viền. Ánh sáng phải giữ chi tiết cả quân sáng lẫn quân tối.
- Camera trực giao tự tính theo kích thước vùng chơi. Hai preset nghiêng/từ trên và lật bàn; bỏ orbit tự do để giữ khả năng chạm chính xác.
- Nhấp vào chính mô hình quân phải chọn đúng quân, kể cả phần đầu nằm ngoài hình chiếu ô. Nhấp ô trống dùng tọa độ mặt bàn.
- Board không bị HUD che. Desktop có thông tin/lịch sử bên cạnh; mobile đưa thông tin xuống dưới và giữ đủ 64 ô.
- Lobby dùng ảnh bìa Flow đã có. Bìa chỉ là minh họa; nghiệm thu đồ họa dựa trên gameplay thật.
- 2D dùng SVG tự vẽ, không phụ thuộc font ký hiệu. Mỗi ô là button; hỗ trợ mũi tên, Enter, Esc, focus rõ ràng.
- Nước đi commit trước, rồi animation khoảng 340 ms. Nhập thành chuyển cả Vua và Xe; phong cấp chọn một trong bốn quân trước khi commit. Không bật màn chuyền máy che animation.
- Âm thanh tổng hợp qua một AudioContext, có tắt âm; không tải nhạc ngoài.

## 3. Luật và trạng thái

`rulesVersion = gk-chess-v2`, `Match.version = 2`.

- Bàn 64 ô, a1 = 0; quân 1..6 / 9..14. Đầy đủ di chuyển, cấm tự chiếu, nhập thành, en passant và bốn lựa chọn phong cấp.
- Chiếu bí thắng/thua; bí nước **hòa**.
- Quy ước ứng dụng: **tự động hòa ở lần lặp thứ ba / 100 nửa nước không bắt quân hoặc đi Tốt**. Ghi rõ trong Trợ giúp; không tuyên bố là toàn bộ luật giải đấu FIDE.
- Nhận biết thiếu vật chất: hai Vua, một Mã/Tượng đối đầu Vua, và chỉ các Tượng cùng màu ô. Không khẳng định nhận biết mọi thế cờ chết phức tạp.
- Khóa lặp chỉ giữ ô EP khi tồn tại nước EP hợp lệ, gồm kiểm tra Tốt bị ghim.
- Một adjudicator chung dùng cho UI và search. Checkmate/stalemate được xét trước các ngưỡng hòa.
- `applyMove` từ chối nước không hợp lệ và ván đã kết thúc; không tin nước từ caller.
- Match gồm owner/ownerSide, initialFen, history, position keys, revision, clock, terminal reason, endedAt.
- Khôi phục JSON: kiểm tra schema, quân/Vua/castling/EP; replay từng nước từ initialFen; so sánh toàn bộ thế cờ, lượt, revision, outcome và key history. Bản v1 không tương thích bị từ chối rõ ràng.
- Xin thua xác định người thật: chủ ván khi đấu máy; bên đang tới lượt khi hai người. Có xác nhận. Thỏa thuận hòa chỉ dùng cho hai người.

## 4. Bot và vòng đời

| Mức | Độ sâu tối đa | Thời gian tối đa | Node tối đa |
| --- | ---: | ---: | ---: |
| Dễ | 2 | 80 ms | 5.000 |
| Vừa | 5 | 400 ms | 60.000 |
| Khó | 9 | 1.200 ms | 240.000 |

- Negamax alpha-beta, iterative deepening, PST, sắp xếp nước, quiescence. Giới hạn toàn cây 64 ply và quiescence 8 ply.
- Mọi make/unmake và push/pop history trong nhánh đệ quy có `finally`. Chỉ giữ kết quả vòng độ sâu đã hoàn tất; hết ngân sách sớm vẫn có nước gốc hợp lệ.
- TT có giới hạn 30.000 entry, **chỉ dùng gợi ý thứ tự nước**; không tái sử dụng điểm bỏ qua lịch sử lặp/halfmove.
- Chưa bật lại null move, check extension, LMR hoặc aspiration; chỉ thêm sau khi có kiểm thử đối chứng.
- Worker riêng, envelope `requestId + matchId + revision + rulesVersion`; xác minh nước phản hồi thuộc tập hợp lệ.
- Pause, modal, nền/ẩn tab, rời ván hủy request. Worker treo/lỗi dùng nước hợp lệ đã chuẩn bị; không chạy search đồng bộ trên UI.
- Đồng hồ chỉ tính khi đang chơi và không bị chặn. `pagehide` lưu snapshot hiện tại; draft cập nhật theo commit và định kỳ.

## 5. Persistence và hợp đồng ghép sau

- Storage riêng theo owner. Giữ ended draft và kết quả idempotent theo match ID.
- Chỉ thông báo đã lưu khi ghi thành công. Ghi lỗi có nút thử lại; chỉ đặt cờ hoàn tất sau success.
- Default `CoVua` chạy độc lập. API host: `owner`, `onExit`, `initialMatch?`, `complete?(match): boolean`.
- `complete` phải phản ánh **ghi bền vững thành công**, dùng snapshot profile mới nhất. Không truyền callback ghi rỗng rồi coi là thành công.
- `profile-adapter.ts` giữ helper chuẩn bị/cập nhật profile và có test riêng, nhưng chưa được nối vào ứng dụng. Strict typecheck standalone không kéo các dịch vụ toàn dự án qua adapter này.
- Khi ghép, lưu chi tiết GameRecord (ownerSide, endedAt, reason, players, turns) trong schema được thống nhất. Không phát sao/gacha.
- Xóa profile phải gọi `clearCoVuaData(owner)` cho draft/prefs/party/results. Đây là điều kiện ghép bắt buộc.

## 6. Build, offline và tài nguyên

- Entry `games/CoVua/index.html`, cấu hình `games/CoVua/vite.config.ts`; không sửa config/package dùng chung.
- Nunito WOFF2 và giấy phép, cover WebP, worker và code 3D đều nằm trong gói standalone.
- Lazy-load 3D; chế độ 2D và lobby không cần dựng renderer.
- PWA precache cả worker/font/3D/cover. Thông báo khi tải đủ để dùng offline.
- Bản mới chờ người dùng bấm cập nhật. Trước reload, lưu ván; lỗi lưu phải chặn reload và hiện lý do.
- Khi ghép dùng PWA của host, bỏ đăng ký SW standalone. Phải kiểm lại cache theo base path production thật.

## 7. Kiểm thử và các cổng nghiệm thu

### Đã triển khai, phải giữ xanh khi sửa tiếp

- Perft khai cuộc depth 1–4; Kiwipete 1–4 (4.085.603 ở depth 4); các position 3/4/5; round-trip FEN và nước đặc biệt.
- Regression: rook xuyên quân, nước sau kết thúc, EP key không dùng được/bị ghim, giả outcome/board/history/players, owner cầm Đen, xin thua trong lượt bot.
- Search: unwind khi bị cắt, hết ngân sách ở cả ba mức, hòa trong search; mate-in-1 và ba fixture mate-in-2 có kiểm tra mọi phản hồi hợp lệ.
- Controller: stale reply, duplicate reply, cancel, timeout, illegal move, sai rulesVersion.
- Persistence: tách owner, idempotence, fail/retry, không phát sao; bắt quân EP và không tính phong cấp thành quân bị bắt.
- Browser: 3D chọn đầu quân, đi quân và worker; 2D; phong cấp, nhập thành/chuyền máy; mất context → 2D; portrait; production/offline/manual update.

### Cần nghiệm thu tiếp trước khi công bố sức mạnh/phát hành chung

- Duyệt screenshot gameplay desktop/portrait bởi chủ sản phẩm.
- Tablet/iPhone/Android thật: FPS, pin/nhiệt, cảm ứng, bàn phím và trình đọc màn hình; không suy ra từ viewport giả lập.
- Bộ puzzle đa dạng hơn ba thế tàn cuộc; đối chứng engine độc lập cho các thế ngẫu nhiên và thế cờ chết phức tạp.
- Tournament tối thiểu 128 cặp đổi màu cho từng so sánh Khó–Vừa, Vừa–Dễ và baseline depth-4; khai cuộc khóa trước, fixed-work và deadline thật tách riêng.
- Tách W/D/L/unfinished. Không tính ván cắt ở ply cap thành hòa. CI dùng bootstrap theo cặp; chưa đủ mẫu thì không báo CI. Không suy ra trình độ người chơi từ thắng random/greedy.
- Kiểm thử profile completion, xóa owner, launcher, asset base path, offline và update toàn ứng dụng sau khi ghép.

## 8. Budget và lệnh chạy

Mục tiêu ban đầu ≤90k tam giác, ≤80 draw calls ở thế khai cuộc; render theo nhu cầu, DPR thường tối đa 1,75 và nhẹ = 1. Đo trên canvas DEV, kiểm chứng lại sau khi sửa mesh.

```powershell
node node_modules/vite/bin/vite.js --config games/CoVua/vite.config.ts
node node_modules/typescript/bin/tsc --project games/CoVua/tsconfig.json --pretty false
node node_modules/vitest/vitest.mjs run games/CoVua
node node_modules/vite/bin/vite.js build --config games/CoVua/vite.config.ts
node node_modules/vite/bin/vite.js preview --config games/CoVua/vite.config.ts --host 127.0.0.1 --port 4322 --strictPort
```

DEV: `http://127.0.0.1:4321/`. Production độc lập: `http://127.0.0.1:4322/`.

## 9. Thứ tự tiếp theo

1. Duyệt hình ảnh và trải nghiệm bản standalone này.
2. Review cả Cờ Vua lẫn Cờ Tướng, chốt API host và schema kết quả.
3. Hoàn tất các cổng sức mạnh/thiết bị trong phạm vi phát hành đã chọn.
4. Chỉ ghép launcher/profile/PWA khi đại ca yêu cầu; chạy typecheck/test/build và QA toàn dự án lúc đó.
